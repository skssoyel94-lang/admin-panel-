import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const FIREBASE_DB_URL = "https://v-cloud-storage-default-rtdb.asia-southeast1.firebasedatabase.app";

// GET /notifications
router.get("/notifications", async (_req: Request, res: Response): Promise<void> => {
  try {
    const resDb = await fetch(`${FIREBASE_DB_URL}/notifications.json`);
    if (!resDb.ok) {
      res.json([]);
      return;
    }
    const data = await resDb.json();
    if (!data || typeof data !== "object") {
      res.json([]);
      return;
    }

    const notifications = Object.values(data)
      .filter((n: any) => n && typeof n === "object")
      .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// POST /notifications
router.post("/notifications", async (req: Request, res: Response): Promise<void> => {
  try {
    const notif = req.body;
    if (!notif || !notif.title) {
      res.status(400).json({ error: "Notification title is required" });
      return;
    }

    const id = notif.id || Date.now().toString();
    const itemToSave = {
      ...notif,
      id,
      timestamp: notif.timestamp || Date.now(),
    };

    const putRes = await fetch(`${FIREBASE_DB_URL}/notifications/${encodeURIComponent(id)}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemToSave),
    });

    if (!putRes.ok) {
      res.status(500).json({ error: "Failed to save notification" });
      return;
    }

    res.json(itemToSave);
  } catch (err) {
    res.status(500).json({ error: "Failed to post notification" });
  }
});

export default router;
