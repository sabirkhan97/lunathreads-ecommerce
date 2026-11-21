import express from "express";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "luna2026";
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "products.json");
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "public", "images");
const DIST_DIR = path.join(__dirname, "dist");

app.use(express.json({ limit: "8mb" }));

const seedCatalog = {
  settings: {
    storeName: "LUNATHREADS",
    tagline: "Curated Everyday & Party Outfits",
    announcement: "New styles, thoughtfully curated",
    whatsapp: "7248152825",
    upiId: "ruslananwar0807@okaxis",
    upiName: "LUNATHREADS",
    paymentTitle: "Pay by UPI — get free shipping",
    paymentDescription: "After we confirm your order on WhatsApp, pay with GPay, PhonePe, Paytm or any UPI app."
  },
  products: []
};

async function ensureStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(seedCatalog, null, 2), "utf8");
  }
}

async function readCatalog() {
  await ensureStorage();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeCatalog(catalog) {
  await ensureStorage();
  const tempFile = `${DATA_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(catalog, null, 2), "utf8");
  await fs.rename(tempFile, DATA_FILE);
}

function safeCompare(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!safeCompare(token, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "Admin session invalid. Please log in again." });
  }
  next();
}

const allowedImageTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif"
};

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Public storefront reads the JSON catalogue.
app.get("/api/catalog", async (_req, res) => {
  try {
    res.json(await readCatalog());
  } catch (error) {
    console.error("Catalogue read failed:", error);
    res.status(500).json({ error: "Could not read data/products.json." });
  }
});

app.post("/api/admin/login", (req, res) => {
  const password = String(req.body?.password || "");
  if (!safeCompare(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "Incorrect admin password." });
  }
  // Simple bearer token for this small private admin panel.
  res.json({ token: password });
});

// Admin uploads an image; the server writes a real file to public/images.
// The catalogue JSON stores only the returned /images/... path.
app.post("/api/admin/upload", requireAdmin, async (req, res) => {
  try {
    const mime = String(req.body?.mime || "");
    const extension = allowedImageTypes[mime];
    const dataUrl = String(req.body?.dataUrl || "");
    const base64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
    if (!extension || !base64 || !dataUrl.startsWith(`data:${mime};base64,`)) {
      return res.status(400).json({ error: "Use a JPG, PNG, WEBP, GIF or AVIF image." });
    }
    const bytes = Buffer.from(base64, "base64");
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: "Image must be smaller than 5 MB." });
    }
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes, { flag: "wx" });
    res.status(201).json({ image: `/images/${filename}` });
  } catch (error) {
    console.error("Image upload failed:", error);
    res.status(500).json({ error: "Could not save image in public/images." });
  }
});

// Admin updates the catalogue JSON file.
app.put("/api/catalog", requireAdmin, async (req, res) => {
  try {
    const catalog = req.body;
    if (!catalog || typeof catalog !== "object" || !Array.isArray(catalog.products) || !catalog.settings || typeof catalog.settings !== "object") {
      return res.status(400).json({ error: "Invalid catalogue JSON." });
    }
    if (Buffer.byteLength(JSON.stringify(catalog), "utf8") > 2 * 1024 * 1024) {
      return res.status(413).json({ error: "Catalogue JSON is too large." });
    }
    await writeCatalog(catalog);
    res.json(catalog);
  } catch (error) {
    console.error("Catalogue write failed:", error);
    res.status(500).json({ error: "Could not update data/products.json." });
  }
});

// Uploaded images are public product assets.
app.use("/images", express.static(UPLOAD_DIR, { fallthrough: false, maxAge: "7d" }));

// Production React build.
app.use(express.static(DIST_DIR));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(DIST_DIR, "index.html"), (error) => error && next(error));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Server error." });
});

await ensureStorage();
app.listen(PORT, () => {
  console.log(`LUNATHREADS running at http://localhost:${PORT}`);
  console.log(`Catalogue JSON: ${DATA_FILE}`);
  console.log(`Product images: ${UPLOAD_DIR}`);
});
