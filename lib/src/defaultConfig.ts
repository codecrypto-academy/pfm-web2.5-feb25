import { NetworkConfigInterface } from './types';

/**
 * Configuración predeterminada para la red Besu
 * Esta configuración puede ser usada como base y modificada según necesidades
 */
export const defaultNetworkConfig: NetworkConfigInterface = {
  nodes: {
    validators: 1,
    fullnodes: 2,
  },
  network: {
    networkName: 'besu-network',
    basePort: 10001,
  },
  tech: {
    dockerImage: 'hyperledger/besu:latest',
    validatorStartupTime: 15,
  },
  chain: {
    chainId: 4004,
    londonBlock: 0,
    gasLimit: "0x1fffffffffffff",
    difficulty: "0x1",
    clique: {
      blockPeriodSeconds: 4,
      epochLength: 30000,
      createEmptyBlocks: true,
    },
  },
  transaction: {
    to: '0x125f85D02912c62E7E63FFdc12F1f4511B14c3DC',
    amount: '50',
    perform: true,
  },
  execution: {
    performDemonstration: true,
  },
};
