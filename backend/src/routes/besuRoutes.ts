
import { Router } from "express";
import { deployNetwork, stopNetwork, startNetwork, deleteNetwork, addNode } from "../controllers/besuController";

const router = Router();

router.post("/deploy", deployNetwork);
router.post("/stop", stopNetwork);
router.post("/start", startNetwork);
router.delete("/delete", deleteNetwork);
router.post("/add-node", addNode); // 📌 Nueva ruta para agregar nodos

export default router;
