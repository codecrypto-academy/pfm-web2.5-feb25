

import { deployNetwork, stopNetwork, startNetwork, deleteNetwork, addNode, CONFIG } from "lib";

export const deployBesu = async () => {
    return deployNetwork(CONFIG.DEFAULT_NUM_NODES, CONFIG.DEFAULT_CHAIN_ID, CONFIG.DEFAULT_METAMASK_ACCOUNT);
};

export const stopBesu = async () => {
    return stopNetwork();
};

export const startBesu = async () => {
    return startNetwork();
};

export const deleteBesu = async () => {
    return deleteNetwork();
};

export const addBesuNode = async () => {
    return addNode();
};

