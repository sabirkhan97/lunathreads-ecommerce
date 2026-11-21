export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({
      error: "ADMIN_PASSWORD is not configured."
    });
  }

  const password = String(req.body?.password || "");

  if (password !== adminPassword) {
    return res.status(401).json({
      error: "Incorrect admin password."
    });
  }

  return res.status(200).json({
    token: adminPassword
  });
}
