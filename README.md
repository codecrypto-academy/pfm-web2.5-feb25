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
- **TypeScript**: A library for creating and managing nodes.
- **Hyperledger Besu**: Technology for creating private networks with Proof of Authority (QBFT, IBFT2.0, Clique) protocols.
- **Ethers**: 
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
- **Docker**
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
```

### 5️. Start the Hyperledger Besu Network with Clique PoA

Run the deployment script:

```bash
./script/script.sh
```

### 6. Start the Development Server

```bash
yarn dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).


## Usage

The application allows users to register, log in, and add a series of products to a cart for purchase through a payment gateway. It follows an API-based approach to manage user interactions and the database.

