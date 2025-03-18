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
 ├── 📂 frontback     # NextJS framework  ❗Not ready yet 
 │    ...  
 ├── README.md  
 └── ...  
```

# Part 1
# Script for automatic creation of a Besu network
**This script creates a basic BESU network with the following 3 nodes: rpc-node, bootnode and a miner-node(Initial validator)**

❕This script will create a besu network with the following default configurations:
- Name: besu-network
- ChainID: 246700
- Only the miner-node address will be specified in the alloc field


## ⚙️ Requirements  
**Operating System**: The script is designed to work on Linux and macOS-based systems (it can also be run on Windows if you have a Bash-compatible environment, such as **WSL**).  
**Dependencies**:
- [Node.js](https://nodejs.org/es): Required to execute helper scripts written in JavaScript. Ensure you have Node.js installed and properly configured.
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
2. Make sure the script has execution permissions
   ```bash
   chmod +x script.sh
   ```
3. Execute the script with the following command
   ```bash
   ./script.sh
   ```
**Result**
[script.pdf](https://github.com/user-attachments/files/19304576/script.pdf)

1. A running docker network called besu-network
2. A directory called besu-network
3. A directory for each of the nodes
4. A key pair for each node inside of the node directory
   - The private key is stored inside the key file
   - The public key is stored inside the pub file
   - The address is stored inside the address file
   - For the bootnode the enode is stored inside the enode file
5. A running miner node (Should produce blocks)
6. A running bootnode
7. A running rpc node (Listens in the 1002 port)

### Example Usage:  

**Video**
[https://github.com/your-username/your-repo/raw/main/video.mp4" type="video/mp4](https://github.com/davidGalaviz/pfm-web2.5-feb25/blob/main/script/video-script-demo.mp4)

## 📖 Explanation
### Helper Scripts
## 🔐createPrivatePublicKeys.mjs
This script creates a public private key pair
[createPrivatePublicKeys.pdf](https://github.com/user-attachments/files/19304584/createPrivatePublicKeys.pdf)

