# LUNATHREADS — React + Express monolith

A single project containing the React + Tailwind storefront and a small Express backend.

## How data is stored

- Product details and store settings are read/written in `data/products.json`.
- Uploaded product images are saved as real files in `public/images/`.
- The JSON stores only the image path, e.g. `/images/1712345-uuid.webp`.
- Product data is never saved to browser LocalStorage. LocalStorage is used only to remember the light/dark theme.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The React dev server proxies `/api` and `/images` to Express on port 3000.

Default admin password: `luna2026`. Change it by setting `ADMIN_PASSWORD` before starting the server.

Linux/macOS:
```bash
ADMIN_PASSWORD='your-strong-password' npm run dev
```

## Production

```bash
npm install
npm run build
ADMIN_PASSWORD='your-strong-password' npm start
```

Open `http://localhost:3000`. The Express server serves the built React frontend and API from the same origin.

## Admin features

Click the `© 2026 LUNATHREADS` footer to open `/admin`. Sign in, add/edit/delete products, upload images, and update WhatsApp/UPI/store settings. Export/import the catalogue JSON for backup.

## Deployment requirement (important)

This design writes to normal files and folders. Deploy it to a Node.js host with a **persistent writable disk** (for example, a VPS or Render with a persistent disk). Vercel serverless functions do not provide a persistent writable project filesystem, so product edits and uploaded images will not survive reliably on Vercel with this architecture.

For a persistent disk mounted at `/var/data/lunathreads`, set these environment variables on the host:

```env
ADMIN_PASSWORD=your-strong-password
DATA_DIR=/var/data/lunathreads/data
UPLOAD_DIR=/var/data/lunathreads/images
```

The backend creates these directories and the JSON file automatically.
