import {ethers} from 'ethers';
//For Transaction test in the script.sh
async function transfer(from: string, to: string, amount: string, urlhost: string): Promise<void> {
    try {
        console.log(`Sending: ${amount} ETH`);
        const provider = new ethers.JsonRpcProvider(urlhost, { chainId: 170194, name: "private" });
        const wallet = new ethers.Wallet(from, provider);
        const tx = await wallet.sendTransaction({
            to: to,
            value: ethers.parseEther(amount.toString())
        });

        console.log(`Transaction send: ${tx.hash} `);
        const result = await tx.wait();
        console.log("Transaction result: ", result)

    } catch (error) {
        console.error("Error en la transacción:", error);
    }
}

//Arguments for script.sh
const args = process.argv.slice(3);
const [from,to,amount,urlhost] = args
if(args.length < 4){
    console.log("Error. Parameters missing: yarn tsx ./script/tx.ts transfer <from> <to> <amount> <urlhost>");
    process.exit(1);
}

transfer(from, to, amount,urlhost)