import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const FIREBASE_DB_URL = "https://v-cloud-storage-default-rtdb.asia-southeast1.firebasedatabase.app";

async function fetchLibraryMap(): Promise<Record<string, any>> {
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/library.json`);
    if (!res.ok) return {};
    const data = await res.json();
    return data && typeof data === "object" ? data : {};
  } catch (err) {
    console.error("[api-server] Error fetching library from Firebase:", err);
    return {};
  }
}

// GET /library
router.get("/library", async (req: Request, res: Response): Promise<void> => {
  try {
    const map = await fetchLibraryMap();
    let items = Object.values(map).filter((item) => item && typeof item === "object");

    const category = req.query.category as string | undefined;
    const contentType = req.query.contentType as string | undefined;
    const query = req.query.query as string | undefined;

    if (category && category !== "All") {
      const lowerCat = category.toLowerCase();
      items = items.filter((item: any) => {
        const itemCats = Array.isArray(item.categories) ? item.categories : [];
        const navChips = Array.isArray(item.nav_chips) ? item.nav_chips : [];
        return itemCats.some((c: string) => c?.toLowerCase() === lowerCat) ||
               navChips.some((c: string) => c?.toLowerCase() === lowerCat);
      });
    }

    if (contentType && contentType !== "all") {
      const lowerType = contentType.toLowerCase();
      items = items.filter((item: any) => {
        const itemType = (item.contentType || item.media_type || "").toLowerCase();
        if (lowerType === "movie" || lowerType === "film") {
          return itemType === "movie" || itemType === "film";
        }
        if (lowerType === "series" || lowerType === "tv") {
          return itemType === "series" || itemType === "tv" || itemType === "show";
        }
        return itemType === lowerType;
      });
    }

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((item: any) => {
        const title = (item.title || "").toLowerCase();
        const overview = (item.overview || "").toLowerCase();
        const tmdbId = String(item.tmdb_id || "");
        return title.includes(q) || overview.includes(q) || tmdbId.includes(q);
      });
    }

    // Sort by newest added or updated first
    items.sort((a: any, b: any) => (b.addedAt || b.updatedAt || 0) - (a.addedAt || a.updatedAt || 0));

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch library items" });
  }
});

// GET /library/:id
router.get("/library/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const itemId = String(req.params.id);
    const resDb = await fetch(`${FIREBASE_DB_URL}/library/${encodeURIComponent(itemId)}.json`);
    if (!resDb.ok) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const item = await resDb.json();
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch library item" });
  }
});

// POST /library
router.post("/library", async (req: Request, res: Response): Promise<void> => {
  try {
    const item = req.body;
    if (!item || !item.id || !item.title) {
      res.status(400).json({ error: "Item must include an id and title" });
      return;
    }

    const itemId = String(item.id);
    const itemToSave = {
      ...item,
      id: itemId,
      updatedAt: Date.now(),
      addedAt: item.addedAt || Date.now(),
      status: item.status || "published",
    };

    const putRes = await fetch(`${FIREBASE_DB_URL}/library/${encodeURIComponent(itemId)}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemToSave),
    });

    if (!putRes.ok) {
      res.status(500).json({ error: "Failed to save item to database" });
      return;
    }

    res.json(itemToSave);
  } catch (err) {
    res.status(500).json({ error: "Failed to save library item" });
  }
});

// PUT /library/:id
router.put("/library/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const itemId = String(req.params.id);
    const item = req.body;
    if (!item) {
      res.status(400).json({ error: "Payload required" });
      return;
    }

    const itemToSave = {
      ...item,
      id: itemId,
      updatedAt: Date.now(),
    };

    const putRes = await fetch(`${FIREBASE_DB_URL}/library/${encodeURIComponent(itemId)}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemToSave),
    });

    if (!putRes.ok) {
      res.status(500).json({ error: "Failed to update item in database" });
      return;
    }

    res.json(itemToSave);
  } catch (err) {
    res.status(500).json({ error: "Failed to update library item" });
  }
});

// DELETE /library/:id
router.delete("/library/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const itemId = String(req.params.id);
    const delRes = await fetch(`${FIREBASE_DB_URL}/library/${encodeURIComponent(itemId)}.json`, {
      method: "DELETE",
    });

    if (!delRes.ok) {
      res.status(500).json({ error: "Failed to delete item from database" });
      return;
    }

    res.json({ success: true, id: itemId });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete library item" });
  }
});

export default router;
