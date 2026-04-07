import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bikesRouter from "./bikes";
import ridesRouter from "./rides";
import maintenanceRouter from "./maintenance";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bikesRouter);
router.use(ridesRouter);
router.use(maintenanceRouter);
router.use(statsRouter);

export default router;
