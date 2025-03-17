"use server";

import { exec } from "child_process";

import { BesuClique, Node } from "@dalzemag/besu-clique";
import { CompleteNode } from "./nodes";

let besuClique = new BesuClique("besuClique");

export const resetInstance = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      besuClique = new BesuClique("besuClique");
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const createNetwork = async (netName?: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (netName) {
        besuClique.setNetworkName(netName);
        await besuClique.createNetwork();
      } else {
        await besuClique.createNetwork();
      }
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

export const getVersion = async (): Promise<string> => {
  return new Promise((resolve) => {
    resolve(besuClique.getVersion());
  });
};

export const checkDocker = async (): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const resp = await besuClique.checkDocker();

    resolve(resp);
  });
};

export const getNetworkName = async (): Promise<string> => {
  return new Promise((resolve) => {
    resolve(besuClique.getNetworkName());
  });
};

export const setNetworkName = async (name: string): Promise<void> => {
  return new Promise((resolve) => {
    besuClique.setNetworkName(name);
    resolve();
  });
};

export const getNodeStatus = async (
  node: Node,
): Promise<"active" | "stoped" | "unknown"> => {
  return new Promise(async (resolve, reject) => {
    try {
      const resp = await besuClique.getNodeStatus(node);

      switch (resp.trim()) {
        case "running":
          resolve("active");
          break;
        case "exited":
          resolve("stoped");
          break;
        default:
          resolve("unknown");
          break;
      }
    } catch (error) {
      // reject("error");
      resolve("stoped");
    }
  });
};

export const stopNode = async (node: Node): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await besuClique.stopNode(node);
      console.log("Node stopped");
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const startNode = async (node: Node): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await besuClique.startNode(node);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const addNode = async (node: Node): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      besuClique.addNode(node);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const updateNodeEnode = async (masterNode: CompleteNode) => {
  const updatedNodes = besuClique
    .getNodes()
    .map((node) =>
      node.name === masterNode.name
        ? { ...node, enode: masterNode.enode }
        : node,
    );

  besuClique.removeNode(masterNode.name);
  besuClique.addNode(updatedNodes[0]);
  console.log("updateNodeEnode", besuClique.getNodes());
};

export const generateAddress = async (node: Node): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const resp = await besuClique.generateAddress(node);

      resolve(resp);
    } catch (error) {
      reject(error);
    }
  });
};

export const createGenesis = async (address: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await besuClique.createGenesis(address);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// export const getNodeEnode = async (node: Node): Promise<string> => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       let newNode = node;

//       await besuClique.setNodeEnode(newNode);
//       console.log("TS enode", newNode);
//       resolve(newNode.enode!);
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

export const getNodeEnode = async (node: Node): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // await sleep(10000);
      const netName = besuClique.getNetworkName();

      exec(
        `docker logs '${netName}-${node.name}' | grep "enode" | grep -o 'enode://[^ ]*@'`,
        async (error, stdout, stderr) => {
          if (error) {
            console.log("error", error);
            resolve("");
          }
          if (stderr) {
            console.log("stderr", stderr);
            resolve("");
          }

          let updatedNode = node;

          if (stdout.includes("\n")) {
            stdout = stdout.replace("\n", "");
          }
          updatedNode.enode =
            stdout + updatedNode.dockerIP + ":" + updatedNode.portP2P;
          resolve(updatedNode.enode!);
        },
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log("error", error);
      resolve("");
    }
  });
};

export const getNodeDockerIP = async (node: Node): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const netName = besuClique.getNetworkName();

      exec(
        `docker inspect '${netName}-${node.name}'`,
        (error, stdout, stderr) => {
          if (error) {
            resolve("");
          } if (stderr) {
            resolve("");
          }

          const nodeInfo = JSON.parse(stdout);

          if (
            typeof nodeInfo[0]?.NetworkSettings?.Networks?.[netName]
              ?.IPAddress == "string"
          ) {
            let updatedNode = node;

            updatedNode.dockerIP = nodeInfo[0]?.NetworkSettings?.Networks?.[netName]?.IPAddress;
            resolve(updatedNode.dockerIP!);
          } else {
            resolve("");
          }
        })
    } catch (error) {
      resolve("");
    }
  });
}

export const createNode = async (newNode: Node): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (besuClique.getNodes().length === 1) {
        await besuClique.createNodeMaster(newNode);
      } else {
        // console.log("newNode", newNode);
        // console.log(besuClique.getNodes());
        // console.log("besuClique.getNodes()[0].enode", besuClique.getNodes()[0].enode);
        await besuClique.createNodeSlave(
          newNode,
          besuClique.getNodes()[0].enode!,
        );
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const deleteNode = async (node: Node): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      await besuClique.deleteNode(node);
      resolve(true);
    } catch (error) {
      reject(error);
    }
  });
};

export const sleep = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

