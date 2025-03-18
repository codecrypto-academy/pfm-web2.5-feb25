
import { Request, Response } from "express";
import { 
    deployBesu, 
    stopBesu, 
    startBesu, 
    deleteBesu, 
    addBesuNode 
} from "../services/besuService";

export const deployNetwork = async (req: Request, res: Response) => {
    try {
        await deployBesu();
        res.json({ message: "🚀 Red Besu desplegada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "❌ Error al desplegar la red Besu", details: error });
    }
};

export const stopNetwork = async (req: Request, res: Response) => {
    try {
        await stopBesu();
        res.json({ message: "🛑 Red Besu detenida correctamente" });
    } catch (error) {
        res.status(500).json({ error: "❌ Error al detener la red Besu", details: error });
    }
};

export const startNetwork = async (req: Request, res: Response) => {
    try {
        await startBesu();
        res.json({ message: "▶️ Red Besu arrancada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "❌ Error al arrancar la red Besu", details: error });
    }
};

export const deleteNetwork = async (req: Request, res: Response) => {
    try {
        await deleteBesu();
        res.json({ message: "🗑️ Red Besu eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: "❌ Error al eliminar la red Besu", details: error });
    }
};

// 📌 Nueva función para agregar un nodo a la red
export const addNode = async (req: Request, res: Response) => {
    try {
        
        await addBesuNode();
        res.json({ message: "➕ Nodo agregado correctamente a la red Besu" });
    } catch (error) {
        res.status(500).json({ error: "❌ Error al agregar un nodo a la red Besu", details: error });
    }
};
