const { ethers } = require('ethers');

// Configuration
const ADMIN_PRIVATE_KEY = '02af70c426a04bd1c0baa164e850b1bf92d643b891d865d0ade165f3646aef02';
const DESTINATION_ADDRESS = '0x7740a8802D58ff19E50362517e1e6916d26D45c0';
const ETH_SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com';
const PYUSD_CONTRACT = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';

// PyUSD ABI (mêmes fonctions que USDC)
const PYUSD_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

class BlockchainManager {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(ETH_SEPOLIA_RPC);
    this.wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, this.provider);
    this.pyusdContract = new ethers.Contract(PYUSD_CONTRACT, PYUSD_ABI, this.wallet);
    this.decimals = 6; // PyUSD a 6 décimales
  }

  async sendPYUSD(amount = 2) {
    try {
      console.log(`🚀 Sending ${amount} PYUSD to ${DESTINATION_ADDRESS}...`);
      
      // Convertir le montant en wei (PyUSD a 6 décimales)
      const amountInWei = ethers.parseUnits(amount.toString(), this.decimals);
      
      // Vérifier le solde
      const balance = await this.pyusdContract.balanceOf(this.wallet.address);
      console.log(`💰 Current balance: ${ethers.formatUnits(balance, this.decimals)} PYUSD`);
      
      if (balance < amountInWei) {
        throw new Error(`Insufficient balance. Need ${amount} PYUSD, have ${ethers.formatUnits(balance, this.decimals)} PYUSD`);
      }
      
      // Envoyer la transaction
      const tx = await this.pyusdContract.transfer(DESTINATION_ADDRESS, amountInWei);
      console.log(`📡 Transaction sent: ${tx.hash}`);
      console.log(`🔍 View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
      
      // Attendre la confirmation
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        amount: amount,
        etherscanUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`
      };
      
    } catch (error) {
      console.error('❌ Error sending PYUSD:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBalance() {
    try {
      const balance = await this.pyusdContract.balanceOf(this.wallet.address);
      return ethers.formatUnits(balance, this.decimals);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async getDestinationBalance() {
    try {
      const balance = await this.pyusdContract.balanceOf(DESTINATION_ADDRESS);
      return ethers.formatUnits(balance, this.decimals);
    } catch (error) {
      console.error('Error getting destination balance:', error);
      return '0';
    }
  }
}

module.exports = BlockchainManager;
