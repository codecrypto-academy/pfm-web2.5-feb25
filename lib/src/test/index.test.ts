import { BesuClique } from "../besuClique";

export interface Node {
  name: string;
  portJSON: number;
  portWS: number;
  portP2P: number;
  address?: string;
  dockerId?: string;
  dockerIP?: string;
  enode?: string;
}

const besuClique = new BesuClique();

const mockNodes: Node[] = [
  {
    name: 'Node-1',
    portJSON: 8545,
    portWS: 8546,
    portP2P: 30303
  },
  {
    name: 'Node-2',
    portJSON: 8555,
    portWS: 8556,
    portP2P: 30304
  },
  {
    name: 'Node-3',
    portJSON: 8565,
    portWS: 8566,
    portP2P: 30305
  },
  {
    name: 'Node-4',
    portJSON: 8575,
    portWS: 8576,
    portP2P: 30306
  }
]

describe("getVersion", () => {
  it('should return an string', () => {
    const besuClique = new BesuClique();
    expect(besuClique.getVersion()).toBe('1.0.0');
  })
});

describe('checkDocker', () => {
  it('should return a boolean', async () => {
    const besuClique = new BesuClique();
    expect(await besuClique.checkDocker()).toBe(true);
  })  
});

describe('getNetworkName', () => {
  it('should return a string', () => {
    const besuClique = new BesuClique();
    expect(besuClique.getNetworkName()).toBe('besuClique');
  })
});

describe('setNetworkName', () => {
  it('should return a string', () => {
    const besuClique = new BesuClique();
    besuClique.setNetworkName('besuTest');
    expect(besuClique.getNetworkName()).toBe('besuTest');
  })
});

describe('getNodes', () => {
  it('should return an array', () => {
    const besuClique = new BesuClique();
    expect(besuClique.getNodes()).toEqual([]);
  })
});

describe('addNodes', () => {
  it('adds the mock nodes and gets them', () => {
    for (let i = 0; i < mockNodes.length; i++) {
      besuClique.addNode(mockNodes[i]);
    }
    expect(besuClique.getNodes()).toEqual(mockNodes);
    expect(besuClique.getNodes().length).toBe(4);
  })
});

describe('removeNode', () => {
  it('removes a node from the list by name', () => {
    besuClique.removeNode('Node-4');
    expect(besuClique.getNodes().length).toBe(3);
    expect(besuClique.getNodes().map(node => node.name)).toEqual(['Node-1', 'Node-2', 'Node-3']);
  })
});

describe('generateAddress', () => {
  it('should return an string', async () => {
    besuClique.getNodes()[0].address = await besuClique.generateAddress(besuClique.getNodes()[0]);
    expect(besuClique.getNodes()[0].address!.length).toBe(40);
  })
});

describe('createGenesis', () => {
  it('should return a boolean', () => {
    expect(besuClique.createGenesis(besuClique.getNodes()[0].address!)).toBe(true);
  })
});

describe('createNetwork', () => {
  it('should return a boolean', async () => {
    expect(await besuClique.createNetwork()).toBe(true);
  })
});

describe('createNodeMaster', () => {
  it('should return a node', async () => {
    besuClique.getNodes()[0] = await besuClique.createNodeMaster(besuClique.getNodes()[0]);
    expect(besuClique.getNodes()[0].dockerId?.length).toBeGreaterThan(0);
    // await besuClique.sleep(5000);
  }, 10000)
});

describe('getNodeEnode', () => {
  it('should return a string', async () => {
    await besuClique.setNodeEnode(besuClique.getNodes()[0]);
    expect(besuClique.getNodes()[0].enode!.length).toBeGreaterThan(0);
  })
});

describe('getNodeIP - Node 1', () => {
  it('should return a string', async () => {
    await besuClique.getNodeDockerIP(besuClique.getNodes()[0]);
    expect(besuClique.getNodes()[0].dockerIP!.length).toBeGreaterThan(0);
  })
});

describe('createNodeSlave - Node 2', () => {
  it('should return a boolean', async () => {
    besuClique.getNodes()[1] = await besuClique.createNodeSlave(besuClique.getNodes()[1], besuClique.getNodes()[0].enode!);
    expect(besuClique.getNodes()[1].dockerId?.length).toBeGreaterThan(0);
    await besuClique.sleep(2500);
  }, 10000)
});

// describe('sendTransaction', () => {
//   it('should return a string', async () => {
//     expect(await besuClique.sendTransaction("0x789b1182f498Be80c0d7D36E395c2CBC53b44B0C", besuClique.getPrivateKey("f17f52151EbEF6C7334FAD080c5704D77216b732"), 100)).toHaveLength(66);
//   }, 25000)
// });

describe('getBalance', () => {
  it('should return a string', async () => {
    expect(await besuClique.getBalance("0x789b1182f498Be80c0d7D36E395c2CBC53b44B0C")).toBeDefined();
  }, 10000)
});

describe('stopNode - Node 2', () => {
  it('should return a string', async () => {
    expect(await besuClique.stopNode(besuClique.getNodes()[1])).toBe('Node stopped');
  })
});

describe('deleteNode - Node 2', () => {
  it('should return a string', async () => {
    expect(await besuClique.deleteNode(besuClique.getNodes()[1])).toBe('Node deleted');
  })
});

// describe('getPrivateKey', () => {
//   it('should return a string', () => {
//     expect(besuClique.getPrivateKey('f17f52151EbEF6C7334FAD080c5704D77216b732')).toBe('0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f');
//   })
// });

describe('stopNode - Node 1', () => {
  it('should return a string', async () => {
    expect(await besuClique.stopNode(besuClique.getNodes()[0])).toBe('Node stopped');
  })
});

describe('deleteNode - Node 1', () => {
  it('should return a string', async () => {
    expect(await besuClique.deleteNode(besuClique.getNodes()[0])).toBe('Node deleted');
  })
});

describe('clearLocalData', () => {
  it('should return return nothing', () => {
    expect(besuClique.clearLocalData()).toBe(undefined);
  })
});