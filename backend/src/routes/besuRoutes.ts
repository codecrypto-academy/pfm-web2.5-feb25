import { Router } from "express";
import { deployNetwork, stopNetwork, startNetwork, deleteNetwork } from "../controllers/besuController";

const router = Router();

router.post("/deploy", deployNetwork);
router.post("/stop", stopNetwork);
router.post("/start", startNetwork);
router.delete("/delete", deleteNetwork);

export default router;
