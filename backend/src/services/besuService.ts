import { deployNetwork as deploy, stopNetwork as stop, startNetwork as start, deleteNetwork as del } from "../../lib/src/BesuManager";
import { CONFIG } from "../../lib/src/config";

export const deployNetwork = async () => {
    return deploy(CONFIG.DEFAULT_NUM_NODES, CONFIG.DEFAULT_CHAIN_ID, CONFIG.DEFAULT_METAMASK_ACCOUNT);
};

export const stopNetwork = async () => {
    return stop();
};

export const startNetwork = async () => {
    return start();
};

export const deleteNetwork = async () => {
    return del();
};
