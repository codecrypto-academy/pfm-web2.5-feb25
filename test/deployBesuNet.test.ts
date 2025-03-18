import { execSync } from "child_process";
import fs from "fs-extra";

describe("Deploy Besu Network", () => {
  test("Despliega la red correctamente", () => {
    console.log("🚀 Desplegando la red Besu...");
    const output = execSync("npm run deploy", { encoding: "utf-8" });
    
    expect(output).toContain("✅ Red Besu desplegada con éxito");

    // Verificar que la carpeta de Besu se creó
    expect(fs.existsSync("./besu")).toBe(true);
  });
});
