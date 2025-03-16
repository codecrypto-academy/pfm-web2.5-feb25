# PFM Web 2.5 Project

## 📌 Description
This project is a **Next.js** web application with **TypeScript**, focused on managing balances, transfers, and node administration in a blockchain network. It also includes scripts for automating tasks related to node infrastructure.

## 🛠️ Technologies Used
- **Next.js**: React framework with server-side rendering (SSR).
- **TypeScript**: JavaScript superset with static typing.
- **Jest**: Testing framework for JavaScript and TypeScript.
- **PostCSS**: Tool for transforming CSS styles using modern plugins.
- **Shell Scripts**: Automation for blockchain-related tasks.

## 📂 Project Structure
```
pfm-web2.5-feb25-main/
│── frontback/             # Next.js application (frontend + business logic)
│   ├── public/           # Static assets (images, icons, etc.)
│   ├── src/
│   │   ├── app/         # Main pages
│   │   │   ├── balance/      # Balance page
│   │   │   ├── transfer/     # Transfer page
│   │   │   ├── manager/      # Management page
│   │   │   ├── faucet/       # Faucet page
│   │   ├── components/  # Reusable components
│   │   ├── lib/         # Business logic library
│   │   │   ├── __test__/    # Unit tests with Jest
│   ├── package.json     # Dependencies and scripts
│   ├── tsconfig.json    # TypeScript configuration
│   ├── next.config.ts   # Next.js configuration
│
│── script/               # Scripts for blockchain node management
│   ├── AllBalances.sh        # Retrieves balances
│   ├── NodeCreation.sh       # Creates nodes in the blockchain network
│   ├── OnlyTransferTest.sh   # Transfer test
│   ├── newNode.sh, deleteNode.sh, getNodeAddress.sh  # Node management
│
│── package.json         # General project configuration
│── jest.config.js       # Testing configuration
```

## 🚀 Installation
1. Clone this repository:
   ```sh
   git clone https://github.com/fmarsan626/pfm-web2.5-feb25.git
   cd pfm-web2.5-feb25-main/frontback
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the development server:
   ```sh
   npm run dev
   ```
4. Open the application in your browser at `http://localhost:3000`

## 📜 Initialization
You can run the following commands in the `frontback` directory:

- `npm run dev` - Starts the development server.
- `npm run build` - Builds the project for production.
- `npm start` - Runs the application in production mode.
- `npm test` - Runs tests with Jest.

## 📌Videos by sections on how to use it
### 1️⃣ Manager
From the Manager view, we can use Create New Network to automatically create a network with 4 nodes. This will also generate a transfer between nodes 1 and 2 to test it and set the necessary environment variables for operation.
* 🎥[![Manager]](https://www.loom.com/share/7b0b4185c9764443b42ae36efe25f7be?sid=0b8e88fc-b1ac-4e9b-995c-6b1c4eb69690)



## 🤝 Contribution
If you want to contribute to the project:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-new`).
3. Make your changes and commit (`git commit -m 'Description of the change'`).
4. Submit a pull request.

## 📄 License
[In progress]

---

