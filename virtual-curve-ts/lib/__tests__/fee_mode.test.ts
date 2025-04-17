import { test, expect } from 'bun:test'
import { getFeeMode } from '../src/quote'
import { TradeDirection } from '../src/types'

enum CollectFeeMode {
  QuoteToken = 0,
  OutputToken = 1,
}

test('fee mode output token base to quote', () => {
  const feeMode = getFeeMode(
    CollectFeeMode.OutputToken,
    TradeDirection.BaseToQuote,
    false
  )

  expect(feeMode.feesOnInput).toBe(false)
  expect(feeMode.feesOnBaseToken).toBe(false)
  expect(feeMode.hasReferral).toBe(false)
})

test('fee mode output token quote to base', () => {
  const feeMode = getFeeMode(
    CollectFeeMode.OutputToken,
    TradeDirection.QuoteToBase,
    true
  )

  expect(feeMode.feesOnInput).toBe(false)
  expect(feeMode.feesOnBaseToken).toBe(true)
  expect(feeMode.hasReferral).toBe(true)
})

test('fee mode quote token base to quote', () => {
  const feeMode = getFeeMode(
    CollectFeeMode.QuoteToken,
    TradeDirection.BaseToQuote,
    false
  )

  expect(feeMode.feesOnInput).toBe(false)
  expect(feeMode.feesOnBaseToken).toBe(false)
  expect(feeMode.hasReferral).toBe(false)
})

test('fee mode quote token quote to base', () => {
  const feeMode = getFeeMode(
    CollectFeeMode.QuoteToken,
    TradeDirection.QuoteToBase,
    true
  )

  expect(feeMode.feesOnInput).toBe(true)
  expect(feeMode.feesOnBaseToken).toBe(false)
  expect(feeMode.hasReferral).toBe(true)
})

test('invalid collect fee mode', () => {
  expect(() =>
    getFeeMode(
      2, // Invalid mode
      TradeDirection.QuoteToBase,
      false
    )
  ).toThrow('InvalidCollectFeeMode')
})

test('fee mode default values', () => {
  // Test default values by passing default collect fee mode
  const feeMode = getFeeMode(
    CollectFeeMode.QuoteToken,
    TradeDirection.BaseToQuote,
    false
  )

  expect(feeMode.feesOnInput).toBe(false)
  expect(feeMode.feesOnBaseToken).toBe(false)
  expect(feeMode.hasReferral).toBe(false)
})

test('fee mode properties', () => {
  // When trading BaseToQuote, fees should never be on input
  const feeMode1 = getFeeMode(
    CollectFeeMode.QuoteToken,
    TradeDirection.BaseToQuote,
    true
  )
  expect(feeMode1.feesOnInput).toBe(false)

  // When using QuoteToken mode, base_token should always be false
  const feeMode2 = getFeeMode(
    CollectFeeMode.QuoteToken,
    TradeDirection.QuoteToBase,
    false
  )
  expect(feeMode2.feesOnBaseToken).toBe(false)
})
