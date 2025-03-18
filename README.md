# Besu Network management
The diferent elements in this project allow you to manage a private hyperlayer Besu network, using proof of Authority Clique

## Project Structure 
The project has the following file structure:

```
📂 pfm-web2.5-feb25
 ├── 📂 script        
 │    └── script.sh    # Script for automating the creation of a BESU network
 │    └── createPrivatePublicKeys.mjs    # Script for generating public and private keys  
 │    └── transaction.js    # Script for performing a test transaction  
 ├── 📂 lib           # TypeScript library for managing a BESU network  
 │    └── 📂 src
 ├── 📂 frontback     # NextJS framework  
 │    ...  
 ├── README.md  
 └── ...  
```

# Part 1
# Script for automatic creation of a Besu network
**This script creates a basic BESU network with the following 3 nodes: rpc-node, bootnode and a miner-node(Initial validator)**


## ⚙️ Requirements  
**Operating System**: The script is designed to work on Linux and macOS-based systems (it can also be run on Windows if you have a Bash-compatible environment, such as WSL).  
**Dependencies**:
- [Node.js]([https://docs.docker.com/get-docker/](https://nodejs.org/es)): Required to execute helper scripts written in JavaScript. Ensure you have Node.js installed and properly configured.
- [Docker](https://docs.docker.com/get-docker/): Utilized for creating and managing network nodes through containerization. Make sure Docker is installed and running.
- Git: Needed to clone the project repository.

## 🔧 Installation  

### Clone the Repository  
Use the following command to clone the repository to your local machine:

```bash
git clone https://github.com/davidGalaviz/pfm-web2.5-feb25.git
```

## 🌟 Try it yourself
1. Move to the script directory
2. Execute the script with the following command
   ```bash
   ./script.sh
   ```

## createBESUnetwork.sh  
The `createBESUnetwork.sh` script automates the creation of a BESU network (Ethereum client compatible with testnets and Mainnet).  

### Running the Script  

Once you have cloned the repository, navigate to the project folder and make the script executable:

```bash
cd pfm-web2.5-feb25
chmod +x createBESUnetwork.sh
```

### Executing the Script  

The script accepts the following commands:  
- **createBesuNetwork** | Creates a BESU network  
- **deleteBesuNetwork** | Deletes a BESU network (Not yet implemented)  
- **addBesuNode** | Adds a node to an existing BESU network (Not yet implemented)  
- **deleteBesuNode** | Removes a node from an existing BESU network (Not yet implemented)  

#### Example Usage:  
```bash
./createBESUnetwork.sh createBesuNetwork
```

### Command createBesuNetwork  
This command in the `createBESUnetwork.sh` script creates a Besu network using Clique PoA.  
<img src="https://github.com/user-attachments/assets/3c7e358c-34ea-4c7e-b89c-d007edc5b056" width="400">

The script allows you to configure the following:  

- **Chain ID**  
- **Number of nodes**: The number of nodes you want in the BESU network.  
- **Network name**: The name you want to assign to the network being created.  
- **Network IP**  
- **Number of bootnodes**  
- **Directory**: The directory where a folder for the network will be created.  

### Example Usage:  
This command will create a BESU network called "TEST" with 4 nodes.  
[https://github.com/your-username/your-repo/raw/main/video.mp4" type="video/mp4](https://github.com/davidGalaviz/pfm-web2.5-feb25/blob/main/script/video-script-demo.mp4)

## createPrivatePublicKeys.mjs  
![CodeCrypto (1)](https://github.com/user-attachments/assets/6957b154-1bd2-4162-98c2-1815688fee51)
