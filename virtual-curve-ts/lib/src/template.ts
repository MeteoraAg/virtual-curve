import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import type { ConfigParameters, CreateConfigAccounts } from './types'
import { BN } from 'bn.js'

export const getPumpfunTemplate = (
  params: Partial<ConfigParameters>,
  accounts: Pick<
    CreateConfigAccounts,
    'config' | 'feeClaimer' | 'owner' | 'payer'
  >
): [
  ConfigParameters,
  Omit<CreateConfigAccounts, 'eventAuthority' | 'program' | 'systemProgram'>
] => {
  return [
    {
      creatorLockedLpPercentage: 10,
      creatorLpPercentage: 80,
      padding: [],
      partnerLockedLpPercentage: 10,
      partnerLpPercentage: 0,
      poolFees: {
        baseFee: {
          cliffFeeNumerator: new BN(2_500_000),
          numberOfPeriod: 0,
          periodFrequency: new BN(0),
          reductionFactor: new BN(0),
          feeSchedulerMode: 0, // FLAT (constant fee)
        },
        dynamicFee: null,
      },
      collectFeeMode: 0, // QuoteToken only (from both templates)
      migrationOption: 0, // MeteoraDAMM
      activationType: 0, // Slot (from both templates)
      tokenDecimal: 6,
      tokenType: 0, // SplToken
      migrationQuoteThreshold: new BN(LAMPORTS_PER_SOL * 500),

      // Simplified curve with just min and max points
      sqrtStartPrice: new BN('97539491880527374'), // Min valid sqrtPrice
      curve: [
        {
          sqrtPrice: new BN('79226673521066979257578248091'),
          liquidity: new BN('103301766812773489049600000000000'),
        }, // 10x more liquidity
      ],
      ...params,
    },
    {
      quoteMint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL (wrapped)
      ...accounts,
    },
  ]
}
