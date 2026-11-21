import crypto from "crypto";

const allowedTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");

  if (!adminPassword || token !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized admin." });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!githubToken || !owner || !repo) {
    return res.status(500).json({
      error: "GitHub environment variables are missing."
    });
  }

  try {
    const mime = String(req.body?.mime || "");
    const dataUrl = String(req.body?.dataUrl || "");
    const extension = allowedTypes[mime];

    if (!extension || !dataUrl.startsWith(`data:${mime};base64,`)) {
      return res.status(400).json({
        error: "Unsupported image format."
      });
    }

    const base64 = dataUrl.split(",")[1];
    const imageBuffer = Buffer.from(base64, "base64");

    if (!imageBuffer.length || imageBuffer.length > 3 * 1024 * 1024) {
      return res.status(413).json({
        error: "Image must be smaller than 3 MB."
      });
    }

    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const filePath = `public/images/${filename}`;

    const githubResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Upload product image ${filename}`,
          content: imageBuffer.toString("base64"),
          branch
        })
      }
    );

    const result = await githubResponse.json();

    if (!githubResponse.ok) {
      console.error("GitHub upload error:", result);

      return res.status(githubResponse.status).json({
        error: result.message || "GitHub image upload failed."
      });
    }

    return res.status(201).json({
      image: `/images/${filename}`
    });

  } catch (error) {
    console.error("Image upload error:", error);

    return res.status(500).json({
      error: "Image upload failed."
    });
  }
}
