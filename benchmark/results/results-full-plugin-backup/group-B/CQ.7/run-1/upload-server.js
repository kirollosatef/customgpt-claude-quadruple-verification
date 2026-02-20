const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Directory setup ---
const UPLOAD_DIR = path.join(__dirname, "uploads");
const THUMBNAIL_DIR = path.join(__dirname, "uploads", "thumbnails");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });

// --- Allowed image MIME types ---
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// --- Multer configuration ---
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    cb(null, `${uniqueId}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// --- Thumbnail generation ---
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;

async function createThumbnail(filePath, filename) {
  const thumbnailFilename = `thumb_${filename}`;
  // Normalize extension for sharp output (SVG/TIFF -> PNG thumbnail)
  const ext = path.extname(thumbnailFilename).toLowerCase();
  const needsConversion = [".svg", ".bmp", ".tiff", ".tif"].includes(ext);
  const outputFilename = needsConversion
    ? thumbnailFilename.replace(/\.[^.]+$/, ".png")
    : thumbnailFilename;
  const outputPath = path.join(THUMBNAIL_DIR, outputFilename);

  let pipeline = sharp(filePath).resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
    fit: "inside",
    withoutEnlargement: true,
  });

  if (needsConversion) {
    pipeline = pipeline.png();
  }

  const info = await pipeline.toFile(outputPath);

  return {
    thumbnailFilename: outputFilename,
    thumbnailPath: `/uploads/thumbnails/${outputFilename}`,
    thumbnailWidth: info.width,
    thumbnailHeight: info.height,
    thumbnailSize: info.size,
  };
}

// --- Upload endpoint ---
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided." });
  }

  const { file } = req;

  try {
    const thumbnail = await createThumbnail(file.path, file.filename);

    return res.status(200).json({
      message: "File uploaded successfully.",
      metadata: {
        originalName: file.originalname,
        savedFilename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: `/uploads/${file.filename}`,
        thumbnail,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    // If thumbnail generation fails, the original file was still saved.
    // Clean up the uploaded file on processing failure.
    fs.unlink(file.path, () => {});
    return res.status(500).json({
      error: "Failed to process uploaded image.",
      detail: err.message,
    });
  }
});

// --- Serve uploaded files statically ---
app.use("/uploads", express.static(UPLOAD_DIR));

// --- Multer error handler ---
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: `File exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      LIMIT_UNEXPECTED_FILE: "Invalid file type. Only image files are allowed.",
    };
    return res
      .status(400)
      .json({ error: messages[err.code] || err.message });
  }
  return res.status(500).json({ error: "Internal server error." });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Upload server running on http://localhost:${PORT}`);
  console.log(`POST /upload  — upload an image (field name: "file")`);
  console.log(`Uploads saved to: ${UPLOAD_DIR}`);
});

module.exports = app;
