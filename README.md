# Virtual Curve

The Virtual Curve program is a launch pool protocol that allows any launch partners to enable their users to launch tokens with customizable virtual curves directly on their platforms. With direct integration into Jupiter and other trading platforms, traders can trade these launch tokens immediately across all these integrations. The Virtual Cuvre program provides a few benefits:

- Launch partners can have different configurations for their launch pools, for example, customizable quote token (SOL/USDC/etc), customizable curve for token graduation, customizable fees, etc.
- Users on these launch platforms can easily create tokens and launch pools directly with the partners' configurations directly on their partners' UI.
- Trading platforms/bots can immediately trade on these tokens with our direct integrations.
- Tokens will graduate directly into Meteora DAMM pools. With locked LP tokens, launchers can claim fees on the locked LPs.
- Full API supports for easy integration for launch partners and trading platforms/bots.

## Notable Features

- multiple quote tokens support: SOL, USDC, etc
- SPL Token and Token2022 support
- fee scheduler + dynamic-fee
- flexible fee collect mode (ex: collect fee only in quote token)
- customizable liquidity distribution (up to 20 price ranges with different liquidity curve)

## Customizable Fees

- Virtual pool will collect trading fee evey time user trade with that pool (buy or sell).
- A percentage of trading fee will be paid to the Virtual Curve protocol. A swap host (Jupiter/Photon/Trading bots) can submit the swap transaction with a referal account to get some referal fee as part of protocol fee. The rest of trading fee belongs to partner.
- After token has graduated and is migrated, LP is locked for partner and token creator. The ratio of the locked LP is based on what partner has configured in the configuration. With this, partner and token creator can claim fees based on the locked LP on Meteora DAMM.
- The last swap will create a surplus on quote token, that will be shared between the partner and the protocol.

## Customizable Pool Configuration

Partner can specify these parameters when they create a configuration on all their pools:

- `pool_fees`: include `base_fee` and `dynamic_fee` (optional). Partner can add fee scheduler in `base_fee` or just a fixed fee. `pool_fees` defines the trading fee for any pool that is created from this configuration.
- `collect_fee_mode` (`0 | 1`): `0` means the virtual pool will only collect fee in quote token, `1` means virtual pool will collect fee in both tokens.
- `migration_option`: right now we only support migration to Meteora DAMM, so partner must set the value as `0` for this field.
- `activation_type` (`0 | 1`): `0` means slot, `1` means timestamp, this field indicates the time unit that pool will work with, mostly in calculating fee scheduler and dynamic fee.
- `token_type` (`0 | 1`): `0` means SPL Token, `1` means Token2022.
- `token_decimal`: the token decimals that the token will use when user creates the virtual pool with this configuration, we only support token decimals from 6 to 9.
- `creator_post_migration_fee_percentage`: the percentage of locked LP that partner will share with the token creator after token is migrated.
- `migration_quote_threshold`: the threhold for quote token, that after virtual pool reserve get such quote token amount, the token will graduate from the launch pool and will be migrated.
- `fee_claimer`: the address of partner that can claim trading fees from the virtual pools as well as fees from the locked LPs.
- `owner`: owner of the configuration.
- `quote_mint`: the quote mint address that virtual pool will support.
- `sqrt_start_price`: square root of min price in the bonding curve for the virtual pools.
- `curve`: an array of square price and liquidity, that defines the liquidity distribution for the virtual pools.

## Bonding Curve

A simple constant product `x * y = virtual_base_reserve * virtual_curve_reserve` can be presented as `x * y = liquidity * liquidity`, while `liquidity = sqrt(virtual_base_reserve * virtual_curve_reserve)`. With a contraint on `migration_quote_threshold`, it can be presented as a function of `liquidity`, `min_price`, `max_price`. We denote `liquidity = l`, `min_price = pa`, `max_price = pb`. So we have:

`bonding_curve_constant_product = function(l, pa, pb)`

On our virtual curve protocol:

`bonding_curve = function([l_i, pa_i, pb_i])`

That means partner can configure a bonding curve with any liquidity distribution up on their strategy.

For example, if the pool has this configuration:

- `sqrt_start_price = 1`
- `curve = [sqrt_price = 2, liquidity = 100), (sqrt_price = 4, liquidity = 500)]`

Then the bonding curve will function of 2 price ranges: `(l = 100, pa = 1, pb = 2)` and `(l = 500, pa = 2, pb = 4)`.

## Development

### Dependencies

- anchor 0.31.0
- solana 2.1.0
- rust 1.79.0

### Build

Program

```
anchor build -p virtual_curve
```

### Test

```
pnpm install
pnpm test
```

## Program Address

- Mainnet-beta: virwvN4ee9tWmGoT37FdxZMmxH54m64sYzPpBvXA3ZV
- Devnet: virwvN4ee9tWmGoT37FdxZMmxH54m64sYzPpBvXA3ZV
