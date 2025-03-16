import { BesuNetwork } from '../lib/index';
import { execSync } from 'child_process';
import { ethers } from 'ethers';
import * as fs from 'fs';

// Mock of execSync
jest.mock('child_process', () => ({
    execSync: jest.fn(),
}));

// Mock de fs
jest.mock('fs', () => {
    return {
        ...jest.requireActual('fs'),
        writeFileSync: jest.fn(),
        readFileSync: jest.fn(() => 'mockedContent'),
    };
});

// Mock of ethers
jest.mock('ethers', () => {
    const actualEthers = jest.requireActual('ethers');
    return {
        ...actualEthers,
        JsonRpcProvider: jest.fn().mockImplementation(() => ({
            getBalance: jest.fn().mockResolvedValue(BigInt("10000000000000000000")), // 10 ETH in BigInt
        })),
        Wallet: jest.fn().mockImplementation(() => ({
            sendTransaction: jest.fn().mockResolvedValue({
                hash: '0x123',
                wait: jest.fn().mockResolvedValue({ status: 1 }),
            })
        })),
    };
});

describe('BesuNetwork', () => {
    let besu: BesuNetwork;

    beforeEach(() => {
        besu = new BesuNetwork();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    //Reset function test
    test('should reset the network', async () => {
        const mockExecSync = execSync as jest.Mock;

        // Simulación de la eliminación de la red
        mockExecSync.mockReturnValueOnce(null);

        await besu.reset('testNetwork');

        expect(mockExecSync).toHaveBeenCalledWith('docker rm -f $(docker ps -a --format "{{.Names}}" --filter "label=network=testNetwork") || true');
        expect(mockExecSync).toHaveBeenCalledWith('docker network rm testNetwork || true');
        expect(mockExecSync).toHaveBeenCalledWith('rm -rf networks/testNetwork');
    });

    //createNetwork function test
    test('should create a new network', async () => {
        const mockExecSync = execSync as jest.Mock;

        // Network creation simulated
        mockExecSync.mockReturnValueOnce(null);

        await besu.createNetwork('testNetwork', '192.168.1.0/24');

        expect(mockExecSync).toHaveBeenCalledWith('mkdir -p networks/testNetwork');
        expect(mockExecSync).toHaveBeenCalledWith(
            'docker network create testNetwork --subnet 192.168.1.0/24 --label network=testNetwork'
        );
        expect(besu['networks']['testNetwork']).toBeDefined();
    });

    //deleteNetwork function test
    test('should delete a network', async () => {
        const mockExecSync = execSync as jest.Mock;

        // Network config
        await besu.createNetwork("testNetwork", "192.168.1.0/24");

        // Network delete
        await besu.deleteNetwork("testNetwork");

        expect(mockExecSync).toHaveBeenCalledWith(`docker network rm testNetwork`);
        expect(mockExecSync).toHaveBeenCalledWith(`rm -rf networks/testNetwork`);
        expect(besu['networks']['testNetwork']).toBeUndefined();

    })

    //addBootnode function test
    test('should add a bootnode', async () => {
        const mockExecSync = execSync as jest.Mock;
        const mockFs = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => { });
        const mockReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation((path: fs.PathOrFileDescriptor) => {
            if (typeof path === 'string' && path.includes('address')) {
                return '0x1234567890abcdef';
            }
            if (typeof path === 'string' && path.includes('publickey')) {
                return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            }
            return '';
        });

        // Network config
        await besu.createNetwork("testNetwork", "192.168.1.0/24");

        // addBootnode simulation
        mockExecSync.mockReturnValueOnce(null);

        await besu.addBootnode('bootnodeContainer', 'testNetwork', '30303', 'networks/testNetwork');

        expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('networks/testNetwork/bootnodeContainer/address'), 'utf8');
        expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('networks/testNetwork/bootnodeContainer/publickey'), 'utf8');
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining(`docker run -d --name bootnodeContainer`));
        expect(mockFs).toHaveBeenCalledWith(expect.stringContaining('networks/testNetwork/genesis.json'), expect.any(String));
        expect(mockFs).toHaveBeenCalledWith(expect.stringContaining('networks/testNetwork/config.toml'), expect.any(String));
        expect(besu['networks']['testNetwork'].nodes).toContainEqual({ name: 'bootnodeContainer', port: '30303' });
    });

    //addNode function test
    test('should add a node', async () => {
        const mockExecSync = execSync as jest.Mock;
        const mockReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation((path: fs.PathOrFileDescriptor) => {
            if (typeof path === 'string' && path.includes('address')) {
                return '0x1234567890abcdef';
            }
            if (typeof path === 'string' && path.includes('publickey')) {
                return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            }
            return '';
        });

        // Network config
        await besu.createNetwork("testNetwork", "192.168.1.0/24");

        //addNode simulation
        mockExecSync.mockReturnValueOnce(null);

        await besu.addNode('nodeContainer', 'testNetwork', '9999', 'networks/testNetwork');

        expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('networks/testNetwork/nodeContainer/address'), 'utf8');
        expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining('networks/testNetwork/nodeContainer/publickey'), 'utf8');
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining(`docker run -d --name nodeContainer \
            --network testNetwork --label network=testNetwork \
            -p 9999:8545 -v $(pwd)/networks/testNetwork:/data \
            hyperledger/besu:latest \
            --config-file=/data/config.toml --data-path=/data/nodeContainer/data
            `));
        expect(besu['networks']['testNetwork'].nodes).toContainEqual({ name: 'nodeContainer', port: '9999' });
        });

    //setActiveNode function test
    test('should set active node', () => {
        besu['networks']['testNetwork'] = { subnet: "172.20.2.2", nodes: [{name:'testnode',port:'8545'}], activeNode: null };

        besu.setActiveNode('testNetwork');

        expect(besu['networks']['testNetwork'].activeNode).toBe('http://localhost:8545');
    });

    //removeNode function test
    test('should remove a node', async () => {
        const mockExecSync = execSync as jest.Mock;

        //Mock to provide a valid exit for the docker port petition
        (mockExecSync).mockImplementation((command: string) => {
            if (command.includes("docker port")) {
                return "0.0.0.0:30303";
            }
        });
        //Network and node config
        await besu.createNetwork('testNetwork', '192.168.1.0/24');
        await besu.addNode('nodeContainer', 'testNetwork', '30303', 'networks/testNetwork');

        await besu.removeNode('nodeContainer', 'testNetwork');

        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining(`docker rm -f nodeContainer `));
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining(`rm -rf networks/testNetwork/nodeContainer`));
        expect(besu['networks']['testNetwork'].nodes).not.toContainEqual({ name: 'nodeContainer', port: '30303' });
    });

    //getNetworks function test
    test('should get active networks correctly', async () =>{
        const mockExecSync = execSync as jest.Mock;
        // Network config
        await besu.createNetwork("testNetwork", "192.168.1.0/24");

        //addNode simulation
        mockExecSync.mockReturnValueOnce(null);

        await besu.addNode('nodeContainer', 'testNetwork', '9999', 'networks/testNetwork');

        await besu.getNetworks();
        expect(besu['networks']).toHaveProperty('testNetwork');
    });

    //getNodes function test
    test('should get active nodes correctly', async () =>{
        const mockExecSync = execSync as jest.Mock;
        // Network config
        await besu.createNetwork("testNetwork", "192.168.1.0/24");

        //addNode simulation
        mockExecSync.mockReturnValueOnce(null);

        await besu.addNode('nodeContainer', 'testNetwork', '9999', 'networks/testNetwork');

        const nodes = await besu.getNodes('testNetwork');
        expect(nodes).toContainEqual({ name: 'nodeContainer', port: '9999' });
    })

    //getBalance function test
    test('should get balance correctly', async () => {
        const besu = new BesuNetwork();

        // Network config
        await besu.createNetwork("testNetwork", "192.168.1.0/24");

        // Node config
        besu.addNode("testNode", "testNetwork", "8545", "networks/testNetwork");

        // ActiveNode established
        besu.setActiveNode("testNetwork");

        // Mock of balance answer
        jest.spyOn(ethers.JsonRpcProvider.prototype, "getBalance")
            .mockResolvedValue(BigInt(ethers.parseEther("10").toString()));

        const balance = await besu.getBalance("0x123456");
        expect(balance).toBe("10.0");
    });

    //Transfer function test
    test("should transfer funds successfully", async () => {
        const besu = new BesuNetwork();

        // Network config
        await besu.createNetwork("testNetwork", "192.168.1.0/24");

        // Node config
        besu.addNode("testNode", "testNetwork", "8545", "networks/testNetwork");

        // ActiveNode established
        besu.setActiveNode("testNetwork");

        // Create mock transaction based in TransactionResponse
        const mockTxResponse = Object.assign(new ethers.TransactionResponse({} as any, {} as any), {
            hash: "0x123",
            wait: jest.fn().mockResolvedValue({ status: 1 }),
            confirmations: 1,
            from: "0xe51b35fc7c4d0d5224855eb090501e94d15b4cc9b3af23944991bb1e954e7cfa",
            to: "0x456",
            value: ethers.parseEther("1"),
            nonce: 1,
            gasLimit: ethers.parseUnits("21000", "wei"),
            gasPrice: ethers.parseUnits("50", "gwei"),
            data: "0x",
            chainId: 1
        });

        jest.spyOn(ethers.Wallet.prototype, "sendTransaction").mockResolvedValue(mockTxResponse);

        await expect(besu.transfer("0xe51b35fc7c4d0d5224855eb090501e94d15b4cc9b3af23944991bb1e954e7cfa", "0x456", "1")).resolves.not.toThrow();
    });
});
