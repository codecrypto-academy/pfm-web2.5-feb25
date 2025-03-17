import { 
    getBalance, 
    getBlockNumber, 
    transferFrom, 
    getNetworkInfo, 
    launchNewNode, 
    deleteNode 
} from '../index';

import fetchMock from 'jest-fetch-mock';
import { ethers } from 'ethers';

fetchMock.enableMocks();

beforeAll(() => {
    jest.mock("ethers", () => {
        return {
            ethers: {
                Wallet: jest.fn().mockImplementation(() => ({
                    connect: jest.fn().mockReturnThis(),
                    sendTransaction: jest.fn().mockImplementation(() => ({
                        wait: jest.fn().mockResolvedValue({ status: 1 }) 
                    }))
                })),
                JsonRpcProvider: jest.fn().mockImplementation(() => ({})),
                parseEther: jest.fn().mockReturnValue("1000000000000000000"), // 1 ETH en Wei
                formatEther: jest.fn().mockImplementation((wei) => { 
                    return (BigInt(wei) / BigInt(10 ** 18)).toString();
                }),
            }
        };
    });
});
describe("Blockchain API Methods", () => {
    const mockUrl = "http://localhost:9999"; // Nueva URL
    const mockAddress = "0x123456789abcdef";

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    test("getBalance should return the balance in Ether", async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0x1a" }));

        const formData = new FormData();
        formData.append('account', mockAddress);

        const balance = await getBalance(formData);
        expect(balance).toEqual({ balance: "0.000000000000000026" }); // 0x1a en Wei convertido a ETH
    });

    test("getBlockNumber should return a number", async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0x64" }));

        const blockNumber = await getBlockNumber(mockUrl);
        expect(blockNumber).toBe(100);
    });

    /*test("transferFrom should execute a transaction", async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "0x1" }));

        const txReceipt = await transferFrom(mockAddress, "0xabcdefabcdef", 1);
        expect(txReceipt).not.toBeNull();
    });*/

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
    jest.setTimeout(15000);

    test("launchNewNode should execute newNode.sh", async () => {
        await expect(launchNewNode()).resolves.toContain("created and started successfully!");
    });

    test("deleteNode should execute deleteNode.sh with parameter", async () => {
        await expect(deleteNode("node5")).resolves.toContain("eliminado exitosamente.");
    });
});
