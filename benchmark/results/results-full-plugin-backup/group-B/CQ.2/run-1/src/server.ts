import app from "./app";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.listen(PORT, () => {
  console.log(`Blog API running on http://localhost:${PORT}`);
});
