import { Request, Response } from "express";
import { deployNetwork, stopNetwork, startNetwork, deleteNetwork } from "../services/besuService";

export const deployNetwork = async (req: Request, res: Response) => {
    try {
        await deployNetwork();
        res.json({ message: "🚀 Red Besu desplegada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "❌ Error al desplegar la red Besu", details: error });
    }
};

export const stopNetwork = async (req: Request, res: Response) => {
    try {
        await stopNetwork();
        res.json({ message: "🛑 Red Besu detenida correctamente" });
    } catch (error) {
        res.status(500).json({ error: "❌ Error al detener la red Besu", details: error });
    }
};

export const startNetwork = async (req: Request, res: Response) => {
    try {
        await startNetwork();
        res.json({ message: "▶️ Red Besu arrancada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "❌ Error al arrancar la red Besu", details: error });
    }
};

export const deleteNetwork = async (req: Request, res: Response) => {
    try {
        await deleteNetwork();
        res.json({ message: "🗑️ Red Besu eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "❌ Error al eliminar la red Besu", details: error });
    }
};
