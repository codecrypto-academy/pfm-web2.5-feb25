import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";

interface ContainerInfo {
  id: string;
  name: string;
  state: string;
  networks: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const networkName = searchParams.get("network");

  if (networkName) {
    // Obtener todos los contenedores y filtrar por red
    return new Promise((resolve) => {
      exec(
        "docker ps -a --format '{{.ID}} {{.Names}} {{.State}} {{.Networks}}'",
        (error, stdout) => {
          if (error) {
            resolve(
              NextResponse.json(
                { error: "Error al obtener la lista de contenedores" },
                { status: 500 }
              )
            );
          } else {
            const allContainers: ContainerInfo[] = stdout
              .trim()
              .split("\n")
              .filter(Boolean)
              .map((line) => {
                const [id, name, state, networks] = line.split(" ");
                return { id, name, state, networks };
              });

            const filteredContainers = allContainers.filter((container) =>
              container.networks.split(",").includes(networkName)
            );

            const containerDetails = filteredContainers.map((container) => ({
              name: container.name,
              status: container.state,
            }));

            resolve(NextResponse.json(containerDetails));
          }
        }
      );
    });
  } else {
    // Obtener lista de redes
    return new Promise((resolve) => {
      exec("docker network ls --format '{{.Name}}'", (error, stdout) => {
        if (error) {
          resolve(
            NextResponse.json({ error: "Error al obtener redes" }, { status: 500 })
          );
        } else {
          const networks = stdout
            .split("\n")
            .filter(Boolean)
            .filter(
              (name) =>
                !["bridge", "host", "none"].includes(name) &&
                !name.startsWith("portainer_portainer-docker-extension-")
            );

          resolve(NextResponse.json(networks));
        }
      });
    });
  }
}