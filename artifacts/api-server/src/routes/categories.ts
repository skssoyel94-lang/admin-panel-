import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const FIREBASE_DB_URL = "https://v-cloud-storage-default-rtdb.asia-southeast1.firebasedatabase.app";

// GET /categories
router.get("/categories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const resDb = await fetch(`${FIREBASE_DB_URL}/library.json`);
    if (!resDb.ok) {
      res.json([]);
      return;
    }
    const data = await resDb.json();
    if (!data || typeof data !== "object") {
      res.json([]);
      return;
    }

    const categorySet = new Set<string>();
    Object.values(data).forEach((item: any) => {
      if (item && typeof item === "object") {
        if (Array.isArray(item.categories)) {
          item.categories.forEach((cat: string) => {
            if (cat && typeof cat === "string") categorySet.add(cat.trim());
          });
        }
        if (Array.isArray(item.nav_chips)) {
          item.nav_chips.forEach((chip: string) => {
            if (chip && typeof chip === "string") categorySet.add(chip.trim());
          });
        }
      }
    });

    const categories = Array.from(categorySet);
    if (!categories.includes("Action")) categories.push("Action");
    if (!categories.includes("Drama")) categories.push("Drama");
    if (!categories.includes("Comedy")) categories.push("Comedy");
    if (!categories.includes("Sci-Fi")) categories.push("Sci-Fi");

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default router;
