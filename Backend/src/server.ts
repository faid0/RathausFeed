import app from "./app.js";

const HOSTNAME = process.env.HOSTNAME || "localhost";
const PORT = Number(process.env.PORT) || 8000;

app.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});
