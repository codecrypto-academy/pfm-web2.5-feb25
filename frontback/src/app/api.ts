import express from 'express';
import { BesuNetwork } from '../../../lib/index';

const app = express();
const besu = new BesuNetwork();

app.use(express.json());

app.post('/network', async (req, res) => {
    const { networkName, subnet } = req.body;
    try {
        await besu.createNetwork(networkName, subnet);
        res.status(201).send({ message: `Network ${networkName} created successfully.` });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.delete('/network/:networkName', async (req, res) => {
    const { networkName } = req.params;
    try {
        await besu.deleteNetwork(networkName);
        res.status(200).send({ message: `Network ${networkName} deleted successfully.` });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/network/:networkName/node', async (req, res) => {
    const { networkName } = req.params;
    const { containerName, nodeport, networkPath } = req.body;
    try {
        await besu.addNode(containerName, networkName, nodeport, networkPath);
        res.status(201).send({ message: `Node ${containerName} added to network ${networkName} successfully.` });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.delete('/node/:containerName', async (req, res) => {
    const { containerName } = req.params;
    try {
        await besu.removeNode(containerName);
        res.status(200).send({ message: `Node ${containerName} deleted successfully.` });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/networks', async (req, res) => {
    try {
        const networks = await besu.getNetworks();
        res.status(200).send(networks);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/network/:networkName/nodes', async (req, res) => {
    const { networkName } = req.params;
    try {
        const nodes = await besu.getNodes(networkName);
        res.status(200).send(nodes);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.get('/balance/:address', async (req, res) => {
    const { address } = req.params;
    try {
        const balance = await besu.getBalance(address);
        res.status(200).send({ balance });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/transfer', async (req, res) => {
    const { from, to, amount } = req.body;
    try {
        await besu.transfer(from, to, amount);
        res.status(200).send({ message: 'Transfer successful.' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});