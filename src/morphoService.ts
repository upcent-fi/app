import { encodeFunctionData } from 'viem';

// Returns an array of txs: [approve, deposit]
export function buildMorphoDepositTxs({
  usdcAddress,
  bundlerAddress,
  amount,
  onBehalfOf
}: {
  usdcAddress: string,
  bundlerAddress: string,
  amount: string,
  onBehalfOf: string
}) {
  // Approve tx
  const approveTx = {
    to: usdcAddress,
    data: buildApproveCalldata(bundlerAddress, amount),
    value: '0x0'
  };

  // Deposit tx
  const depositTx = {
    to: bundlerAddress,
    data: buildDepositCalldata(usdcAddress, amount, onBehalfOf),
    value: '0x0'
  };

  return [approveTx, depositTx];
}

// ERC20 approve(address spender, uint256 amount)
function buildApproveCalldata(spender: string, amount: string): string {
  return encodeFunctionData({
    abi: [
      {
        type: 'function',
        name: 'approve',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'spender', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [
          { name: '', type: 'bool' }
        ]
      }
    ],
    functionName: 'approve',
    args: [spender as `0x${string}`, BigInt(amount)]
  });
}

// Morpho deposit(address token, uint256 amount, address onBehalfOf)
function buildDepositCalldata(token: string, amount: string, onBehalfOf: string): string {
  return encodeFunctionData({
    abi: [
      {
        type: 'function',
        name: 'deposit',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'onBehalfOf', type: 'address' }
        ],
        outputs: []
      }
    ],
    functionName: 'deposit',
    args: [token as `0x${string}`, BigInt(amount), onBehalfOf as `0x${string}`]
  });
}
