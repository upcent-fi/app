const express = require('express');
const cors = require('cors');
const BlockchainManager = require('./blockchain');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize blockchain manager
const blockchainManager = new BlockchainManager();

// Store expenses in memory (in a real app, you'd use a database)
let expenses = [];
let blockchainTransactions = [];

// API Routes
app.get('/api/expenses', (req, res) => {
  // Calculate total savings from all onramp transactions
  const totalSavings = expenses
    .filter(expense => expense.type === 'onramp')
    .reduce((sum, expense) => sum + expense.amount, 0);
    
  res.json({
    expenses: expenses,
    totalSavings: totalSavings
  });
});

app.get('/api/blockchain-status', async (req, res) => {
  try {
    const adminBalance = await blockchainManager.getBalance();
    const destinationBalance = await blockchainManager.getDestinationBalance();
    
    res.json({
      adminBalance: adminBalance,
      destinationBalance: destinationBalance,
      transactions: blockchainTransactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get blockchain status' });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { reason, amount } = req.body;
  
  if (!reason || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  const expenseAmount = parseFloat(amount);
  
  // Add the expense
  const expense = {
    id: Date.now(),
    reason: reason,
    amount: expenseAmount,
    type: 'expense',
    timestamp: new Date().toISOString()
  };
  
  expenses.unshift(expense);
  
  // Calculate onramp amount
  const onrampAmount = calculateOnrampAmount(expenseAmount);
  
  // Add onramp transaction if there's a saving
  if (onrampAmount > 0) {
    const onrampTransaction = {
      id: Date.now() + 1,
      reason: `Onramp saving from: ${reason}`,
      amount: onrampAmount,
      type: 'onramp',
      timestamp: new Date().toISOString()
    };
    expenses.unshift(onrampTransaction);
  }
  
  // If there's an onramp saving, send the exact onramp amount to blockchain
  if (onrampAmount > 0) {
    console.log(`💾 Onramp saving detected: $${onrampAmount} - Sending ${onrampAmount} USDC to blockchain...`);
    
    try {
      const blockchainResult = await blockchainManager.sendUSDC(onrampAmount);
      
      // Record the blockchain transaction
      const blockchainTx = {
        id: Date.now() + 1,
        expenseId: expense.id,
        expenseAmount: expenseAmount,
        onrampAmount: onrampAmount,
        usdcSent: onrampAmount,
        blockchainResult: blockchainResult,
        timestamp: new Date().toISOString()
      };
      
      blockchainTransactions.unshift(blockchainTx);
      
      if (blockchainResult.success) {
        console.log(`✅ Successfully sent 2 USDC to ${blockchainResult.hash}`);
      } else {
        console.log(`❌ Failed to send USDC: ${blockchainResult.error}`);
      }
      
    } catch (error) {
      console.error('Error in blockchain transaction:', error);
    }
  }
  
  res.json({
    success: true,
    expense: expense,
    onrampAmount: onrampAmount,
    blockchainTriggered: onrampAmount > 0
  });
});

// Calculate onramp amount (same logic as client)
function calculateOnrampAmount(expenseAmount) {
  const expense = parseFloat(expenseAmount);
  if (isNaN(expense) || expense <= 0) return 0;
  
  // Round up to the next multiple of 10, then subtract the expense
  const nextMultipleOf10 = Math.ceil(expense / 10) * 10;
  return nextMultipleOf10 - expense;
}

// Serve the main app HTML
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Expenses Manager</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: #f5f5f5;
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #333;
                font-size: 2.5rem;
                margin-bottom: 10px;
            }
            .expense-form {
                display: flex;
                gap: 10px;
                margin-bottom: 30px;
                align-items: center;
                flex-wrap: wrap;
            }
            .expense-input {
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                min-width: 120px;
            }
            .expense-input:focus {
                outline: none;
                border-color: #0070ba;
                box-shadow: 0 0 0 2px rgba(0, 112, 186, 0.2);
            }
            .add-button {
                padding: 12px 24px;
                background: #0070ba;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background 0.2s;
                white-space: nowrap;
            }
            .add-button:hover {
                background: #005ea6;
            }
            .transactions {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
            }
            .transaction {
                display: flex;
                justify-content: space-between;
                padding: 15px;
                margin-bottom: 10px;
                background: white;
                border-radius: 8px;
                border-left: 4px solid #dc3545;
            }
            .no-transactions {
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 40px 20px;
            }
            .blockchain-status {
                background: #e8f5e8;
                border-radius: 12px;
                padding: 20px;
                border: 1px solid #28a745;
            }
            .blockchain-status h3 {
                color: #28a745;
                margin-bottom: 15px;
            }
            .status-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #d4edda;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 Expenses Manager</h1>
                <p>Add expenses - Auto-sends 2 USDC to blockchain on onramp savings</p>
            </div>
            
            <div class="expense-form">
                <input type="text" id="reasonInput" placeholder="Reason for expense" class="expense-input">
                <input type="number" id="amountInput" placeholder="Amount (USD)" min="0" step="0.01" class="expense-input">
                <button onclick="addExpense()" class="add-button">Add Expense</button>
            </div>
            
            <div class="transactions">
                <h2>Your Expenses</h2>
                <div id="transactionsList">
                    <p class="no-transactions">No transactions yet. Add an expense to get started!</p>
                </div>
            </div>
            
            <div class="blockchain-status">
                <h3>🔗 Blockchain Status</h3>
                <div id="blockchainStatus">
                    <p>Loading blockchain status...</p>
                </div>
            </div>
        </div>
        
        <script>
            function addExpense() {
                const reason = document.getElementById('reasonInput').value.trim();
                const amount = parseFloat(document.getElementById('amountInput').value);
                
                if (!reason || isNaN(amount) || amount <= 0) {
                    alert('Please enter a valid reason and amount');
                    return;
                }
                
                fetch('/api/expenses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ reason, amount }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById('reasonInput').value = '';
                        document.getElementById('amountInput').value = '';
                        loadTransactions();
                        loadBlockchainStatus();
                        
                        if (data.blockchainTriggered) {
                            alert(\`Onramp saving detected: $\${data.onrampAmount}! \${data.onrampAmount} USDC sent to blockchain.\`);
                        }
                    }
                })
                .catch(error => {
                    console.error('Error adding expense:', error);
                    alert('Failed to add expense');
                });
            }
            
            function loadTransactions() {
                fetch('/api/expenses')
                    .then(response => response.json())
                    .then(data => {
                        if (data.expenses.length === 0) {
                            document.getElementById('transactionsList').innerHTML = 
                                '<p class="no-transactions">No transactions yet. Add an expense to get started!</p>';
                        } else {
                            const transactionsHtml = data.expenses.map(exp => 
                                \`<div class="transaction">
                                    <div>
                                        <strong>\${exp.reason}</strong><br>
                                        <small>\${new Date(exp.timestamp).toLocaleTimeString()}</small>
                                    </div>
                                    <div style="text-align: right;">
                                        <strong>\${exp.amount.toFixed(2)} USD</strong>
                                    </div>
                                </div>\`
                            ).join('');
                            document.getElementById('transactionsList').innerHTML = transactionsHtml;
                        }
                    })
                    .catch(error => {
                        console.error('Error loading transactions:', error);
                    });
            }
            
            function loadBlockchainStatus() {
                fetch('/api/blockchain-status')
                    .then(response => response.json())
                    .then(data => {
                        const statusHtml = \`
                            <div class="status-item">
                                <span>Admin Balance:</span>
                                <strong>\${data.adminBalance} USDC</strong>
                            </div>
                            <div class="status-item">
                                <span>Destination Balance:</span>
                                <strong>\${data.destinationBalance} USDC</strong>
                            </div>
                            <div class="status-item">
                                <span>Blockchain Transactions:</span>
                                <strong>\${data.transactions.length}</strong>
                            </div>
                        \`;
                        document.getElementById('blockchainStatus').innerHTML = statusHtml;
                    })
                    .catch(error => {
                        console.error('Error loading blockchain status:', error);
                        document.getElementById('blockchainStatus').innerHTML = '<p>Failed to load blockchain status</p>';
                    });
            }
            
            // Load data on page load
            loadTransactions();
            loadBlockchainStatus();
            
            // Auto-refresh every 5 seconds
            setInterval(() => {
                loadTransactions();
                loadBlockchainStatus();
            }, 5000);
        </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`🚀 Expenses Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api/expenses`);
  console.log(`🌐 Main app available at http://localhost:${PORT}`);
  console.log(`🔗 Blockchain integration enabled for Base Sepolia`);
});
