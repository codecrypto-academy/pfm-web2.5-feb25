import { execSync } from "child_process";

describe("Start Besu Network", () => {
  test("Reinicia todos los nodos previamente detenidos", () => {
    console.log("🔄 Iniciando la red Besu...");
    const output = execSync("npm run start", { encoding: "utf-8" });

    expect(output).toContain("✅ Todos los nodos han sido iniciados");
  });
});
