import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const FIREBASE_DB_URL = "https://v-cloud-storage-default-rtdb.asia-southeast1.firebasedatabase.app";

// GET /version
router.get("/version", async (_req: Request, res: Response): Promise<void> => {
  try {
    const resDb = await fetch(`${FIREBASE_DB_URL}/app_version.json`);
    if (!resDb.ok) {
      res.json({ version: "1.0.0", updatedAt: Date.now() });
      return;
    }
    const version = await resDb.json();
    res.json({
      version: typeof version === "string" ? version : "1.0.0",
      updatedAt: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch version" });
  }
});

// POST /version
router.post("/version", async (_req: Request, res: Response): Promise<void> => {
  try {
    const newVersion = Date.now().toString();
    const putRes = await fetch(`${FIREBASE_DB_URL}/app_version.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newVersion),
    });

    if (!putRes.ok) {
      res.status(500).json({ error: "Failed to bump version" });
      return;
    }

    res.json({ version: newVersion, updatedAt: Date.now() });
  } catch (err) {
    res.status(500).json({ error: "Failed to bump app version" });
  }
});

export default router;
