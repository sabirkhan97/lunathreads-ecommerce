import crypto from "crypto";

const API = "https://api.github.com";

function githubHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

function getConfig() {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = process.env;

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    throw new Error("GitHub environment variables are missing.");
  }

  return {
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || "main"
  };
}

async function readCatalog(config) {
  const url = `${API}/repos/${config.owner}/${config.repo}/contents/data/products.json?ref=${config.branch}`;

  const response = await fetch(url, {
    headers: githubHeaders()
  });

  if (!response.ok) {
    throw new Error("Could not read products.json from GitHub.");
  }

  const file = await response.json();
  const content = Buffer.from(file.content, "base64").toString("utf8");

  return { catalog: JSON.parse(content), sha: file.sha };
}

function safeCompare(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  return left.length === right.length &&
    crypto.timingSafeEqual(left, right);
}

export default async function handler(req, res) {
  try {
    const config = getConfig();

    if (req.method === "GET") {
      const { catalog } = await readCatalog(config);
      return res.status(200).json(catalog);
    }

    if (req.method === "PUT") {
      const adminPassword = process.env.ADMIN_PASSWORD;
      const token = (req.headers.authorization || "").replace(/^Bearer /, "");

      if (!adminPassword || !safeCompare(token, adminPassword)) {
        return res.status(401).json({ error: "Unauthorized admin." });
      }

      const catalog = req.body;

      if (
        !catalog ||
        typeof catalog !== "object" ||
        !Array.isArray(catalog.products) ||
        !catalog.settings ||
        typeof catalog.settings !== "object"
      ) {
        return res.status(400).json({ error: "Invalid catalogue JSON." });
      }

      if (Buffer.byteLength(JSON.stringify(catalog), "utf8") > 2 * 1024 * 1024) {
        return res.status(413).json({ error: "Catalogue is too large." });
      }

      const { sha } = await readCatalog(config);

      const response = await fetch(
        `${API}/repos/${config.owner}/${config.repo}/contents/data/products.json`,
        {
          method: "PUT",
          headers: {
            ...githubHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: "Update LunaThreads product catalogue",
            content: Buffer.from(
              JSON.stringify(catalog, null, 2)
            ).toString("base64"),
            sha,
            branch: config.branch
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: result.message || "Could not update catalogue."
        });
      }

      return res.status(200).json(catalog);
    }

    return res.status(405).json({ error: "Method not allowed." });

  } catch (error) {
    console.error("Catalog API error:", error);

    return res.status(500).json({
      error: error.message || "Server error."
    });
  }
}
