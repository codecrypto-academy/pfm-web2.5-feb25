import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
    DEFAULT_NUM_NODES: process.env.DEFAULT_NUM_NODES ? parseInt(process.env.DEFAULT_NUM_NODES, 10) : 3,
    DEFAULT_CHAIN_ID: process.env.DEFAULT_CHAIN_ID ? parseInt(process.env.DEFAULT_CHAIN_ID, 10) : 13371337,
    DEFAULT_METAMASK_ACCOUNT: process.env.DEFAULT_METAMASK_ACCOUNT || "0xEc405D1D3984345644d36653d42ad16E79f7D41F",
    RPC_PORT: process.env.RPC_PORT ? parseInt(process.env.RPC_PORT, 10) : 8545
};
