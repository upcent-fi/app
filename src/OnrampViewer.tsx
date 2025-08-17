import React, { useState, useEffect } from 'react';
import './OnrampViewer.css';

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

function OnrampViewer() {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/expenses');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data: ExpensesData = await response.json();
      setExpenses(data.expenses);
      setTotalSavings(data.totalSavings); 
      setError(null);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load data. Make sure the server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  // Load expenses on component mount and refresh every 5 seconds
  useEffect(() => {
    fetchExpenses();
    const interval = setInterval(fetchExpenses, 5000);
    return () => clearInterval(interval);
  }, []);

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

  if (loading) {
    return (
      <div className="onramp-viewer">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="onramp-viewer">
        <div className="error-container">
          <h2>⚠️ Connection Error</h2>
          <p>{error}</p>
          <button onClick={fetchExpenses} className="retry-button">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onramp-viewer">
      <header className="onramp-header">
        <h1>💰 USDC Savings Tracker</h1>
        <p>Monitor your onramp savings from Coinbase</p>
      </header>
      
      <main className="onramp-main">
        {/* Savings Summary */}
        <div className="savings-summary">
          <div className="savings-card">
            <h2>Total Savings</h2>
            <div className="savings-amount">
              <span className="currency-symbol">$</span>
              <span className="amount">{(totalSavings || 0).toFixed(2)}</span>
              <span className="currency-code">USD</span>
            </div>
            <div className="usdc-amount">
              {formatUSDC(totalSavings || 0)}
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="expenses-list">
          <h2>Recent Transactions</h2>
          <div className="expenses-container">
            {expenses.length === 0 ? (
              <p className="no-expenses">No transactions yet. Add expenses on the main app to see them here!</p>
            ) : (
              expenses.map(transaction => (
                <div 
                  key={transaction.id} 
                  className={`expense-item ${transaction.type}`}
                >
                  <div className="expense-info">
                    <span className="expense-reason">{transaction.reason}</span>
                    <span className="expense-time">
                      {new Date(transaction.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="expense-amount">
                    <span className="amount-value">
                      {formatCurrency(transaction.amount)}
                    </span>
                    {transaction.type === 'onramp' && (
                      <span className="usdc-value">
                        {formatUSDC(transaction.amount)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="refresh-section">
          <button onClick={fetchExpenses} className="refresh-button">
            🔄 Refresh Data
          </button>
          <p className="refresh-info">Auto-refreshes every 5 seconds</p>
        </div>
      </main>
    </div>
  );
}

export default OnrampViewer;
