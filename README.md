# Automation Project with Hyperledger Besu and Docker

Welcome to the Automation and Network Management project developed with **Next.js**. This repository contains the source code of the application, as well as the initial documentation for its API.

## Content

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Usage](#usage)

## Features

- Implementation of Hyperledger Besu with Clique PoA.
- Automatic creation and deployment of the network.
- TypeScript library for node management and network interaction.
- Responsive user interface.

## Technologies Used

- **Next.js**: A React framework for optimized web application development.
- **TypeScript**
- **Hyperledger Besu**: Technology for creating private networks with Proof of Authority (QBFT, IBFT2.0, Clique) protocols.
- **Ethers**: A library for managing nodes interaction and info.
- **Docker**: Used to create containers for deploying nodes.
- **Tailwind CSS**: A CSS framework for styling.

## Project Structure
```
📂 Project
├── 📂 script        # Deployment script
│    └── script.sh  
├── 📂 lib           # TypeScript Library
│    └── index.ts  
├── 📂 frontback     # NextJS Framework
│    ├── 📂 src 
│    │    └── 
│    ...
├── README.md        # Usage and Installation instructions
└── ...
```

## Environment Setup

### 1️. Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (recommended version: 18.18.0 or higher)
- **Yarn** (recommended version: 1.22.22 or higher)
- **Docker** (must be running before any interaction)
- **WSL2** (if working on Windows)
- **Hyperledger Besu**: [Installation Guide](https://besu.hyperledger.org/private-networks/get-started/install)

### 2️. Install Besu

Follow the steps in the official guide:
[https://besu.hyperledger.org/private-networks/get-started/install](https://besu.hyperledger.org/private-networks/get-started/install)

### 3️. Clone the Repository from GitHub

```bash
git clone https://github.com/ikermendii/ikermendii-pfmweb2.5-feb25.git
```

### 4️. Install Dependencies

```bash
yarn install
yarn add ethers
yarn add fs
yarn add child_process
yarn add jest
```

### 5️. For testing the setup of Hyperledger Besu Network with Clique PoA

Run the deployment script:

```bash
./script/script.sh
```

### 6. Start the Development Server for developing and interacting with the app

```bash
cd frontback
yarn dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).


## Usage

The application allows to launch a private network based on Hyperledger Besu with PoA Clique protocol. It also allows users to make transactions between different wallets, get balances and provide tokens from provider.

## Interactions with the Server

### Create a Network:

- Go to the "Network Manager" section.
-Click on "Create Network".
- Fill in the required details such as Network Name, Chain ID, Subnet, Bootnode Name, and Por.(You can add the amount of nodes you need).
- Click "Create Network".

### Add Nodes to the Network:

- After creating a network, you can add nodes to it.
- Go to the "Networks Dashboard".
- Select the network you want to add nodes to.
- Click on "Add Node".
- Fill in the Node Name and Port.
- Click "Add Node".

### Delete Nodes from the Network:

- Go to the "Networks Dashboard".
- Select the network you want to manage.
- Click on "Delete Node".
- Select the node you want to delete and confirm the deletion.

### Delete a Network:

- Go to the "Network Manager" section.
- Click on "Delete Network".
- Enter the Network Name you want to delete.
- Confirm the deletion.
    (You can also delete the Network from the "Networks Dashboard" by clicking on Delete Network button and confirming)

### Perform Interactions:

- Go to the "Interactions" section.
- Select the network you want to interact with.
- You can perform the following actions:

    -- Request Tokens: Request tokens from the provider.

    -- Transfer Tokens: Send tokens from one address to another. (You need to config at Metamask the netWork created (details on "Networks Dashboard") in which you want to interact and import the addresses using the privateKey -> networks/$networkName/$nodeName/key)
    It has been included a page_noMetamask.tsx which allows making transferences without using Metamask as if you were an Admin to manage the accounts and getting access to each privateKey to sign the transferences.

    -- Check Balances: Check the balance of a specific address.

  You should start Requesting Tokens before doing anything else because you will start with no funds.

  For this interactions you must get the addresses from de proyect files: networks/$networkName/$nodeName/address. If you prefer, you can use the private key (networks/$networkName/$nodeName/key) of each to import accounts on Metamask(need to config the network you are going to use). The current config is set with Bootnode as RPC.


For any further assistance, refer to the [Next.js Documentation](https://nextjs.org/docs) and [Hyperledger Besu Documentation](https://besu.hyperledger.org).