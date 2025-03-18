import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import besuRoutes from "./routes/besuRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/besu", besuRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
});
