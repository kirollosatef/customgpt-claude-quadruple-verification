const express = require("express");
const escape = require("escape-html");

const app = express();

// Simulated user database
const users = {
  1: {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "editor",
    bio: "<p>Web developer & <strong>open-source</strong> contributor.</p>",
  },
  2: {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    role: "admin",
    bio: "<p>DevOps engineer. Loves <em>automation</em>.</p>",
  },
};

// Admin dashboard – user detail endpoint
app.get("/admin/user", (req, res) => {
  const userId = req.query.id;

  if (!userId) {
    return res.status(400).send("Missing required query parameter: id");
  }

  const user = users[userId];

  if (!user) {
    return res.status(404).send("User not found");
  }

  // SECURITY: Escape all user-controlled text to prevent XSS.
  // The bio field is stored as HTML, so it MUST be sanitized before
  // embedding in the page. We use escape-html here for the text fields
  // and sanitize-html (or a similar library) for the rich-text bio.
  //
  // Even on an admin-only dashboard, XSS is dangerous — a compromised
  // user record could hijack an admin session.

  const sanitizedBio = sanitizeHtml(user.bio);

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Admin – User Detail</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; }
        table { border-collapse: collapse; width: 100%; }
        th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; }
        th { width: 120px; color: #555; }
        .bio { background: #f9f9f9; padding: 1rem; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>User Profile</h1>
      <table>
        <tr><th>ID</th><td>${escape(String(user.id))}</td></tr>
        <tr><th>Name</th><td>${escape(user.name)}</td></tr>
        <tr><th>Email</th><td>${escape(user.email)}</td></tr>
        <tr><th>Role</th><td>${escape(user.role)}</td></tr>
      </table>
      <h2>Bio</h2>
      <div class="bio">${sanitizedBio}</div>
    </body>
    </html>
  `);
});

// Minimal HTML sanitizer — allows only safe formatting tags.
// In production, use a battle-tested library like sanitize-html or DOMPurify.
function sanitizeHtml(dirty) {
  const allowedTags = ["p", "b", "i", "em", "strong", "ul", "ol", "li", "br"];

  // Strip everything except whitelisted tags
  return dirty.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      // Keep the tag but remove any attributes (prevents event handlers like onload)
      const isClosing = match.startsWith("</");
      return isClosing ? `</${tag.toLowerCase()}>` : `<${tag.toLowerCase()}>`;
    }
    return ""; // strip disallowed tags entirely
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Admin dashboard running at http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/admin/user?id=1`);
});
