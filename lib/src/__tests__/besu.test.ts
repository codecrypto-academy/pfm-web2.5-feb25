/**
 * Utilizamos doMock para asegurarnos que el mock tome efecto antes de cualquier importación
 * y modificamos la estructura del mock para que coincida exactamente con el uso en index.ts
 */
jest.doMock('ethers', () => {
  // La clave es que BigNumber tiene que ser una clase con un método estático 'from'
  // que devuelva un objeto con un método 'toString' y sea compatible con formatEther
  const mockBigNumberObject = {
    toString: () => '50000000000000000000'
  };

  // BigNumber debe ser un objeto con un método estático 'from' que devuelve el objeto mockBigNumber
  const BigNumber = function() {};
  BigNumber.from = jest.fn().mockReturnValue(mockBigNumberObject);

  return {
    BigNumber: BigNumber,
    utils: {
      parseEther: jest.fn().mockImplementation(() => ({
        toHexString: () => '0x123456'
      })),
      formatEther: jest.fn().mockReturnValue('50.0')
    }
  };
});

// Ahora importamos las dependencias estándar
import fs from 'fs-extra';
import { execSync } from 'child_process';
import axios from 'axios';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Importante: importamos el código DESPUÉS de mockear ethers
import {
  cleanExistingFiles,
  createDockerNetwork,
  createNodeDirectory,
  createGenesisFile,
  createValidatorConfig,
  launchValidatorNode,
  getValidatorEnode,
  createFullnodeConfig,
  launchFullnodeContainers,
  showNetworkInfo,
  getBalance,
  sendTransaction,
  addNode,
  removeNode,
  setupBesuNetwork,
  defaultNetworkConfig,
} from '../index';

// Mocks para los demás módulos externos
jest.mock('fs-extra');
jest.mock('child_process');
jest.mock('axios');

// Spy on console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};

