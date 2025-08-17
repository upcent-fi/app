import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [expenseReason, setExpenseReason] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/expenses');
      const data = await response.json();
      setTransactions(data.expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  // Load expenses on component mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async () => {
    const amount = parseFloat(expenseAmount);
    const reason = expenseReason.trim();
    
    if (isNaN(amount) || amount <= 0 || reason === '') return;

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, amount }),
      });

      if (response.ok) {
        // Refresh the expenses list
        await fetchExpenses();
        
        // Clear the form
        setExpenseReason('');
        setExpenseAmount('');
      } else {
        console.error('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAddExpense();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Coinbase Onramp Simulator</h1>
        <p>Add expenses and see onramp calculations</p>
      </header>
      
      <main className="App-main">
        {/* Expense Form */}
        <div className="expense-form">
          <input
            type="text"
            value={expenseReason}
            onChange={(e) => setExpenseReason(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Reason for expense"
            className="expense-input"
            disabled={loading}
          />
          <input
            type="number"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Amount (USD)"
            min="0"
            step="0.01"
            className="expense-input"
            disabled={loading}
          />
          <button 
            onClick={handleAddExpense} 
            className="add-button"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Expense'}
          </button>
        </div>

        {/* Transaction List */}
        <div className="transaction-list">
          <h2>History</h2>
          <div className="transactions-container">
            {transactions.length === 0 ? (
              <p className="no-transactions">No transactions yet. Add an expense to get started!</p>
            ) : (
              transactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className={`transaction-item ${transaction.type}`}
                >
                  <span className="transaction-name">{transaction.reason}</span>
                  <span className="transaction-amount">
                    {transaction.amount.toFixed(2)} USD
                  </span>
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
