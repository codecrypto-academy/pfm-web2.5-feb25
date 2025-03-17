"use server";

import { BesuClique, Node } from "@dalzemag/besu-clique";

const besuClique = new BesuClique();

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
      await besuClique.addNode(node);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
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

export const createGenesis = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await besuClique.createGenesis(besuClique.getNodes()[0].address!);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

export const getNodeEnode = async (node: Node): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      await besuClique.setNodeEnode(node);
      resolve(node.enode!);
    } catch (error) {
      reject(error);
    }
  });
};

export const createNode = async (newNode: Node): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (besuClique.getNodes().length === 1) {
        await besuClique.createNodeMaster(newNode);
      } else {
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

export const deleteNode = async (node: Node): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      await besuClique.deleteNode(node);
      resolve();
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

