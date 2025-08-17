const { ethers } = require('ethers');

// Configuration
const ADMIN_PRIVATE_KEY = '02af70c426a04bd1c0baa164e850b1bf92d643b891d865d0ade165f3646aef02';
const DESTINATION_ADDRESS = '0x3DC29f7394Bd83fC99058e018426eB8724629fC6';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const USDC_CONTRACT = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// USDC ABI (juste les fonctions nécessaires)
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

class BlockchainManager {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
    this.wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, this.provider);
    this.usdcContract = new ethers.Contract(USDC_CONTRACT, USDC_ABI, this.wallet);
    this.decimals = 6; // USDC a 6 décimales
  }

  async sendUSDC(amount = 2) {
    try {
      console.log(`🚀 Sending ${amount} USDC to ${DESTINATION_ADDRESS}...`);
      
      // Convertir le montant en wei (USDC a 6 décimales)
      const amountInWei = ethers.parseUnits(amount.toString(), this.decimals);
      
      // Vérifier le solde
      const balance = await this.usdcContract.balanceOf(this.wallet.address);
      console.log(`💰 Current balance: ${ethers.formatUnits(balance, this.decimals)} USDC`);
      
      if (balance < amountInWei) {
        throw new Error(`Insufficient balance. Need ${amount} USDC, have ${ethers.formatUnits(balance, this.decimals)} USDC`);
      }
      
      // Envoyer la transaction
      const tx = await this.usdcContract.transfer(DESTINATION_ADDRESS, amountInWei);
      console.log(`📡 Transaction sent: ${tx.hash}`);
      
      // Attendre la confirmation
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      
      return {
        success: true,
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        amount: amount
      };
      
    } catch (error) {
      console.error('❌ Error sending USDC:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getBalance() {
    try {
      const balance = await this.usdcContract.balanceOf(this.wallet.address);
      return ethers.formatUnits(balance, this.decimals);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async getDestinationBalance() {
    try {
      const balance = await this.usdcContract.balanceOf(DESTINATION_ADDRESS);
      return ethers.formatUnits(balance, this.decimals);
    } catch (error) {
      console.error('Error getting destination balance:', error);
      return '0';
    }
  }
}

module.exports = BlockchainManager;
