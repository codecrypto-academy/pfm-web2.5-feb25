import { execSync } from "child_process";

describe("Stop Besu Network", () => {
  test("Detiene todos los nodos sin eliminarlos", () => {
    console.log("🛑 Deteniendo la red Besu...");
    const output = execSync("npm run stop", { encoding: "utf-8" });

    expect(output).toContain("✅ Todos los nodos de la red Besu han sido detenidos");
  });
});
