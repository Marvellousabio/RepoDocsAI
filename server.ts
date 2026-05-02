import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";
import { connectToDatabase } from "./database/index.js";
import {
  createRepository,
  getRepositoryByFullName,
  updateRepositoryAnalysis,
  getRepositories,
  getRepositoryStats,
  getPopularRepositories
} from "./database/services/repositoryService.js";
import {
  apiLimiter,
  analysisLimiter,
  validateRepositoryUrl,
  validateRepositoryQuery,
  securityHeaders,
  errorHandler
} from "./middleware/security.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Connect to MongoDB first
  await connectToDatabase();

  const app = express();
  const PORT = 3000;

  // Security middleware
  app.use(securityHeaders);
  app.use(express.json({ limit: '10mb' })); // Limit payload size

  // API routes
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/analyze",
    analysisLimiter,
    validateRepositoryUrl,
    async (req: Request, res: Response) => {
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
      const fullName = `${owner}/${repo.replace(".git", "")}`;
      const cleanRepo = repo.replace(".git", "");

      // Check if repository already exists
      const existingRepo = await getRepositoryByFullName(fullName);
      if (existingRepo) {
        return res.json({
          metadata: {
            name: existingRepo.name,
            full_name: existingRepo.fullName,
            description: existingRepo.description,
            stars: existingRepo.stars,
            forks: existingRepo.forks,
            language: existingRepo.language,
            owner: {
              login: existingRepo.owner.login,
              avatar_url: existingRepo.owner.avatarUrl,
            }
          },
          fileTree: existingRepo.fileTree,
          fromCache: true
        });
      }

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
        size: item.size,
        downloadUrl: item.download_url
      }));

      // Save to database
      const repositoryData = {
        githubId: repoData.id,
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        url: repoData.url,
        htmlUrl: repoData.html_url,
        cloneUrl: repoData.clone_url,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        size: repoData.size,
        createdAt: new Date(repoData.created_at),
        updatedAt: new Date(repoData.updated_at),
        pushedAt: repoData.pushed_at ? new Date(repoData.pushed_at) : undefined,
        owner: {
          login: repoData.owner.login,
          id: repoData.owner.id,
          avatarUrl: repoData.owner.avatar_url,
          htmlUrl: repoData.owner.html_url,
          type: repoData.owner.type
        },
        topics: repoData.topics,
        license: repoData.license ? {
          key: repoData.license.key,
          name: repoData.license.name,
          spdxId: repoData.license.spdx_id,
          url: repoData.license.url
        } : undefined,
        fileTree
      };

      await createRepository(repositoryData);

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
        saved: true
      });
    } catch (error: any) {
      console.error("Analysis error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to analyze repository. It might be private or invalid." });
    }
  });

  // Get repositories with filtering and pagination
  app.get("/api/repositories",
    apiLimiter,
    validateRepositoryQuery,
    async (req: Request, res: Response) => {
    try {
      const {
        owner,
        language,
        minStars,
        maxStars,
        analysisStatus,
        sortBy,
        sortOrder,
        limit,
        offset
      } = req.query;

      const query = {
        owner: owner as string,
        language: language as string,
        minStars: minStars ? parseInt(minStars as string) : undefined,
        maxStars: maxStars ? parseInt(maxStars as string) : undefined,
        analysisStatus: analysisStatus as 'pending' | 'completed' | 'failed',
        sortBy: sortBy as 'stars' | 'updatedAt' | 'createdAt',
        sortOrder: sortOrder as 'asc' | 'desc',
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0
      };

      const result = await getRepositories(query);
      res.json(result);
    } catch (error: any) {
      console.error("Get repositories error:", error.message);
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  });

  // Get popular repositories
  app.get("/api/repositories/popular", apiLimiter, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const repositories = await getPopularRepositories(limit);
      res.json({ repositories });
    } catch (error: any) {
      console.error("Get popular repositories error:", error.message);
      res.status(500).json({ error: "Failed to fetch popular repositories" });
    }
  });

  // Get repository statistics
  app.get("/api/repositories/stats", apiLimiter, async (req: Request, res: Response) => {
    try {
      const stats = await getRepositoryStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Get repository stats error:", error.message);
      res.status(500).json({ error: "Failed to fetch repository statistics" });
    }
  });

  // Get specific repository by full name
  app.get("/api/repositories/:owner/:repo", apiLimiter, async (req: Request, res: Response) => {
    try {
      const { owner, repo } = req.params;
      const fullName = `${owner}/${repo}`;

      const repository = await getRepositoryByFullName(fullName);
      if (!repository) {
        return res.status(404).json({ error: "Repository not found" });
      }

      res.json({
        metadata: {
          name: repository.name,
          full_name: repository.fullName,
          description: repository.description,
          stars: repository.stars,
          forks: repository.forks,
          language: repository.language,
          owner: {
            login: repository.owner.login,
            avatar_url: repository.owner.avatarUrl,
          }
        },
        fileTree: repository.fileTree,
        analysisStatus: repository.analysisStatus,
        lastAnalyzed: repository.lastAnalyzed
      });
    } catch (error: any) {
      console.error("Get repository error:", error.message);
      res.status(500).json({ error: "Failed to fetch repository" });
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

  // Error handling middleware (must be last)
  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
