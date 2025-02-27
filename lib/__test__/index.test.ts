import { getBalance, getBlockNumber, transferFrom, getNetworkInfo, launchNewNode, deleteNode } from '../../lib/index';
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
import * as child_process from 'child_process';
import { ChildProcess, ExecException } from 'child_process';

fetchMock.enableMocks();

describe("Blockchain API Methods", () => {
    const mockUrl = "http://localhost:8545";
    const mockAddress = "0x123456789abcdef";
    const mockPrivateKey = "0xabc123";

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
            .rejects.toThrow();
    });

    test("getNetworkInfo should return network details", async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "123" }));
        fetchMock.mockResponseOnce(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "10" }));

        const networkInfo = await getNetworkInfo(mockUrl);
        expect(networkInfo.version.result).toBe("123");
        expect(networkInfo.peerCount.result).toBe("10");
    });
});

describe("Script Execution Methods", () => {
    test("launchNewNode should execute newNode.sh", () => {
        const execSpy = jest.spyOn(child_process, 'exec').mockImplementation((cmd: string, callback?: (error: ExecException | null, stdout: string, stderr: string) => void) => {
            callback?.(null, "Success", "");
            return {} as ChildProcess;
        });

        launchNewNode();
        expect(execSpy).toHaveBeenCalledWith(expect.stringContaining("newNode.sh"), expect.any(Function));

        execSpy.mockRestore();
    });

    test("deleteNode should execute deleteNode.sh with parameter", () => {
        const execSpy = jest.spyOn(child_process, "exec").mockImplementation((cmd: string, callback?: (error: ExecException | null, stdout: string, stderr: string) => void) => {
            callback?.(null, "Success", "");
            return {} as ChildProcess;
        });

        deleteNode("node123");
        expect(execSpy).toHaveBeenCalledWith(expect.stringContaining("deleteNode.sh node123"), expect.any(Function));

        execSpy.mockRestore();
    });
});
