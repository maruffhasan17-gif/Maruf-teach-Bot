const { ethers } = require('ethers');
require('dotenv').config();

const RPC_URL = 'https://arbitrum-one.publicnode.com';
const USDT_CONTRACT = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
const DESTINATION = '0xec701a001d920c6e00e0768506ccc5b63908e45d';

async function sendArbitrumUsdt() {
    const privKey = process.env.BOT_EVM_PRIVATE_KEY;
    if (!privKey) {
        console.error('Error: BOT_EVM_PRIVATE_KEY not found in .env');
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(privKey.trim(), provider);

    console.log(`\n========================================`);
    console.log(`Arbitrum One USDT Transfer Tool`);
    console.log(`========================================`);
    console.log(`Sender Address:     ${wallet.address}`);
    console.log(`Receiver Address:   ${DESTINATION}`);

    // Check ETH balance for gas
    const ethBalance = await provider.getBalance(wallet.address);
    console.log(`Native ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

    // Check USDT balance
    const usdt = new ethers.Contract(
        USDT_CONTRACT,
        [
            'function balanceOf(address) view returns (uint256)',
            'function transfer(address to, uint256 amount) returns (bool)'
        ],
        wallet
    );

    const usdtBalanceRaw = await usdt.balanceOf(wallet.address);
    const usdtBalanceFormatted = ethers.formatUnits(usdtBalanceRaw, 6);
    console.log(`USDT Balance:       ${usdtBalanceFormatted} USDT`);

    if (usdtBalanceRaw === 0n) {
        console.error('\nError: No USDT balance found in sender wallet.');
        process.exit(1);
    }

    if (ethBalance === 0n) {
        console.error(`\n[!] Insufficient Gas:`);
        console.error(`Arbitrum One requires a tiny amount of ETH for transaction gas (~0.00001 ETH, less than $0.05).`);
        console.error(`Please deposit ~0.00005 ETH to ${wallet.address} on Arbitrum One network and run this script again.`);
        process.exit(1);
    }

    console.log(`\nSending ${usdtBalanceFormatted} USDT to ${DESTINATION}...`);
    const tx = await usdt.transfer(DESTINATION, usdtBalanceRaw);
    console.log(`Transaction broadcasted! Tx Hash: ${tx.hash}`);
    console.log(`Waiting for confirmation...`);

    const receipt = await tx.wait(1);
    console.log(`\n[✓] Transaction confirmed in block ${receipt.blockNumber}!`);
    console.log(`Explorer Link: https://arbiscan.io/tx/${tx.hash}`);
}

sendArbitrumUsdt().catch((err) => {
    console.error('\nTransaction Error:', err.message);
    process.exit(1);
});
