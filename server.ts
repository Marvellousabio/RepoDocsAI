import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/analyze", async (req: Request, res: Response) => {
    const { repoUrl } = req.body;
    
    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    try {
      // Parse GitHub URL (e.g., https://github.com/owner/repo)
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        return res.status(400).json({ error: "Invalid GitHub URL" });
      }

      const [_, owner, repo] = match;
      const cleanRepo = repo.replace(".git", "");

      // Fetch repo metadata
      const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      const repoData = repoResponse.data;

      // Fetch file tree (top level)
      const contentsResponse = await axios.get(`https://api.github.com/repos/${owner}/${cleanRepo}/contents`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      const fileTree = contentsResponse.data.map((item: any) => ({
        name: item.name,
        type: item.type,
        path: item.path,
      }));

      res.json({
        metadata: {
          name: repoData.name,
          full_name: repoData.full_name,
          description: repoData.description,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          language: repoData.language,
          owner: {
            login: repoData.owner.login,
            avatar_url: repoData.owner.avatar_url,
          }
        },
        fileTree,
      });
    } catch (error: any) {
      console.error("Analysis error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to analyze repository. It might be private or invalid." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