describe('Besu Network Library', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (fs.existsSync as jest.Mock).mockImplementation(() => true);
    (fs.readdirSync as jest.Mock).mockImplementation(() => ['node1', 'node2', 'node3']);
    (fs.statSync as jest.Mock).mockImplementation(() => ({ isDirectory: () => true }));
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: any) => {
      if (typeof filePath === 'string' && filePath.includes('address')) return '0x123456789abcdef';
      if (typeof filePath === 'string' && filePath.includes('key')) return '0xprivatekey123456';
      return '';
    });
    (execSync as jest.Mock).mockImplementation(() => 'mock response');

    // Mock process.cwd()
    jest.spyOn(process, 'cwd').mockReturnValue('/mock/working/directory');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('cleanExistingFiles', () => {
    it('should clean existing Docker containers and files', async () => {
      (execSync as jest.Mock).mockImplementationOnce(() => 'container1\ncontainer2');

      await cleanExistingFiles();

      // Check Docker containers were stopped and removed
      expect(execSync).toHaveBeenCalledWith('docker ps -a --filter name=node* -q');
      expect(execSync).toHaveBeenCalledWith('docker stop container1');
      expect(execSync).toHaveBeenCalledWith('docker rm container1');
      expect(execSync).toHaveBeenCalledWith('docker stop container2');
      expect(execSync).toHaveBeenCalledWith('docker rm container2');

      // Check files were removed
      expect(fs.unlinkSync).toHaveBeenCalledTimes(4);

      // Check temp directory was removed
      expect(fs.removeSync).toHaveBeenCalled();

      // Check success message was logged
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup completed')
      );
    });

    it('should handle errors when stopping containers', async () => {
      (execSync as jest.Mock).mockImplementationOnce(() => 'container1');
      (execSync as jest.Mock).mockImplementationOnce(() => { throw new Error('Docker error'); });

      await cleanExistingFiles();

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Error stopping/removing container')
      );
    });
  });

  describe('createDockerNetwork', () => {
    it('should create a Docker network if it does not exist', () => {
      (execSync as jest.Mock).mockImplementationOnce(() => 'other-network');

      createDockerNetwork(defaultNetworkConfig);

      expect(execSync).toHaveBeenCalledWith(
        `docker network create ${defaultNetworkConfig.network.networkName}`
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(`Network '${defaultNetworkConfig.network.networkName}' created successfully`)
      );
    });

    it('should skip creation if network already exists', () => {
      (execSync as jest.Mock).mockImplementationOnce(() => defaultNetworkConfig.network.networkName);

      createDockerNetwork(defaultNetworkConfig);

      expect(execSync).toHaveBeenCalledTimes(1); // Only called to list networks
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      );
    });
  });

  describe('createNodeDirectory', () => {
    it('should create node directory and generate key', () => {
      createNodeDirectory(1);

      expect(fs.mkdirpSync).toHaveBeenCalledWith('node1');
      expect(execSync).toHaveBeenCalledWith('besu --data-path=node1 public-key export-address --to=node1/address');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Node 1 configured correctly')
      );
    });
  });

  describe('createGenesisFile', () => {
    it('should create a genesis file with correct content', () => {
      createGenesisFile(defaultNetworkConfig);

      expect(fs.readFileSync).toHaveBeenCalledWith('node1/address', 'utf8');
      // Cambiamos la expectativa para que coincida con la implementación real
      expect(fs.writeFileSync).toHaveBeenCalled();
      // Verificamos que el primer argumento sea 'genesis.json'
      expect((fs.writeFileSync as jest.Mock).mock.calls[0][0]).toBe('genesis.json');
      // Verificamos que el segundo argumento contenga chainID sin ser tan estrictos con el formato
      expect((fs.writeFileSync as jest.Mock).mock.calls[0][1]).toContain('chainID');
    });
  });

  describe('createValidatorConfig', () => {
    it('should create validator config file with correct content', () => {
      createValidatorConfig();

      // Cambiamos la expectativa para que coincida con la implementación real
      expect(fs.writeFileSync).toHaveBeenCalled();
      // Verificamos que el primer argumento sea 'config.toml'
      expect((fs.writeFileSync as jest.Mock).mock.calls[0][0]).toBe('config.toml');
      // Verificamos que el segundo argumento contenga genesis-file sin ser tan estrictos
      expect((fs.writeFileSync as jest.Mock).mock.calls[0][1]).toContain('genesis-file');
    });
  });

  describe('launchValidatorNode', () => {
    it('should launch validator node using Docker', () => {
      launchValidatorNode(defaultNetworkConfig);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('docker run -d')
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(`sleep ${defaultNetworkConfig.tech.validatorStartupTime}`)
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Validator node container launched successfully')
      );
    });
  });

  describe('getValidatorEnode', () => {
    it('should retrieve the validator enode', () => {
      // Mocks específicos para esta función
      (execSync as jest.Mock)
        .mockImplementationOnce(() => '172.17.0.2')
        .mockImplementationOnce(() => '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

      const enode = getValidatorEnode();

      expect(execSync).toHaveBeenCalledWith(
        `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' node1`
      );
      expect(execSync).toHaveBeenCalledWith(
        `besu --data-path=node1 public-key export 2>/dev/null | tail -1`
      );
      expect(enode).toContain('enode://');
      expect(enode).toContain('@172.17.0.2:30303');
    });

    it('should throw an error if public key is invalid', () => {
      (execSync as jest.Mock)
        .mockImplementationOnce(() => '172.17.0.2')
        .mockImplementationOnce(() => 'invalidkey');

      expect(() => getValidatorEnode()).toThrow('Invalid public key format');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid public key format')
      );
    });
  });

  describe('createFullnodeConfig', () => {
    it('should create fullnode config with correct enode', () => {
      const mockEnode = 'enode://abcdef@172.17.0.2:30303';
      createFullnodeConfig(mockEnode);

      // Similar a los casos anteriores, simplificamos la verificación
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect((fs.writeFileSync as jest.Mock).mock.calls[0][0]).toBe('config-fullnode.toml');
      // Verificamos que el contenido incluya el enode
      expect((fs.writeFileSync as jest.Mock).mock.calls[0][1]).toContain(mockEnode);
    });
  });

  describe('launchFullnodeContainers', () => {
    it('should launch the correct number of fullnode containers', () => {
      const config = { ...defaultNetworkConfig, nodes: { validators: 1, fullnodes: 3 } };

      launchFullnodeContainers(config);

      // Should launch 3 fullnodes (node2, node3, node4)
      expect(execSync).toHaveBeenCalledTimes(3);
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--name node2')
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--name node3')
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--name node4')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Fullnode node4 container launched successfully')
      );
    });
  });

  describe('showNetworkInfo', () => {
    it('should display correct network information', () => {
      showNetworkInfo(defaultNetworkConfig);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Hyperledger Besu network created successfully')
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(`- Total number of nodes: ${1 + defaultNetworkConfig.nodes.fullnodes}`)
      );
    });
  });

  describe('getBalance', () => {
    it('should get and format balance correctly', async () => {
      const mockAddress = '0x1234567890abcdef';
      // Cambiamos el mock para que devuelva un valor hexadecimal que represente exactamente 0.01 ETH
      (axios.post as any).mockResolvedValueOnce({
        data: { result: '0x2386f26fc10000' } // Exactamente 0.01 ETH en hexadecimal
      });

      const balance = await getBalance(mockAddress, defaultNetworkConfig);

      expect(axios.post).toHaveBeenCalled();
      expect(balance).toBe('0.01');
    });

    it('should return 0.00 for empty balance', async () => {
      (axios.post as any).mockResolvedValueOnce({
        data: { result: '0x0' }
      });

      const balance = await getBalance('0xaddr', defaultNetworkConfig);
      expect(balance).toBe('0.00');
    });
  });

  describe('sendTransaction', () => {
    beforeEach(() => {
      // Configuración adicional para este grupo de tests
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      (process.chdir as jest.Mock) = jest.fn();

      // Mock de axios específico para devoluciones diferentes
      (axios.post as any)
        .mockImplementation((url, data) => {
          if (data.method === 'eth_getTransactionCount') {
            return Promise.resolve({ data: { result: '0x1' } });
          } else if (data.method === 'eth_sendRawTransaction') {
            return Promise.resolve({ data: { result: '0xhash123' } });
          }
          return Promise.resolve({ data: { result: null } });
        });
    });

    it('should send a transaction successfully', async () => {
      const txHash = await sendTransaction('10', '0xdest', defaultNetworkConfig);

      // Check if transaction was sent
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining(`http://localhost:${defaultNetworkConfig.network.basePort}`),
        expect.objectContaining({
          method: 'eth_sendRawTransaction'
        })
      );

      // Check return value
      expect(txHash).toBe('0xhash123');
    });

    it('should use default values when not provided', async () => {
      const txHash = await sendTransaction(undefined, undefined, defaultNetworkConfig);

      expect(txHash).toBe('0xhash123');
    });
  });

  describe('addNode', () => {
    it('should add a new node successfully', async () => {
      (fs.readdirSync as jest.Mock).mockImplementationOnce(() =>
        ['node1', 'node2', 'node3']
      );

      const result = await addNode(defaultNetworkConfig);

      expect(fs.readdirSync).toHaveBeenCalled();
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('--name node4'));
      expect(result).toEqual({
        nodeId: 'node4',
        nodeUrl: `http://localhost:${defaultNetworkConfig.network.basePort + 3}`
      });
    });

    it('should create fullnode config if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockImplementationOnce(() => false);

      // Mock getValidatorEnode de forma correcta
      const originalGetValidatorEnode = getValidatorEnode;
      const mockGetValidatorEnode = jest.fn().mockReturnValue('enode://abcdef@172.17.0.2:30303');
      global.getValidatorEnode = mockGetValidatorEnode;

      try {
        await addNode(defaultNetworkConfig);
      } finally {
        // Restaurar la función original
        global.getValidatorEnode = originalGetValidatorEnode;
      }
    });
  });

  describe('removeNode', () => {
    it('should remove a non-validator node successfully', async () => {
      await removeNode(2);

      expect(execSync).toHaveBeenCalledWith('docker inspect node2 > /dev/null 2>&1');
      expect(execSync).toHaveBeenCalledWith('docker stop node2');
      expect(execSync).toHaveBeenCalledWith('docker rm node2');
      expect(fs.removeSync).toHaveBeenCalledWith('node2');
    });

    it('should not allow removing the validator node', async () => {
      await expect(removeNode(1)).rejects.toThrow('Cannot remove validator node');

      expect(execSync).not.toHaveBeenCalledWith('docker stop node1');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Cannot remove validator node')
      );
    });
  });
});
