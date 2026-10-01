const { ethers } = require('ethers');
const { mnemonicNew, mnemonicToPrivateKey } = require('@ton/crypto');
const { WalletContractV4 } = require('@ton/ton');
const fs = require('fs');

async function generate() {
    console.log("Generating Secret Wallets for Bot...");

    // Generate EVM (BEP20) Wallet
    const evmWallet = ethers.Wallet.createRandom();
    const evmAddress = evmWallet.address;
    const evmPrivateKey = evmWallet.privateKey;
    console.log(`[EVM] Address: ${evmAddress}`);

    // Generate TON Wallet
    const mnemonics = await mnemonicNew();
    const keyPair = await mnemonicToPrivateKey(mnemonics);
    const workchain = 0; // Basechain
    const tonWallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    const tonAddress = tonWallet.address.toString({ testOnly: false });
    const tonSeed = mnemonics.join(' ');
    console.log(`[TON] Address: ${tonAddress}`);

    // Append to .env
    let envContent = `\n# --- SECRET BOT WALLETS ---\n`;
    envContent += `BOT_EVM_ADDRESS=${evmAddress}\n`;
    envContent += `BOT_EVM_PRIVATE_KEY=${evmPrivateKey}\n`;
    envContent += `BOT_TON_ADDRESS=${tonAddress}\n`;
    envContent += `BOT_TON_SEED=${tonSeed}\n`;

    fs.appendFileSync('.env', envContent);
    console.log("Wallets successfully generated and saved to .env!");
}

generate();
