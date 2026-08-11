import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const FIREBASE_DB_URL = "https://v-cloud-storage-default-rtdb.asia-southeast1.firebasedatabase.app";

// POST /publish
router.post("/publish", async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    if (!payload || !payload.title) {
      res.status(400).json({ error: "Title is required to publish content" });
      return;
    }

    const id = payload.id || Date.now().toString();
    const itemToSave = {
      ...payload,
      id,
      addedAt: payload.addedAt || Date.now(),
      updatedAt: Date.now(),
      status: "published",
    };

    const putRes = await fetch(`${FIREBASE_DB_URL}/library/${encodeURIComponent(id)}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemToSave),
    });

    if (!putRes.ok) {
      res.status(500).json({ error: "Failed to publish content to database" });
      return;
    }

    res.json({ success: true, item: itemToSave });
  } catch (err) {
    res.status(500).json({ error: "Failed to publish item" });
  }
});

export default router;
