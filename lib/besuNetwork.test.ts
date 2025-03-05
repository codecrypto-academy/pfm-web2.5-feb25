import { BesuNetwork } from 'lib/index';
import { execSync } from 'child_process';
import fs from 'fs';
import { ethers } from 'ethers';



describe('BesuNetwork', () => {
    let besu: BesuNetwork;

    beforeEach(() => {
        // Iniciate object
        besu = new BesuNetwork({ rpcUrl: 'http://localhost:8545' });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Test of function reset
    describe('reset', () => {
        it('debería eliminar la red y el contenedor correctamente', async () => {
            (execSync as jest.Mock).mockReturnValueOnce(null);  // Mocked execSync success

            await expect(besu.reset('test-network')).resolves.toBeUndefined();
            expect(execSync).toHaveBeenCalledWith(`docker rm -f $(docker ps -a --format "{{.Names}}" --filter "label=network=test-network") 2>/dev/null`);
            expect(execSync).toHaveBeenCalledWith('docker network rm $NETWORK_NAME 2>/dev/null');
            expect(execSync).toHaveBeenCalledWith('rm -rf networks/test-network');
        });
    });

    // Test of function createNetwork
    describe('createNetwork', () => {
        it('debería crear la red correctamente', async () => {
            (execSync as jest.Mock).mockReturnValueOnce(null);

            await expect(besu.createNetwork('test-network', '192.168.0.0/16')).resolves.toBeUndefined();
            expect(execSync).toHaveBeenCalledWith('mkdir -p networks/test-network');
            expect(execSync).toHaveBeenCalledWith('docker network create test-network --subnet 192.168.0.0/16 --label nerwork=test-network');
        });
    });

    // Test of function deleteNetwork
    describe('deleteNetwork', () => {
        it('debería eliminar la red correctamente', async () => {
            (execSync as jest.Mock).mockReturnValueOnce(null);

            await expect(besu.deleteNetwork('test-network')).resolves.toBeUndefined();
            expect(execSync).toHaveBeenCalledWith('docker network rm test-network');
        });
    });

    // Test of function addBootnode
    describe('addBootnode', () => {
        it('debería agregar un bootnode correctamente', async () => {
            (fs.readFileSync as jest.Mock).mockReturnValueOnce('0x123');
            (execSync as jest.Mock).mockReturnValueOnce(null);

            await expect(besu.addBootnode('bootnode-container', 'test-network', '30303', 'path-to-network')).resolves.toBeUndefined();
            expect(fs.readFileSync).toHaveBeenCalledWith('path-to-network/bootnode/address', 'utf8');
            expect(execSync).toHaveBeenCalledWith(expect.stringContaining('docker run -d --name bootnode-container'));
        });
    });

    /* Test para la función transfer (test de transacciones)
    describe('transfer', () => {
        it('debería realizar una transacción correctamente', async () => {
            const result = await besu.transfer('0xFrom', '0xTo', '1', 'http://localhost:8545');

            expect(result).toEqual('Transaction confirmed');
            expect(ethers.Wallet.prototype.sendTransaction).toHaveBeenCalledWith({
                to: '0xTo',
                value: expect.anything(),
            });
        });
*/
});
