import React, { useState, useEffect } from 'react';
import { buildAaveSupplyTxs } from './aaveService';
import { buildMorphoDepositTxs } from './morphoService';
import { useWalletAPIClient, useAccounts } from '@ledgerhq/wallet-api-client-react';
import './UnifiedDashboard.css';

interface Transaction {
  id: string;
  reason: string;
  amount: number;
  type: 'expense' | 'onramp';
  timestamp: string;
}

interface ExpensesData {
  expenses: Transaction[];
  totalSavings: number;
}

// Fetch the best platform from the GraphQL endpoint
async function fetchBestPlatformFromGraphQL(): Promise<'morpho' | 'aave'> {
  try {
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
  } catch (error) {
    console.error('Error fetching platform:', error);
  }
  // fallback
  return 'aave';
}

function UnifiedDashboard() {
  const [platform, setPlatform] = useState<'morpho' | 'aave'>('aave');
  const [hasPosition, setHasPosition] = useState(false);
  const [onAave, setOnAave] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Tracker USDC states
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [trackerLoading, setTrackerLoading] = useState(true);
  const [trackerError, setTrackerError] = useState<string | null>(null);

  // Transactions drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [drawerTopPosition, setDrawerTopPosition] = useState(400); // Default position

  const walletAPI = useWalletAPIClient();
  const { accounts } = useAccounts();

  // Request account access from Ledger Live on mount
  useEffect(() => {
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

  // Fetch platform recommendation
  useEffect(() => {
    const fetchPlatform = async () => {
      const recommendedPlatform = await fetchBestPlatformFromGraphQL();
      setPlatform(recommendedPlatform);
    };
    
    fetchPlatform();
    const interval = setInterval(fetchPlatform, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch tracker data
  const fetchTrackerData = async () => {
    try {
      setTrackerLoading(true);
      const response = await fetch('http://localhost:3001/api/expenses');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data: ExpensesData = await response.json();
      setExpenses(data.expenses);
      setTotalSavings(data.totalSavings || 0);
      setTrackerError(null);
    } catch (error) {
      console.error('Error fetching tracker data:', error);
      setTrackerError('Serveur onramp non disponible');
    } finally {
      setTrackerLoading(false);
    }
  };

  // Load tracker data and refresh every 5 seconds
  useEffect(() => {
    fetchTrackerData();
    const interval = setInterval(fetchTrackerData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  // Calculate drawer position based on content height
  useEffect(() => {
    const updateDrawerPosition = () => {
      const positionBlock = document.querySelector('.current-position-block');
      if (positionBlock) {
        const rect = positionBlock.getBoundingClientRect();
        const bottomPosition = rect.bottom + window.scrollY;
        setDrawerTopPosition(bottomPosition + 20); // 20px gap
      }
    };

    updateDrawerPosition();
    window.addEventListener('resize', updateDrawerPosition);
    return () => window.removeEventListener('resize', updateDrawerPosition);
  }, [hasPosition, platform]);

  // Hardcoded demo addresses and amount
  const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  const morphoAddress = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
  const aavePoolAddress = '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951';
  const userAddress = '0x7740a8802D58ff19E50362517e1e6916d26D45c0';
  const amount = '1000000'; // 1 USDC (6 decimals)

  const handleDeposit = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error during deposit:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatUSDC = (amount: number) => {
    return `${amount.toFixed(2)} USDC`;
  };

  // Handle touch/drag events for transactions drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaY = startY - currentY;
    const threshold = 100; // Minimum distance to trigger open/close
    
    if (deltaY > threshold) {
      // Swipe up - open drawer
      setIsDrawerOpen(true);
    } else if (deltaY < -threshold) {
      // Swipe down - close drawer
      setIsDrawerOpen(false);
    }
    
    setCurrentY(0);
    setStartY(0);
  };

  const handleMouseStart = (e: React.MouseEvent) => {
    setStartY(e.clientY);
    setCurrentY(e.clientY);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentY(e.clientY);
  };

  const handleMouseEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaY = startY - currentY;
    const threshold = 100;
    
    if (deltaY > threshold) {
      setIsDrawerOpen(true);
    } else if (deltaY < -threshold) {
      setIsDrawerOpen(false);
    }
    
    setCurrentY(0);
    setStartY(0);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <div className="unified-dashboard">
      <main className="dashboard-main">
        <div className="dashboard-single-column">
          {/* Tracker Section */}
          <section className="tracker-section-clean">

            {trackerError ? (
              <div className="tracker-error">
                <div className="error-icon">⚠️</div>
                <p>{trackerError}</p>
                <p className="error-help">
                  Lancez le simulateur: <code>cd onramp && npm start</code>
                </p>
              </div>
            ) : (
              <>
                {/* Savings Summary */}
                <div className="balance-section">
                  <div className="balance-left">
                    <div className="total-savings">
                      <div className="savings-amount">
                        <span className="currency-symbol">$</span>
                        <span className="amount-integer">{Math.floor(totalSavings || 0)}</span>
                        <span className="amount-decimals">.{((totalSavings || 0) % 1).toFixed(2).slice(2)}</span>
                      </div>
                      <h3>Total Saved</h3>
                    </div>
                    
                    {/* Action Capsules */}
                    <div className="action-capsules">
                      <div className="capsule green-capsule">
                        <svg className="growth-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 9v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span>+12.5%</span>
                      </div>
                      
                      <div className="capsule pink-capsule" onClick={() => navigator.clipboard.writeText('0x7740a8802D58ff19E50362517e1e6916d26D45c0')}>
                        <svg className="clip-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span>0x2...Mf1</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Position Info */}
                <div className="current-position-block">
                  <h3 className="position-title">Position Actuelle</h3>
                  <p className="recommendation-subtitle">
                    {platform === 'aave'
                      ? 'Aave offre actuellement de meilleurs rendements que Morpho. Optimisez vos gains en basculant vos fonds.'
                      : 'Morpho optimise vos rendements grâce à ses stratégies avancées. Passez d\'Aave pour maximiser vos gains.'
                    }
                  </p>
                  <button 
                    onClick={handleDeposit}
                    disabled={loading}
                    className={`deposit-button-simple ${loading ? 'loading' : ''}`}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Dépôt en cours...
                      </>
                    ) : (
                      <>
                        Déposer sur {platform === 'aave' ? 'Aave' : 'Morpho'}
                      </>
                    )}
                  </button>

                  {hasPosition && (
                    <div className="position-status-simple">
                      <span className="status-icon">✅</span>
                      <span>Position active sur {onAave ? 'Aave' : 'Morpho'}</span>
                    </div>
                  )}
                </div>


              </>
            )}
          </section>
        </div>
      </main>

      {/* Bottom Navigation Bar - iOS Style */}
      <nav className="bottom-nav">
        <div className="nav-item active">
          <svg className="nav-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
            <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className="nav-item disabled">
          <svg className="nav-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className="nav-item disabled">
          <svg className="nav-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className="nav-item disabled">
          <svg className="nav-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
      </nav>

      {/* Transactions Drawer */}
      <div 
        className={`transactions-drawer ${isDrawerOpen ? 'open' : 'closed'}`}
        style={{
          top: isDrawerOpen ? '40px' : `${drawerTopPosition}px`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseStart}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseEnd}
        onMouseLeave={handleMouseEnd}
      >
        <div className="drawer-handle" onClick={toggleDrawer}>
          <div className="handle-bar"></div>
        </div>
        <div className="drawer-header">
          <h2>Transactions</h2>
        </div>
        <div className="drawer-content">
          {trackerError ? (
            <div className="drawer-error">
              <div className="error-icon">⚠️</div>
              <p>{trackerError}</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="drawer-empty">
              <div className="empty-icon">💸</div>
              <p>Aucune transaction pour le moment</p>
            </div>
          ) : (
            <div className="drawer-transactions-list">
              {expenses.map(transaction => (
                <div key={transaction.id} className="drawer-transaction-item">
                  <div className="transaction-icon">
                    {transaction.type === 'onramp' ? '💰' : '💳'}
                  </div>
                  <div className="transaction-details">
                    <span className="transaction-reason">{transaction.reason}</span>
                    <span className="transaction-time">
                      {new Date(transaction.timestamp).toLocaleDateString('fr-FR')} à {new Date(transaction.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="transaction-amount">
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnifiedDashboard;
