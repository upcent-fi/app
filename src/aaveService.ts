import { encodeFunctionData } from 'viem';

// Returns an array of txs: [approve, supply]
export function buildAaveSupplyTxs({
  usdcAddress,
  poolAddress,
  amount,
  onBehalfOf
}: {
  usdcAddress: string,
  poolAddress: string,
  amount: string,
  onBehalfOf: string
}) {
  // Approve tx
  const approveTx = {
    to: usdcAddress,
    data: buildApproveCalldata(poolAddress, amount),
    value: '0x0'
  };

  // Supply tx
  const supplyTx = {
    to: poolAddress,
    data: buildSupplyCalldata(usdcAddress, amount, onBehalfOf),
    value: '0x0'
  };

  return [approveTx, supplyTx];
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

// Aave Pool supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)
function buildSupplyCalldata(asset: string, amount: string, onBehalfOf: string): string {
  return encodeFunctionData({
    abi: [
      {
        type: 'function',
        name: 'supply',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'asset', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'onBehalfOf', type: 'address' },
          { name: 'referralCode', type: 'uint16' }
        ],
        outputs: []
      }
    ],
    functionName: 'supply',
    args: [asset as `0x${string}`, BigInt(amount), onBehalfOf as `0x${string}`, 0]
  });
}
