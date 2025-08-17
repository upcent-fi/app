import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate onramp amount (same logic as server)
  const calculateOnrampAmount = (expenseAmount) => {
    const expense = parseFloat(expenseAmount);
    if (isNaN(expense) || expense <= 0) return 0;
    
    // Round up to the next multiple of 10, then subtract the expense
    const nextMultipleOf10 = Math.ceil(expense / 10) * 10;
    return nextMultipleOf10 - expense;
  };

  // Scrape data from the expenses API (port 3001)
  const fetchDataFromAPI = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/expenses');
      if (!response.ok) {
        throw new Error('Failed to fetch data from expenses API');
      }
      const data = await response.json();
      
      // Filter only expense transactions (not onramp ones)
      const userExpenses = data.expenses.filter(exp => exp.type === 'expense');
      
      // Create display transactions with onramps above each expense
      const displayTransactions = [];
      let totalOnrampSavings = 0;
      
      userExpenses.forEach(expense => {
        const onrampAmount = calculateOnrampAmount(expense.amount);
        
        // Add onramp transaction above the expense
        if (onrampAmount > 0) {
          displayTransactions.push({
            id: `onramp-${expense.id}`,
            reason: 'On Ramp Coinbase',
            amount: onrampAmount,
            type: 'onramp',
            timestamp: expense.timestamp
          });
          totalOnrampSavings += onrampAmount;
        }
        
        // Add the expense
        displayTransactions.push({
          ...expense,
          type: 'expense'
        });
      });
      
      setExpenses(displayTransactions);
      setTotalSavings(totalOnrampSavings);
      setError(null);
    } catch (error) {
      console.error('Error scraping data:', error);
      setError('Failed to connect to expenses API. Make sure the server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and refresh every 5 seconds
  useEffect(() => {
    fetchDataFromAPI();
    const interval = setInterval(fetchDataFromAPI, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatUSDC = (amount) => {
    return `${amount.toFixed(2)} USDC`;
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="error-container">
          <h2>⚠️ Connection Error</h2>
          <p>{error}</p>
          <button onClick={fetchDataFromAPI} className="retry-button">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>USDC Savings</h1>
      </header>
      
      <main className="App-main">
        {/* Savings Summary */}
        <div className="savings-summary">
          <div className="savings-card">
            <h2>Total Savings</h2>
            <div className="savings-amount">
              <span className="currency-symbol">$</span>
              <span className="amount">{totalSavings.toFixed(2)}</span>
              <span className="currency-code">USD</span>
            </div>
            <div className="usdc-amount">
              {formatUSDC(totalSavings)}
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="expenses-list">
          <h2>Transactions</h2>
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
      </main>
    </div>
  );
}

export default App;
