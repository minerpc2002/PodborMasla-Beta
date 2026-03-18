import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for API key on startup
const SERVER_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!SERVER_API_KEY || SERVER_API_KEY === 'MY_GEMINI_API_KEY' || SERVER_API_KEY === 'undefined') {
  console.error("CRITICAL: GEMINI_API_KEY is not set in the server environment. Gemini AI features will NOT work.");
  console.log("Current environment variables:", Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')));
} else {
  const keyPreview = `${SERVER_API_KEY.substring(0, 4)}...${SERVER_API_KEY.substring(SERVER_API_KEY.length - 4)}`;
  console.log(`GEMINI_API_KEY detected in server environment: ${keyPreview}`);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy route for Ravenol and other APIs
  app.get("/api/proxy/ravenol", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      console.log(`Proxying request to: ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Proxy fetch failed: ${response.status}`, errorText.substring(0, 200));
        return res.status(response.status).send(errorText);
      }
      
      const data = await response.arrayBuffer();
      res.send(Buffer.from(data));
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch from external API" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
