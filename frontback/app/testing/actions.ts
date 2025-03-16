"use server";

import { BesuClique, Node } from "@dalzemag/besu-clique";

const besuClique = new BesuClique();

export const getVersion = async (): Promise<string> => {
  return new Promise((resolve) => {
    resolve(besuClique.getVersion());
  });
}

export const checkDocker = async (): Promise<boolean> => {
  return new Promise(async (resolve) => {
    const resp = await besuClique.checkDocker();

    resolve(resp);
  });
}

export const getNodeStatus = async (node: Node): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const resp = await besuClique.getNodeStatus(node);

      resolve(resp);
    } catch (error) {
      reject(error);
    }
  });
}
