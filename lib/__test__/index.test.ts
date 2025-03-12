import { getBalance, getBlockNumber, transferFrom, getNetworkInfo, launchNewNode, deleteNode } from '../../lib/index';
import fetchMock from 'jest-fetch-mock';
import * as child_process from 'child_process';
import { ChildProcess, ExecException } from 'child_process';

fetchMock.enableMocks();

beforeAll(() => {
    jest.mock("ethers", () => {
        return {
            ethers: {
                Wallet: jest.fn().mockImplementation(() => ({
                    connect: jest.fn().mockReturnThis(),
                    sendTransaction: jest.fn().mockImplementation(() => ({
                        wait: jest.fn().mockResolvedValue({ status: 1 }) // Simula una transacción exitosa
                    }))
                })),
                JsonRpcProvider: jest.fn().mockImplementation(() => ({})),
                parseEther: jest.fn().mockReturnValue("1000000000000000000"), // 1 ETH en Wei
            }
        };
    });
});

describe("Blockchain API Methods", () => {
    const mockUrl = "http://localhost:8545";
    const mockAddress = "0x123456789abcdef";
    const mockPrivateKey = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef";

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    test("getBalance should return a BigInt", async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0x1a" }));

        const balance = await getBalance(mockUrl, mockAddress);
        expect(balance).toBe(BigInt(26)); // 0x1a en decimal
    });

    test("getBlockNumber should return a number", async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0x64" }));

        const blockNumber = await getBlockNumber(mockUrl);
        expect(blockNumber).toBe(100);
    });

    test("transferFrom should throw an error if transaction fails", async () => {
        await expect(transferFrom(mockUrl, mockPrivateKey, mockAddress, 1))
            .rejects.toThrow("Transaction failed");
    });

    test("getNetworkInfo should return network details", async () => {
        fetchMock.mockResponses(
            [JSON.stringify({ jsonrpc: "2.0", id: 1, result: "123" }), { status: 200 }],
            [JSON.stringify({ jsonrpc: "2.0", id: 1, result: "10" }), { status: 200 }]
        );

        const networkInfo = await getNetworkInfo(mockUrl);
        expect(networkInfo.version.result).toBe("123");
        expect(networkInfo.peerCount.result).toBe("10");
    });
});

describe("Script Execution Methods", () => {
    test("launchNewNode should execute newNode.sh", () => {
        jest.restoreAllMocks();
        const execSpy = jest.spyOn(child_process, "exec").mockImplementation(
            (cmd, options, callback) => {
                const cb = typeof options === "function" ? options : callback;
                if (cb) {
                    cb(null, "Success", "");
                }
                return {} as ChildProcess;
            }
        );

        launchNewNode();
        expect(execSpy).toHaveBeenCalledWith(expect.stringContaining("newNode.sh"), expect.anything(), expect.any(Function));

        execSpy.mockRestore();
    });

    test("deleteNode should execute deleteNode.sh with parameter", () => {
        jest.restoreAllMocks();
        const execSpy = jest.spyOn(child_process, "exec").mockImplementation(
            (cmd, options, callback) => {
                const cb = typeof options === "function" ? options : callback;
                if (cb) {
                    cb(null, "Success", "");
                }
                return {} as ChildProcess;
            }
        );

        deleteNode("node123");
        expect(execSpy).toHaveBeenCalledWith(expect.stringContaining("deleteNode.sh node123"), expect.anything(), expect.any(Function));

        execSpy.mockRestore();
    });

    test("deleteNode should handle errors", () => {
        jest.restoreAllMocks();
        const execSpy = jest.spyOn(child_process, "exec").mockImplementation(
            (cmd, options, callback) => {
                const cb = typeof options === "function" ? options : callback;
                if (cb) {
                    cb(new Error("Execution failed"), "", "");
                }
                return {} as ChildProcess;
            }
        );

        expect(() => deleteNode("node123")).toThrow();
        execSpy.mockRestore();
    });
});
