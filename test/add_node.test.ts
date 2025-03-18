import { execSync } from "child_process";
import fs from "fs-extra";

describe("Add a New Node to Besu", () => {
  test("Agrega un nuevo nodo a la red", () => {
    console.log("➕ Añadiendo nodo4 a la red...");
    const output = execSync("npm run add-node -- 4", { encoding: "utf-8" });

    expect(output).toContain("✅ Nodo nodo4 agregado a la red");

    // Verificar que la carpeta del nuevo nodo existe
    expect(fs.existsSync("./besu/nodo4")).toBe(true);
  });
});
