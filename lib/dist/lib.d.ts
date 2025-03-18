import { ethers } from "ethers";
export declare class BesuNetwork {
    private _name;
    private _subnet;
    private _chainID;
    private _directory;
    private _nodes;
    private _enodes;
    constructor(name: string, subnet: string, chainID: number, baseDir: string, initialValidators?: number);
    get name(): string;
    get subnet(): string;
    get chainID(): number;
    get directory(): string;
    get nodes(): BesuNode[];
    get enodes(): string[];
    addNode(name: string, ip: number, is_bootnode: boolean, rpc_enabled: boolean, rpc_port?: number): void;
    deleteNode(name: string): void;
    stopNetwork(): void;
    startNetwork(): void;
    restartNetwork(): void;
    getNode(name: string): BesuNode | undefined;
    deleteNetwork(): void;
    addEnode(newEnode: string): void;
}
interface Keys {
    privateKey: string;
    publicKey: string;
    address: string;
}
export declare class BesuNode {
    private _name;
    private _network;
    private _address;
    private _ip;
    private _rpc_enabled;
    private _rpc_port;
    private _is_bootnode;
    private _enode;
    constructor(network: BesuNetwork, name: string, ip: number, is_bootnode: boolean, rpc_enabled: boolean, keys?: Keys | null, rpc_port?: number);
    createConfigFile(): void;
    start(): void;
    stop(): void;
    restart(): void;
    enableRPC(): void;
    disableRPC(): void;
    changeRPCPort(port: number): void;
    sendTransaction(senderPriv: string, reciverAddress: string, amount: string): Promise<{
        reciverAddress: string;
        balanceReciverBefore: bigint;
        balanceReciverAfter: bigint;
        amount: string;
        reciept: ethers.TransactionReceipt | null;
    }>;
    getBalance(address?: string): Promise<bigint>;
    getBlockNumber(): Promise<number>;
    get name(): string;
    get network(): BesuNetwork;
    get address(): string;
    get ip(): number;
    get rpc_enabled(): boolean;
    get rpc_port(): number;
    get is_bootnode(): boolean;
    get enode(): string | null;
}
export declare function genKeyPair(): {
    privateKey: string;
    publicKey: string;
    address: string;
};
export declare function deleteNetwork(networkName: string, networkDir: string): void;
export declare function transaction(rpc_port: number, senderPriv: string, reciverAddress: string, amount: string): Promise<void>;
export {};
