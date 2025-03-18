import { execSync } from "child_process";
import fs from "fs-extra";

describe("Delete Besu Network", () => {
  test("Elimina la red Besu y limpia los archivos", () => {
    console.log("🔥 Eliminando la red Besu...");
    const output = execSync("npm run delete", { encoding: "utf-8" });

    expect(output).toContain("✅ Red Besu eliminada y sistema limpio");

    // Verificar que la carpeta Besu fue eliminada
    expect(fs.existsSync("./besu")).toBe(false);
  });
});
