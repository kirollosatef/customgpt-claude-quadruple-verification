const express = require('express');
const app = express();

// Simulated database fetch — replace with your actual DB query
async function getCommentsByPostId(postId) {
  // Example: return db.query('SELECT author, body FROM comments WHERE post_id = $1', [postId]);
  return [];
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.get('/comments/:postId', async (req, res) => {
  const postId = req.params.postId;

  try {
    const comments = await getCommentsByPostId(postId);

    const commentItems = comments.map(c => `
      <div class="comment">
        <h3>${escapeHtml(c.author)}</h3>
        <p>${escapeHtml(c.body)}</p>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Comments for Post ${escapeHtml(postId)}</title>
      </head>
      <body>
        <h1>Comments for Post ${escapeHtml(postId)}</h1>
        ${commentItems || '<p>No comments yet.</p>'}
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
