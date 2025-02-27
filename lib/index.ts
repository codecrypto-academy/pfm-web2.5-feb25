//For Setting-up and testing network&nodes creation
import { ethers } from 'ethers';


//For Transaction test
async function transfer(from: string, to: string, amount: string, urlhost: string) {
    try {
        console.log(`Sending: ${amount}ETH`);
        const provider = new ethers.JsonRpcProvider(urlhost, { chainId: 170194, name: "private" });
        const wallet = new ethers.Wallet(from, provider);
        const tx = await wallet.sendTransaction({
            to: to,
            value: ethers.parseEther(amount.toString())
        });

        console.log(`Transaction send: ${tx.hash}`);
        const result = await tx.wait();
        console.log("Transaction result: ", result)

        return result;
    } catch (error) {
        console.error("Error en la transacción:", error);
    }
}
//Arguments for script.sh
const args = process.argv.slice(3)
const [from, to, amount, urlhost] = args
if (args.length < 4) {
    console.error("Error: Faltan parametros. yarn tsx ./lib/index.ts transfer <from> <to> <amount> <url>")
    process.exit(1);
}

transfer(from, to, amount, urlhost);
