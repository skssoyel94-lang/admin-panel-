import { Router, type IRouter } from "express";
import healthRouter from "./health";
import libraryRouter from "./library";
import publishRouter from "./publish";
import categoriesRouter from "./categories";
import notificationsRouter from "./notifications";
import versionRouter from "./version";
import tmdbRouter from "./tmdb";

const router: IRouter = Router();

router.use(healthRouter);
router.use(libraryRouter);
router.use(publishRouter);
router.use(categoriesRouter);
router.use(notificationsRouter);
router.use(versionRouter);
router.use(tmdbRouter);

export default router;
