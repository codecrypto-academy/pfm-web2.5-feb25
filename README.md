# Web 2.5 - TFM Hyperledger Besu

## Initial considerations

Pre launching step is **giving execution permission** to the script file:

```bash
chmod +x script.sh
```

Then we can run the script:

```bash
./script.sh
```

## Script

User only have to launch the script to create the network:

```bash
./script.sh
```

And the `script` will create the Besu (Clique) three nodes network following the next steps:

1. Check if `Docker` is installed

2. Create the `Node1` address

3. Create the `genesis.json` file

4. Create the `network` inside `Docker`

5. Run `Node1`

6. Get `Node1` interal IP and composing `enode` URL

7. Run `Node2`

8. Run `Node3`

## Library

## Notes & final considerations

### Questions

- When the network is running, shall we test the transactions by doing some using code or can we use Metamask extension in the browser

```bash
docker run -p 8545:8545 -p 8546:8546 -p 30303:30303 hyperledger/besu:latest --rpc-http-enabled --rpc-ws-enabled

# docker run -d -p ${PORTJSON}:8545 -p ${PORTWS}:8546 -p ${PORTP2P}:30303 hyperledger/besu:latest --rpc-http-enabled --rpc-ws-enabled
```

Ejecutar el contenedor de un nodo efímero (se eliminará al terminar la ejecución del comando que le pasamos) y exportar la dirección:

```bash
docker run --rm -v ./besuClique/Node-1/data:/data hyperledger/besu:latest --data-path=/data public-key export-address --to=/data/node1Address



```
