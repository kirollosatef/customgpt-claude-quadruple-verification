const Database = require("better-sqlite3");
const nodemailer = require("nodemailer");
const path = require("path");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CONFIG = {
  api: {
    url: "https://jsonplaceholder.typicode.com/users",
    timeoutMs: 10_000,
  },
  db: {
    path: path.join(__dirname, "pipeline.db"),
  },
  retry: {
    maxAttempts: 3,
    baseDelayMs: 500, // exponential back-off: 500, 1000, 2000
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || "pipeline@example.com",
      pass: process.env.SMTP_PASS || "changeme",
    },
  },
  notification: {
    from: process.env.NOTIFY_FROM || "pipeline@example.com",
    to: process.env.NOTIFY_TO || "admin@example.com",
  },
};

// ---------------------------------------------------------------------------
// Step 1 – Fetch data from external API
// ---------------------------------------------------------------------------
async function fetchData(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Step 2 – Validate response schema
// ---------------------------------------------------------------------------
const REQUIRED_FIELDS = {
  id: "number",
  name: "string",
  username: "string",
  email: "string",
};

function validateSchema(data) {
  if (!Array.isArray(data)) {
    throw new Error("Schema validation failed: expected an array");
  }
  if (data.length === 0) {
    throw new Error("Schema validation failed: empty dataset");
  }

  const errors = [];
  for (const [idx, item] of data.entries()) {
    for (const [field, expectedType] of Object.entries(REQUIRED_FIELDS)) {
      if (!(field in item)) {
        errors.push(`Item ${idx}: missing required field "${field}"`);
      } else if (typeof item[field] !== expectedType) {
        errors.push(
          `Item ${idx}: field "${field}" expected ${expectedType}, got ${typeof item[field]}`
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Schema validation failed:\n  ${errors.join("\n  ")}`
    );
  }

  return data;
}

// ---------------------------------------------------------------------------
// Step 3 – Transform data
// ---------------------------------------------------------------------------
function transformData(data) {
  return data.map((user) => {
    const city = user.address?.city || "Unknown";
    const company = user.company?.name || "Unknown";
    return {
      id: user.id,
      name: user.name.trim(),
      username: user.username.toLowerCase(),
      email: user.email.toLowerCase(),
      city,
      company,
      fetchedAt: new Date().toISOString(),
    };
  });
}

// ---------------------------------------------------------------------------
// Step 4 – Write to database (SQLite)
// ---------------------------------------------------------------------------
function initDatabase(dbPath) {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY,
      name        TEXT    NOT NULL,
      username    TEXT    NOT NULL,
      email       TEXT    NOT NULL,
      city        TEXT,
      company     TEXT,
      fetched_at  TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

function writeToDatabase(db, records) {
  const upsert = db.prepare(`
    INSERT INTO users (id, name, username, email, city, company, fetched_at)
    VALUES (@id, @name, @username, @email, @city, @company, @fetchedAt)
    ON CONFLICT(id) DO UPDATE SET
      name       = excluded.name,
      username   = excluded.username,
      email      = excluded.email,
      city       = excluded.city,
      company    = excluded.company,
      fetched_at = excluded.fetched_at
  `);

  const insertAll = db.transaction((rows) => {
    for (const row of rows) {
      upsert.run(row);
    }
  });

  insertAll(records);
  return records.length;
}

// ---------------------------------------------------------------------------
// Step 5 – Send notification (email via SMTP)
// ---------------------------------------------------------------------------
async function sendNotification({ success, recordCount, error }) {
  const transport = nodemailer.createTransport(CONFIG.smtp);

  const subject = success
    ? `Pipeline SUCCESS – ${recordCount} records processed`
    : `Pipeline FAILURE – ${error?.message || "unknown error"}`;

  const text = success
    ? [
        "Pipeline completed successfully.",
        "",
        `Records upserted: ${recordCount}`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join("\n")
    : [
        "Pipeline failed after exhausting all retries.",
        "",
        `Error: ${error?.message}`,
        `Stack: ${error?.stack || "N/A"}`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join("\n");

  try {
    await transport.sendMail({
      from: CONFIG.notification.from,
      to: CONFIG.notification.to,
      subject,
      text,
    });
    console.log(`[notify] Email sent: ${subject}`);
  } catch (err) {
    // Notification failure is logged but must not crash the pipeline.
    console.error(`[notify] Failed to send email: ${err.message}`);
    console.log(`[notify] Would have sent → Subject: ${subject}`);
    console.log(`[notify] Body:\n${text}`);
  }
}

// ---------------------------------------------------------------------------
// Retry helper – wraps steps 3 & 4
// ---------------------------------------------------------------------------
async function withRetry(label, fn, maxAttempts, baseDelayMs) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(
        `[retry] ${label} attempt ${attempt}/${maxAttempts} failed: ${err.message}`
      );
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * 2 ** (attempt - 1);
        console.log(`[retry] Waiting ${delay}ms before next attempt…`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Pipeline orchestrator
// ---------------------------------------------------------------------------
async function runPipeline() {
  console.log("=== Pipeline started ===\n");
  let db;

  try {
    // Step 1 – Fetch
    console.log("[step 1] Fetching data from API…");
    const raw = await fetchData(CONFIG.api.url, CONFIG.api.timeoutMs);
    console.log(`[step 1] Received ${raw.length} records.\n`);

    // Step 2 – Validate
    console.log("[step 2] Validating response schema…");
    const valid = validateSchema(raw);
    console.log(`[step 2] Validation passed for ${valid.length} records.\n`);

    // Steps 3 & 4 wrapped in retry logic
    let recordCount;
    await withRetry(
      "transform+write",
      () => {
        // Step 3 – Transform
        console.log("[step 3] Transforming data…");
        const transformed = transformData(valid);
        console.log(`[step 3] Transformed ${transformed.length} records.\n`);

        // Step 4 – Write to DB
        console.log("[step 4] Writing to database…");
        db = initDatabase(CONFIG.db.path);
        recordCount = writeToDatabase(db, transformed);
        console.log(`[step 4] Upserted ${recordCount} records.\n`);
      },
      CONFIG.retry.maxAttempts,
      CONFIG.retry.baseDelayMs
    );

    // Step 5 – Notify success
    console.log("[step 5] Sending success notification…");
    await sendNotification({ success: true, recordCount });
    console.log("\n=== Pipeline completed successfully ===");
  } catch (err) {
    // Step 5 – Notify failure
    console.error(`\n[pipeline] Fatal error: ${err.message}`);
    console.log("[step 5] Sending failure notification…");
    await sendNotification({ success: false, error: err });
    console.log("\n=== Pipeline completed with errors ===");
    process.exitCode = 1;
  } finally {
    if (db) db.close();
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
runPipeline();
