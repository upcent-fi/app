import React, { useState } from 'react';
import Home from './Home';
import PlatformPage from './PlatformPage';
import { buildAaveSupplyTxs } from './aaveService';
import { buildMorphoDepositTxs } from './morphoService';
import { useWalletAPIClient, useAccounts } from '@ledgerhq/wallet-api-client-react';

  
// Fetch the best platform from the GraphQL endpoint
async function fetchBestPlatformFromGraphQL(): Promise<'morpho' | 'aave'> {
  const res = await fetch('https://indexer.dev.hyperindex.xyz/21170ac/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `query { lastBestProtocolSelected(distinct_on: id) { id, timestamp, protocol, blockNumber } }`
    })
  });
  const data = await res.json();
  // protocol: "0" = morpho, "1" = aave
  const protocol = data?.data?.lastBestProtocolSelected?.[0]?.protocol;
  if (protocol === '0') return 'morpho';
  if (protocol === '1') return 'aave';
  // fallback
  return 'morpho';
}

function AppContent() {
  const [page, setPage] = useState<'home' | 'platform'>('home');
  const [platform, setPlatform] = useState<'morpho' | 'aave' | null>(null);
  const [hasPosition, setHasPosition] = useState(false); // Simulate user position
  const [onAave, setOnAave] = useState(false);
  const walletAPI = useWalletAPIClient();
  const { accounts } = useAccounts();

  // Request account access from Ledger Live on mount
  React.useEffect(() => {
    async function requestAccounts() {
      if (walletAPI && walletAPI.client) {
        try {
          await walletAPI.client.request('account.request', { currencyIds: ['base_sepolia'] });
        } catch (e) {
          console.warn('Account request was rejected or failed:', e);
        }
      }
    }
    requestAccounts();
  }, [walletAPI]);

  // Find the first EVM (ethereum) account with a type guard
  function isEvmAccount(acc: any): boolean {
    if (!acc || !acc.currency) return false;
    if (typeof acc.currency === 'string') {
      return acc.currency === 'base_sepolia' || acc.currency === 'evm';
    }
    if (typeof acc.currency === 'object' && acc.currency.family) {
      return acc.currency.family === 'ethereum' || acc.currency.family === 'evm';
    }
    return false;
  }
  const evmAccount = (accounts ?? []).find(isEvmAccount);
  React.useEffect(() => {
    console.log('All accounts from Ledger Live:', accounts);
    if (evmAccount) {
      console.log('EVM account found:', evmAccount);
    } else {
      console.log('No EVM account found');
    }
  }, [accounts, evmAccount]);

  // Poll the GraphQL endpoint every 5 seconds when on the platform page
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (page === 'platform') {
      const poll = async () => {
        const best = await fetchBestPlatformFromGraphQL();
        setPlatform(best);
      };
      poll(); // initial fetch
      interval = setInterval(poll, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [page]);

  const handleEnter = async () => {
    setPage('platform');
  };

  // Hardcoded demo addresses and amount
  const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  const morphoAddress = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
  const aavePoolAddress = '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951';
  const userAddress = '0x7740a8802D58ff19E50362517e1e6916d26D45c0';
  const amount = '1000000'; // 1 USDC (6 decimals)

  const handleDeposit = async () => {
    let txs;
    if (platform === 'aave') {
      txs = buildAaveSupplyTxs({ usdcAddress, poolAddress: aavePoolAddress, amount, onBehalfOf: userAddress });
      setOnAave(true);
    } else {
      txs = buildMorphoDepositTxs({ usdcAddress, morphoAddress, amount, onBehalfOf: userAddress });
      setOnAave(false);
    }
    setHasPosition(true);
    if (walletAPI && walletAPI.client && evmAccount) {
      for (const tx of txs) {
        await walletAPI.client.request('transaction.sign', {
          accountId: evmAccount.id,
          rawTransaction: {
            family: 'ethereum',
            recipient: tx.to,
            data: tx.data,
            amount: tx.value,
          }
        });
      }
    } else if (!evmAccount) {
      alert('No EVM account found in wallet.');
    }
  };

  const handleSwitch = async () => {
    let txs = [];
    if (platform === 'aave' && !onAave) {
      alert('Simulate withdraw from Morpho (not implemented)');
      txs = buildAaveSupplyTxs({ usdcAddress, poolAddress: aavePoolAddress, amount, onBehalfOf: userAddress });
      setOnAave(true);
    } else if (platform === 'morpho' && onAave) {
      alert('Simulate withdraw from Aave (not implemented)');
      txs = buildMorphoDepositTxs({ usdcAddress, morphoAddress, amount, onBehalfOf: userAddress });
      setOnAave(false);
    } else {
      txs = buildAaveSupplyTxs({ usdcAddress, poolAddress: aavePoolAddress, amount, onBehalfOf: userAddress });
      alert('Already on the right platform, nothing to do.');
      return;
    }
    setHasPosition(true);
    if (walletAPI && walletAPI.client && evmAccount) {
      for (const tx of txs) {
        await walletAPI.client.request('transaction.sign', {
          accountId: evmAccount.id,
          rawTransaction: {
            family: 'ethereum',
            recipient: tx.to,
            data: tx.data,
            amount: tx.value,
          }
        });
      }
    } else if (!evmAccount) {
      alert('No EVM account found in wallet.');
    }
  };

  if (page === 'home') {
    return <Home onEnter={handleEnter} />;
  }

  if (platform) {
    return (
      <PlatformPage
        platform={platform}
        hasPosition={hasPosition}
        onDeposit={handleDeposit}
        onSwitch={handleSwitch}
      />
    );
  }


  return null;
}

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
