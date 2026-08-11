import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const TMDB_API_KEYS = [
  "ba0701a4c153282eb8fc8207cade9afa",
  "3fd2be6f0c70a2a598f084dd23b0ee8f",
  "15d260044f210d6a042d5732b71e113f",
];
const TMDB_BASE = "https://api.themoviedb.org/3";

async function tmdbFetch(pathAndQuery: string) {
  let lastError = new Error("TMDB API Error");
  for (const key of TMDB_API_KEYS) {
    try {
      const sep = pathAndQuery.includes("?") ? "&" : "?";
      const url = `${TMDB_BASE}${pathAndQuery}${sep}api_key=${key}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError;
}

// GET /tmdb/search?query=...&type=movie|tv
router.get("/tmdb/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.query as string;
    const type = (req.query.type as string) || "movie";
    if (!q) {
      res.status(400).json({ error: "Query parameter is required" });
      return;
    }

    const path = `/search/${type === "series" ? "tv" : type}?query=${encodeURIComponent(q)}`;
    const data = await tmdbFetch(path);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "TMDB search failed" });
  }
});

// GET /tmdb/details?id=...&type=movie|tv
router.get("/tmdb/details", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.query.id as string;
    const type = (req.query.type as string) || "movie";
    if (!id) {
      res.status(400).json({ error: "ID parameter is required" });
      return;
    }

    const path = `/${type === "series" ? "tv" : type}/${encodeURIComponent(id)}?append_to_response=watch/providers,credits,images`;
    const data = await tmdbFetch(path);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "TMDB details fetch failed" });
  }
});

export default router;
