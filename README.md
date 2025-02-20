# Web 2.5 - TFM Hyperledger Besu

## Launching Besu with sript

First step is giving execution permission to the script file: 

```bash
chmod +x run_docker.sh
```
Then we can run the script: 

```bash
./script.sh
```


### Notes 

```bash
docker run -p 8545:8545 -p 8546:8546 -p 30303:30303 hyperledger/besu:latest --rpc-http-enabled --rpc-ws-enabled
```