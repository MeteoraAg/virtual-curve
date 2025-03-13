# Virtual curve

Virtual curve program allows any partner can set up a robust bonding curve, then user can create new token and open a virtual pool that anyone can buy tokens based on that bonding curve. If the virtual pool can reach a price threshold, then tokens will be migrated to an open AMM pool. Here is flow:
- Partner will create a config key, that includes all configuration for their virtual curve
- User come to create token and create pool with partner config key 
- Trading bot (jup) then will swap with the pool 
- When pool reach a quote threshold, then no one can swap with that pool anymore
- Keeper then send a crank to create pool on Meteora dynamic-amm and lock lp tokens, user who create that pool can claim fee on that locked lp

## 1. Feature support

- support 2 quote tokens: SOL and USDC
- spl-token + token2022
- fee scheduler + dynamic-fee
- flexible fee collect mode (ex: collect fee only in SOL)
- customizable liquidity distribution (up to 20 price ranges with different liquidity)

## 2. Fee model

- Virtual pool will collect trading fee evey time user trade with that pool (buy or sell)
- A percentage of trading fee will be paid to virtual curve protocol. A swap host (jup/photon) can submit the swap transaction a referal account to get referal fee as part of protocol fee. The rest of trading fee belongs to partner.
- After token is migrated, LP is locked for partner and token creator. The ratio of locked LP is based on which partner has configured in config key. Then after that partner and creator can claim fee on locked LP on Meteora Dynamic Amm. 
- The last swap will create a surplus quote token, that will be shared between partner and virtual curve protocol 

## 3. Partner config key

Partner can specify those parameters when they create a config key:
- pool_fees: include `base_fee` and `dynamic_fee` (optional). partner can add fee scheduler in `base_fee` to or just fixed fee. pool_fees defines the trading fee for any pool that is created from that config key
- collect_fee_mode: `0 | 1` 0 means the virtual pool only collect fee in quote token, 1 means virtual pool will collect fee in both tokens. 
- migration_option: right now we only support migrate to dynamic-amm, so partner must send the value as 0 for this field
- activation_type: `0 | 1` 0 means slot, 1 means timestamp, that field indicate time unit that pool will work with, mostly in calculating fee scheduler and dynamic fee
- token_type: `0 | 1` 0 means spl-token, 1 means token2022
- token_decimal: the token decimals that the token will be created when user create virtual pool with that config, we only support token decimals from 6 to 9 now
- creator_post_migration_fee_percentage: the percentage of locked LP that partner will share with creator after token is migrated
- migration_quote_threshold: the threhold for quote token, that after virtual pool reserve get such quote token, the token will be migrated 
- fee_claimer: the address of partner that can claim trading of virtual pool as well as claim fee on locked LP.
- owner: owner of that config key 
- quote_mint: the quote mint address that virtual pool will support 
- sqrt_start_price: square root of min price in bonding curve
- curve: an array of square price and liquidity, that defines liquidity distribution in virtual pool

## 4. Bonding curve

A simple constant product `x * y = virtual_base_reserve * virtual_curve_reserve` can be presented as `x * y = liquidity * liquidity`, while `liquidity = sqrt(virtual_base_reserve * virtual_curve_reserve)`. With a contraints on `migration_quote_threshold`, it can be presented as a function of `liquidity`, `min_price`, `max_price`. We denote `liquidity = l`, `min_price = pa`, `max_price = pb`. So we have:

`bonding_curve_constant_product = function(l, pa, pb)`

On our virtual curve protocol:

`bonding_curve = function([l_i, pa_i, pb_i])`
                

That means partner can config a bonding curve with any liquidity distribution up on their strategy. 

Based on parameters in section 3, for example if user input a curve with parameters:
- `sqrt_start_price = 1`
- `curve = [sqrt_price = 2, liquidity = 100), (sqrt_price = 4, liquidity = 500)]`

Then the bonding curve will be function of 2 price ranges: `(l = 100, pa = 1, pb = 2)` and `(l = 500, pa = 2, pb = 4)`

## 5. Development

### Dependencies

- anchor 0.29.0
- solana 1.16.12
- rust 1.76.0

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

## 6. Deployments

- Mainnet-beta: virwvN4ee9tWmGoT37FdxZMmxH54m64sYzPpBvXA3ZV
- Devnet: virwvN4ee9tWmGoT37FdxZMmxH54m64sYzPpBvXA3ZV
