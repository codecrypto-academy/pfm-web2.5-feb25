import { NextRequest, NextResponse } from 'next/server';
import { BesuNetwork } from '../../../index';

const besu = new BesuNetwork();

export async function POST(req: NextRequest) {
    try {
        const { networkName, chainId, subnet, bootnode, nodes, containerName, nodeport, networkPath, from, to, amount } = await req.json();
        
        if (networkName && chainId && subnet) {
            const networks = await besu.getNetworks();
            if (networks && networks[networkName]) {
                return NextResponse.json({ error: `Network ${networkName} already exists.` }, { status: 400 });
            }
            const subnets = networks ? Object.values(networks).map(network => network.subnet) : [];
            if (subnets.includes(subnet)) {
                return NextResponse.json({ error: `Subnet ${subnet} already exists.` }, { status: 400 });
            }
            const chainIds = networks ? Object.values(networks).map(network => network.chainId) : [];
            if (chainIds.includes(chainId)) {
                return NextResponse.json({ error: `ChainId ${subnet} already exists.` }, { status: 400 });
            }
            const allNodes = networks ? Object.values(networks).flatMap(network => network.nodes) : [];
            const usedPorts = allNodes.map(node => node.port);
            const usedNames = allNodes.map(node => node.name);

            if (usedPorts.includes(bootnode.port)) {
                return NextResponse.json({ error: `Port ${bootnode.port} is already in use.` }, { status: 400 });
            }

            if (usedNames.includes(bootnode.name)) {
                return NextResponse.json({ error: `Node name ${bootnode.name} is already in use. Please choose a different name.` }, { status: 400 });
            }

            for (const node of nodes) {
                if (usedPorts.includes(node.port)) {
                    return NextResponse.json({ error: `Port ${node.port} is already in use.` }, { status: 400 });
                }
                if (usedNames.includes(node.name)) {
                    return NextResponse.json({ error: `Node name ${node.name} is already in use. Please choose a different name.` }, { status: 400 });
                }
            }

            await besu.createNetwork(networkName, chainId, subnet);
            await besu.addBootnode(bootnode.name, networkName, subnet, bootnode.port, `networks/${networkName}`);
            await new Promise(resolve => setTimeout(resolve, 5000)); //Wait 5 sc.
            if (nodes && nodes.length > 0) {
                for (const node of nodes) {
                    await besu.addNode(node.name, networkName, node.port, `networks/${networkName}`);
                }
            }
            besu.setActiveNode(networkName)
            return NextResponse.json({ message: `Network ${networkName} created successfully.` }, { status: 201 });
        }

        if (containerName && networkName && nodeport && networkPath) {
            await besu.addNode(containerName, networkName, nodeport, networkPath);
            return NextResponse.json({ message: `Node ${containerName} added successfully.` }, { status: 201 });
        }

        if (from && to && amount) {
            
            await besu.transfer(from, to, amount);
            return NextResponse.json({ message: 'Transfer successful.' }, { status: 200 });
        }
        if (networkName && to && amount) {
            await besu.requestTokens(networkName, to, amount);
            return NextResponse.json({ message: 'Transfer successful.' }, { status: 200 });
        }

        return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { networkName, containerName } = await req.json();

        if (containerName && networkName) {
            await besu.removeNode(containerName, networkName);
            return NextResponse.json({ message: `Node ${containerName} removed successfully.` }, { status: 200 });
        }

        if (networkName) {
            const nodes = await besu.getNodes(networkName);
            if (!nodes) {
                return NextResponse.json({ error: `Network ${networkName} does not exist.` }, { status: 404 });
            }
            await besu.deleteNetwork(networkName);
            return NextResponse.json({ message: `Network ${networkName} deleted successfully.` }, { status: 200 });
        }

        return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred.' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const networkName = searchParams.get('networkName');
        const address = searchParams.get('address');

        if (address && networkName) {
            console.log(besu.setActiveNode(networkName));
            const balance = await besu.getBalance(address);
            console.log(balance)
            return NextResponse.json({ balance }, { status: 200 });
        }

        if (networkName) {
            const nodes = await besu.getNodes(networkName);
            if (!nodes) {
                return NextResponse.json({ error: `Network ${networkName} does not exist.` }, { status: 404 });
            }
            return NextResponse.json(nodes, { status: 200 });
        }

        const networks = await besu.getNetworks();
        if (!networks) {
            return NextResponse.json({ error: 'No networks found' }, { status: 404 });
        }
        return NextResponse.json(Object.keys(networks).map(name => ({
            name,
            chainId: networks[name].chainId,
            subnet: networks[name].subnet,
            nodes: networks[name].nodes.map(node => ({
                name: node.name,
                port: node.port
            }))
        })), { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred.' }, { status: 500 });
    }
}