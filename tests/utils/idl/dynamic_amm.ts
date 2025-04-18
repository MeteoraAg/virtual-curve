/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/dynamic_amm.json`.
 */
export type DynamicAmm = {
  address: "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB";
  metadata: {
    name: "dynamicAmm";
    version: "0.5.2";
    spec: "0.1.0";
  };
  docs: ["Program for AMM"];
  instructions: [
    {
      name: "initializePermissionedPool";
      docs: ["Initialize a new permissioned pool."];
      discriminator: [77, 85, 178, 157, 50, 48, 212, 126];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (arbitrary address)"];
          writable: true;
          signer: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "tokenAMint";
          docs: ["Token A mint of the pool. Eg: USDT"];
        },
        {
          name: "tokenBMint";
          docs: ["Token B mint of the pool. Eg: USDC"];
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token A. Token A of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token B. Token B of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault A"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault B"];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "adminTokenA";
          docs: [
            "Admin token account for pool token A mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "adminTokenB";
          docs: [
            "Admin token account for pool token B mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "adminPoolLp";
          docs: [
            "Admin pool LP token account. Used to receive LP during first deposit (initialize pool)",
            "Admin pool LP token account. Used to receive LP during first deposit (initialize pool)"
          ];
          writable: true;
        },
        {
          name: "protocolTokenAFee";
          docs: [
            "Protocol fee token account for token A. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "protocolTokenBFee";
          docs: [
            "Protocol fee token account for token B. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "admin";
          docs: [
            "Admin account. This account will be the admin of the pool, and the payer for PDA during initialize pool."
          ];
          writable: true;
          signer: true;
        },
        {
          name: "feeOwner";
        },
        {
          name: "rent";
          docs: ["Rent account."];
        },
        {
          name: "mintMetadata";
          writable: true;
        },
        {
          name: "metadataProgram";
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. The pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        },
        {
          name: "associatedTokenProgram";
          docs: ["Associated token program."];
        },
        {
          name: "systemProgram";
          docs: ["System program."];
        }
      ];
      args: [
        {
          name: "curveType";
          type: {
            defined: {
              name: "curveType";
            };
          };
        }
      ];
    },
    {
      name: "initializePermissionlessPool";
      docs: ["Initialize a new permissionless pool."];
      discriminator: [118, 173, 41, 157, 173, 72, 97, 103];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA address)"];
          writable: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "tokenAMint";
          docs: ["Token A mint of the pool. Eg: USDT"];
        },
        {
          name: "tokenBMint";
          docs: ["Token B mint of the pool. Eg: USDC"];
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token A. Token A of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token B. Token B of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault A"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault B"];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "payerTokenA";
          docs: [
            "Payer token account for pool token A mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "payerTokenB";
          docs: [
            "Admin token account for pool token B mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "payerPoolLp";
          writable: true;
        },
        {
          name: "protocolTokenAFee";
          docs: [
            "Protocol fee token account for token A. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "protocolTokenBFee";
          docs: [
            "Protocol fee token account for token B. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "payer";
          docs: [
            "Admin account. This account will be the admin of the pool, and the payer for PDA during initialize pool."
          ];
          writable: true;
          signer: true;
        },
        {
          name: "feeOwner";
        },
        {
          name: "rent";
          docs: ["Rent account."];
        },
        {
          name: "mintMetadata";
          writable: true;
        },
        {
          name: "metadataProgram";
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. The pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        },
        {
          name: "associatedTokenProgram";
          docs: ["Associated token program."];
        },
        {
          name: "systemProgram";
          docs: ["System program."];
        }
      ];
      args: [
        {
          name: "curveType";
          type: {
            defined: {
              name: "curveType";
            };
          };
        },
        {
          name: "tokenAAmount";
          type: "u64";
        },
        {
          name: "tokenBAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "initializePermissionlessPoolWithFeeTier";
      docs: ["Initialize a new permissionless pool with customized fee tier"];
      discriminator: [6, 135, 68, 147, 229, 82, 169, 113];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA address)"];
          writable: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "tokenAMint";
          docs: ["Token A mint of the pool. Eg: USDT"];
        },
        {
          name: "tokenBMint";
          docs: ["Token B mint of the pool. Eg: USDC"];
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token A. Token A of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token B. Token B of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault A"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault B"];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "payerTokenA";
          docs: [
            "Payer token account for pool token A mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "payerTokenB";
          docs: [
            "Admin token account for pool token B mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "payerPoolLp";
          writable: true;
        },
        {
          name: "protocolTokenAFee";
          docs: [
            "Protocol fee token account for token A. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "protocolTokenBFee";
          docs: [
            "Protocol fee token account for token B. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "payer";
          docs: [
            "Admin account. This account will be the admin of the pool, and the payer for PDA during initialize pool."
          ];
          writable: true;
          signer: true;
        },
        {
          name: "feeOwner";
        },
        {
          name: "rent";
          docs: ["Rent account."];
        },
        {
          name: "mintMetadata";
          writable: true;
        },
        {
          name: "metadataProgram";
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. The pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        },
        {
          name: "associatedTokenProgram";
          docs: ["Associated token program."];
        },
        {
          name: "systemProgram";
          docs: ["System program."];
        }
      ];
      args: [
        {
          name: "curveType";
          type: {
            defined: {
              name: "curveType";
            };
          };
        },
        {
          name: "tradeFeeBps";
          type: "u64";
        },
        {
          name: "tokenAAmount";
          type: "u64";
        },
        {
          name: "tokenBAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "enableOrDisablePool";
      docs: [
        "Enable or disable a pool. A disabled pool allow only remove balanced liquidity operation."
      ];
      discriminator: [128, 6, 228, 131, 55, 161, 52, 169];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "admin";
          docs: ["Admin account. Must be owner of the pool."];
          signer: true;
        }
      ];
      args: [
        {
          name: "enable";
          type: "bool";
        }
      ];
    },
    {
      name: "swap";
      docs: [
        "Swap token A to B, or vice versa. An amount of trading fee will be charged for liquidity provider, and the admin of the pool."
      ];
      discriminator: [248, 198, 158, 145, 225, 117, 135, 200];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "userSourceToken";
          docs: [
            "User token account. Token from this account will be transfer into the vault by the pool in exchange for another token of the pool."
          ];
          writable: true;
        },
        {
          name: "userDestinationToken";
          docs: [
            "User token account. The exchanged token will be transfer into this account from the pool."
          ];
          writable: true;
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token a. token a of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token b. token b of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["Lp token mint of vault a"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["Lp token mint of vault b"];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "protocolTokenFee";
          docs: [
            "Protocol fee token account. Used to receive trading fee. It's mint field must matched with user_source_token mint field."
          ];
          writable: true;
        },
        {
          name: "user";
          docs: ["User account. Must be owner of user_source_token."];
          signer: true;
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. the pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        }
      ];
      args: [
        {
          name: "inAmount";
          type: "u64";
        },
        {
          name: "minimumOutAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "removeLiquiditySingleSide";
      docs: [
        "Withdraw only single token from the pool. Only supported by pool with stable swap curve."
      ];
      discriminator: [84, 84, 177, 66, 254, 185, 10, 251];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "userPoolLp";
          docs: [
            "User pool lp token account. LP will be burned from this account upon success liquidity removal."
          ];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token A. Token A of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token B. Token B of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault A"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault B"];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "userDestinationToken";
          docs: [
            "User token account to receive token upon success liquidity removal."
          ];
          writable: true;
        },
        {
          name: "user";
          docs: ["User account. Must be owner of the user_pool_lp account."];
          signer: true;
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. The pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        }
      ];
      args: [
        {
          name: "poolTokenAmount";
          type: "u64";
        },
        {
          name: "minimumOutAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "addImbalanceLiquidity";
      docs: [
        "Deposit tokens to the pool in an imbalance ratio. Only supported by pool with stable swap curve."
      ];
      discriminator: [79, 35, 122, 84, 173, 15, 93, 191];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "userPoolLp";
          docs: [
            "user pool lp token account. lp will be burned from this account upon success liquidity removal."
          ];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token a. token a of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token b. token b of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault a"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault b"];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "userAToken";
          docs: [
            "User token A account. Token will be transfer from this account if it is add liquidity operation. Else, token will be transfer into this account."
          ];
          writable: true;
        },
        {
          name: "userBToken";
          docs: [
            "User token B account. Token will be transfer from this account if it is add liquidity operation. Else, token will be transfer into this account."
          ];
          writable: true;
        },
        {
          name: "user";
          docs: [
            "User account. Must be owner of user_a_token, and user_b_token."
          ];
          signer: true;
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. the pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        }
      ];
      args: [
        {
          name: "minimumPoolTokenAmount";
          type: "u64";
        },
        {
          name: "tokenAAmount";
          type: "u64";
        },
        {
          name: "tokenBAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "removeBalanceLiquidity";
      docs: [
        "Withdraw tokens from the pool in a balanced ratio. User will still able to withdraw from pool even the pool is disabled. This allow user to exit their liquidity when there's some unforeseen event happen."
      ];
      discriminator: [133, 109, 44, 179, 56, 238, 114, 33];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "userPoolLp";
          docs: [
            "user pool lp token account. lp will be burned from this account upon success liquidity removal."
          ];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token a. token a of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token b. token b of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault a"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault b"];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "userAToken";
          docs: [
            "User token A account. Token will be transfer from this account if it is add liquidity operation. Else, token will be transfer into this account."
          ];
          writable: true;
        },
        {
          name: "userBToken";
          docs: [
            "User token B account. Token will be transfer from this account if it is add liquidity operation. Else, token will be transfer into this account."
          ];
          writable: true;
        },
        {
          name: "user";
          docs: [
            "User account. Must be owner of user_a_token, and user_b_token."
          ];
          signer: true;
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. the pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        }
      ];
      args: [
        {
          name: "poolTokenAmount";
          type: "u64";
        },
        {
          name: "minimumATokenOut";
          type: "u64";
        },
        {
          name: "minimumBTokenOut";
          type: "u64";
        }
      ];
    },
    {
      name: "addBalanceLiquidity";
      docs: ["Deposit tokens to the pool in a balanced ratio."];
      discriminator: [168, 227, 50, 62, 189, 171, 84, 176];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "userPoolLp";
          docs: [
            "user pool lp token account. lp will be burned from this account upon success liquidity removal."
          ];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token a. token a of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token b. token b of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault a"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault b"];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "userAToken";
          docs: [
            "User token A account. Token will be transfer from this account if it is add liquidity operation. Else, token will be transfer into this account."
          ];
          writable: true;
        },
        {
          name: "userBToken";
          docs: [
            "User token B account. Token will be transfer from this account if it is add liquidity operation. Else, token will be transfer into this account."
          ];
          writable: true;
        },
        {
          name: "user";
          docs: [
            "User account. Must be owner of user_a_token, and user_b_token."
          ];
          signer: true;
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. the pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        }
      ];
      args: [
        {
          name: "poolTokenAmount";
          type: "u64";
        },
        {
          name: "maximumTokenAAmount";
          type: "u64";
        },
        {
          name: "maximumTokenBAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "setPoolFees";
      docs: ["Update trading fee charged for liquidity provider, and admin."];
      discriminator: [102, 44, 158, 54, 205, 37, 126, 78];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "feeOperator";
          docs: ["Fee operator account"];
          signer: true;
        }
      ];
      args: [
        {
          name: "fees";
          type: {
            defined: {
              name: "poolFees";
            };
          };
        },
        {
          name: "newPartnerFeeNumerator";
          type: "u64";
        }
      ];
    },
    {
      name: "overrideCurveParam";
      docs: [
        "Update swap curve parameters. This function do not allow update of curve type. For example: stable swap curve to constant product curve. Only supported by pool with stable swap curve.",
        "Only amp is allowed to be override. The other attributes of stable swap curve will be ignored."
      ];
      discriminator: [98, 86, 204, 51, 94, 71, 69, 187];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "admin";
          docs: ["Admin account."];
          signer: true;
        }
      ];
      args: [
        {
          name: "curveType";
          type: {
            defined: {
              name: "curveType";
            };
          };
        }
      ];
    },
    {
      name: "getPoolInfo";
      docs: ["Get the general information of the pool."];
      discriminator: [9, 48, 220, 101, 22, 240, 78, 200];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token a. token a of the pool will be deposit / withdraw from this vault account."
          ];
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token b. token b of the pool will be deposit / withdraw from this vault account."
          ];
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault a"];
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault b"];
        }
      ];
      args: [];
    },
    {
      name: "bootstrapLiquidity";
      docs: ["Bootstrap the pool when liquidity is depleted."];
      discriminator: [4, 228, 215, 71, 225, 253, 119, 206];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "userPoolLp";
          docs: [
            "user pool lp token account. lp will be burned from this account upon success liquidity removal."
          ];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token a. token a of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token b. token b of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault a"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault b"];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "userAToken";
          docs: [
            "User token A account. Token will be transfer from this account if it is add liquidity operation. Else, token will be transfer into this account."
          ];
          writable: true;
        },
        {
          name: "userBToken";
          docs: [
            "User token B account. Token will be transfer from this account if it is add liquidity operation. Else, token will be transfer into this account."
          ];
          writable: true;
        },
        {
          name: "user";
          docs: [
            "User account. Must be owner of user_a_token, and user_b_token."
          ];
          signer: true;
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. the pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        }
      ];
      args: [
        {
          name: "tokenAAmount";
          type: "u64";
        },
        {
          name: "tokenBAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "createMintMetadata";
      docs: ["Create mint metadata account for old pools"];
      discriminator: [13, 70, 168, 41, 250, 100, 148, 90];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account"];
        },
        {
          name: "lpMint";
          docs: ["LP mint account of the pool"];
        },
        {
          name: "aVaultLp";
          docs: ["Vault A LP account of the pool"];
        },
        {
          name: "mintMetadata";
          writable: true;
        },
        {
          name: "metadataProgram";
        },
        {
          name: "systemProgram";
          docs: ["System program."];
        },
        {
          name: "payer";
          docs: ["Payer"];
          writable: true;
          signer: true;
        }
      ];
      args: [];
    },
    {
      name: "createLockEscrow";
      docs: ["Create lock account"];
      discriminator: [54, 87, 165, 19, 69, 227, 218, 224];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account"];
        },
        {
          name: "lockEscrow";
          docs: ["Lock account"];
          writable: true;
        },
        {
          name: "owner";
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
        },
        {
          name: "payer";
          docs: ["Payer account"];
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          docs: ["System program."];
        }
      ];
      args: [];
    },
    {
      name: "lock";
      docs: ["Lock Lp token"];
      discriminator: [21, 19, 208, 43, 237, 62, 255, 87];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account"];
          writable: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
        },
        {
          name: "lockEscrow";
          docs: ["Lock account"];
          writable: true;
        },
        {
          name: "owner";
          docs: ["Can be anyone"];
          writable: true;
          signer: true;
        },
        {
          name: "sourceTokens";
          docs: ["owner lp token account"];
          writable: true;
        },
        {
          name: "escrowVault";
          docs: ["Escrow vault"];
          writable: true;
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token a. token a of the pool will be deposit / withdraw from this vault account."
          ];
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token b. token b of the pool will be deposit / withdraw from this vault account."
          ];
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault a"];
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault b"];
        }
      ];
      args: [
        {
          name: "maxAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "claimFee";
      docs: ["Claim fee"];
      discriminator: [169, 32, 79, 137, 136, 232, 70, 137];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account"];
          writable: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "lockEscrow";
          docs: ["Lock account"];
          writable: true;
        },
        {
          name: "owner";
          docs: ["Owner of lock account"];
          writable: true;
          signer: true;
        },
        {
          name: "sourceTokens";
          docs: ["owner lp token account"];
          writable: true;
        },
        {
          name: "escrowVault";
          docs: ["Escrow vault"];
          writable: true;
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token a. token a of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token b. token b of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault a"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault b"];
          writable: true;
        },
        {
          name: "userAToken";
          docs: [
            "User token A account. Token will be transfer from this account if it is add liquidity operation. Else, token will be transfer into this account."
          ];
          writable: true;
        },
        {
          name: "userBToken";
          docs: [
            "User token B account. Token will be transfer from this account if it is add liquidity operation. Else, token will be transfer into this account."
          ];
          writable: true;
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. the pool will deposit/withdraw liquidity from the vault."
          ];
        }
      ];
      args: [
        {
          name: "maxAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "createConfig";
      docs: ["Create config"];
      discriminator: [201, 207, 243, 114, 75, 111, 47, 189];
      accounts: [
        {
          name: "config";
          writable: true;
        },
        {
          name: "admin";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "configParameters";
          type: {
            defined: {
              name: "configParameters";
            };
          };
        }
      ];
    },
    {
      name: "closeConfig";
      docs: ["Close config"];
      discriminator: [145, 9, 72, 157, 95, 125, 61, 85];
      accounts: [
        {
          name: "config";
          writable: true;
        },
        {
          name: "admin";
          writable: true;
          signer: true;
        },
        {
          name: "rentReceiver";
          writable: true;
        }
      ];
      args: [];
    },
    {
      name: "initializePermissionlessConstantProductPoolWithConfig";
      docs: ["Initialize permissionless pool with config"];
      discriminator: [7, 166, 138, 171, 206, 171, 236, 244];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA address)"];
          writable: true;
        },
        {
          name: "config";
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "tokenAMint";
          docs: ["Token A mint of the pool. Eg: USDT"];
        },
        {
          name: "tokenBMint";
          docs: ["Token B mint of the pool. Eg: USDC"];
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token A. Token A of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token B. Token B of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault A"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault B"];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "payerTokenA";
          docs: [
            "Payer token account for pool token A mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "payerTokenB";
          docs: [
            "Admin token account for pool token B mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "payerPoolLp";
          writable: true;
        },
        {
          name: "protocolTokenAFee";
          docs: [
            "Protocol fee token account for token A. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "protocolTokenBFee";
          docs: [
            "Protocol fee token account for token B. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "payer";
          docs: [
            "Admin account. This account will be the admin of the pool, and the payer for PDA during initialize pool."
          ];
          writable: true;
          signer: true;
        },
        {
          name: "rent";
          docs: ["Rent account."];
        },
        {
          name: "mintMetadata";
          writable: true;
        },
        {
          name: "metadataProgram";
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. The pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        },
        {
          name: "associatedTokenProgram";
          docs: ["Associated token program."];
        },
        {
          name: "systemProgram";
          docs: ["System program."];
        }
      ];
      args: [
        {
          name: "tokenAAmount";
          type: "u64";
        },
        {
          name: "tokenBAmount";
          type: "u64";
        }
      ];
    },
    {
      name: "initializePermissionlessConstantProductPoolWithConfig2";
      docs: ["Initialize permissionless pool with config 2"];
      discriminator: [48, 149, 220, 130, 61, 11, 9, 178];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA address)"];
          writable: true;
        },
        {
          name: "config";
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "tokenAMint";
          docs: ["Token A mint of the pool. Eg: USDT"];
        },
        {
          name: "tokenBMint";
          docs: ["Token B mint of the pool. Eg: USDC"];
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token A. Token A of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token B. Token B of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault A"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault B"];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "payerTokenA";
          docs: [
            "Payer token account for pool token A mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "payerTokenB";
          docs: [
            "Admin token account for pool token B mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "payerPoolLp";
          writable: true;
        },
        {
          name: "protocolTokenAFee";
          docs: [
            "Protocol fee token account for token A. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "protocolTokenBFee";
          docs: [
            "Protocol fee token account for token B. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "payer";
          docs: [
            "Admin account. This account will be the admin of the pool, and the payer for PDA during initialize pool."
          ];
          writable: true;
          signer: true;
        },
        {
          name: "rent";
          docs: ["Rent account."];
        },
        {
          name: "mintMetadata";
          writable: true;
        },
        {
          name: "metadataProgram";
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. The pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        },
        {
          name: "associatedTokenProgram";
          docs: ["Associated token program."];
        },
        {
          name: "systemProgram";
          docs: ["System program."];
        }
      ];
      args: [
        {
          name: "tokenAAmount";
          type: "u64";
        },
        {
          name: "tokenBAmount";
          type: "u64";
        },
        {
          name: "activationPoint";
          type: {
            option: "u64";
          };
        }
      ];
    },
    {
      name: "initializeCustomizablePermissionlessConstantProductPool";
      docs: ["Initialize permissionless pool with customizable params"];
      discriminator: [145, 24, 172, 194, 219, 125, 3, 190];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA address)"];
          writable: true;
        },
        {
          name: "lpMint";
          docs: ["LP token mint of the pool"];
          writable: true;
        },
        {
          name: "tokenAMint";
          docs: ["Token A mint of the pool. Eg: USDT"];
        },
        {
          name: "tokenBMint";
          docs: ["Token B mint of the pool. Eg: USDC"];
        },
        {
          name: "aVault";
          docs: [
            "Vault account for token A. Token A of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "bVault";
          docs: [
            "Vault account for token B. Token B of the pool will be deposit / withdraw from this vault account."
          ];
          writable: true;
        },
        {
          name: "aTokenVault";
          docs: ["Token vault account of vault A"];
          writable: true;
        },
        {
          name: "bTokenVault";
          docs: ["Token vault account of vault B"];
          writable: true;
        },
        {
          name: "aVaultLpMint";
          docs: ["LP token mint of vault A"];
          writable: true;
        },
        {
          name: "bVaultLpMint";
          docs: ["LP token mint of vault B"];
          writable: true;
        },
        {
          name: "aVaultLp";
          docs: [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "bVaultLp";
          docs: [
            "LP token account of vault B. Used to receive/burn vault LP upon deposit/withdraw from the vault."
          ];
          writable: true;
        },
        {
          name: "payerTokenA";
          docs: [
            "Payer token account for pool token A mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "payerTokenB";
          docs: [
            "Admin token account for pool token B mint. Used to bootstrap the pool with initial liquidity."
          ];
          writable: true;
        },
        {
          name: "payerPoolLp";
          writable: true;
        },
        {
          name: "protocolTokenAFee";
          docs: [
            "Protocol fee token account for token A. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "protocolTokenBFee";
          docs: [
            "Protocol fee token account for token B. Used to receive trading fee."
          ];
          writable: true;
        },
        {
          name: "payer";
          docs: [
            "Admin account. This account will be the admin of the pool, and the payer for PDA during initialize pool."
          ];
          writable: true;
          signer: true;
        },
        {
          name: "rent";
          docs: ["Rent account."];
        },
        {
          name: "mintMetadata";
          writable: true;
        },
        {
          name: "metadataProgram";
        },
        {
          name: "vaultProgram";
          docs: [
            "Vault program. The pool will deposit/withdraw liquidity from the vault."
          ];
        },
        {
          name: "tokenProgram";
          docs: ["Token program."];
        },
        {
          name: "associatedTokenProgram";
          docs: ["Associated token program."];
        },
        {
          name: "systemProgram";
          docs: ["System program."];
        }
      ];
      args: [
        {
          name: "tokenAAmount";
          type: "u64";
        },
        {
          name: "tokenBAmount";
          type: "u64";
        },
        {
          name: "params";
          type: {
            defined: {
              name: "customizableParams";
            };
          };
        }
      ];
    },
    {
      name: "updateActivationPoint";
      docs: ["Update activation slot"];
      discriminator: [150, 62, 125, 219, 171, 220, 26, 237];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "admin";
          docs: ["Admin account."];
          signer: true;
        }
      ];
      args: [
        {
          name: "newActivationPoint";
          type: "u64";
        }
      ];
    },
    {
      name: "withdrawProtocolFees";
      docs: ["Withdraw protocol fee"];
      discriminator: [11, 68, 165, 98, 18, 208, 134, 73];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
        },
        {
          name: "aVaultLp";
        },
        {
          name: "protocolTokenAFee";
          writable: true;
        },
        {
          name: "protocolTokenBFee";
          writable: true;
        },
        {
          name: "treasuryTokenA";
          writable: true;
        },
        {
          name: "treasuryTokenB";
          writable: true;
        },
        {
          name: "tokenProgram";
        }
      ];
      args: [];
    },
    {
      name: "setWhitelistedVault";
      docs: ["Set whitelisted vault"];
      discriminator: [12, 148, 94, 42, 55, 57, 83, 247];
      accounts: [
        {
          name: "pool";
          writable: true;
        },
        {
          name: "admin";
          signer: true;
        }
      ];
      args: [
        {
          name: "whitelistedVault";
          type: "pubkey";
        }
      ];
    },
    {
      name: "partnerClaimFee";
      docs: ["Partner claim fee"];
      discriminator: [57, 53, 176, 30, 123, 70, 52, 64];
      accounts: [
        {
          name: "pool";
          docs: ["Pool account (PDA)"];
          writable: true;
        },
        {
          name: "aVaultLp";
        },
        {
          name: "protocolTokenAFee";
          writable: true;
        },
        {
          name: "protocolTokenBFee";
          writable: true;
        },
        {
          name: "partnerTokenA";
          writable: true;
        },
        {
          name: "partnerTokenB";
          writable: true;
        },
        {
          name: "tokenProgram";
        },
        {
          name: "partnerAuthority";
          signer: true;
        }
      ];
      args: [
        {
          name: "maxAmountA";
          type: "u64";
        },
        {
          name: "maxAmountB";
          type: "u64";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "config";
      discriminator: [155, 12, 170, 224, 30, 250, 204, 130];
    },
    {
      name: "lockEscrow";
      discriminator: [190, 106, 121, 6, 200, 182, 21, 75];
    },
    {
      name: "pool";
      discriminator: [241, 154, 109, 4, 17, 177, 109, 188];
    }
  ];
  events: [
    {
      name: "addLiquidity";
      discriminator: [31, 94, 125, 90, 227, 52, 61, 186];
    },
    {
      name: "removeLiquidity";
      discriminator: [116, 244, 97, 232, 103, 31, 152, 58];
    },
    {
      name: "bootstrapLiquidity";
      discriminator: [121, 127, 38, 136, 92, 55, 14, 247];
    },
    {
      name: "swap";
      discriminator: [81, 108, 227, 190, 205, 208, 10, 196];
    },
    {
      name: "setPoolFees";
      discriminator: [245, 26, 198, 164, 88, 18, 75, 9];
    },
    {
      name: "poolInfo";
      discriminator: [207, 20, 87, 97, 251, 212, 234, 45];
    },
    {
      name: "transferAdmin";
      discriminator: [228, 169, 131, 244, 61, 56, 65, 254];
    },
    {
      name: "overrideCurveParam";
      discriminator: [247, 20, 165, 248, 75, 5, 54, 246];
    },
    {
      name: "poolCreated";
      discriminator: [202, 44, 41, 88, 104, 220, 157, 82];
    },
    {
      name: "poolEnabled";
      discriminator: [2, 151, 18, 83, 204, 134, 92, 191];
    },
    {
      name: "migrateFeeAccount";
      discriminator: [223, 234, 232, 26, 252, 105, 180, 125];
    },
    {
      name: "createLockEscrow";
      discriminator: [74, 94, 106, 141, 49, 17, 98, 109];
    },
    {
      name: "lock";
      discriminator: [220, 183, 67, 215, 153, 207, 56, 234];
    },
    {
      name: "claimFee";
      discriminator: [75, 122, 154, 48, 140, 74, 123, 163];
    },
    {
      name: "createConfig";
      discriminator: [199, 152, 10, 19, 39, 39, 157, 104];
    },
    {
      name: "closeConfig";
      discriminator: [249, 181, 108, 89, 4, 150, 90, 174];
    },
    {
      name: "withdrawProtocolFees";
      discriminator: [30, 240, 207, 196, 139, 239, 79, 28];
    },
    {
      name: "partnerClaimFees";
      discriminator: [135, 131, 10, 94, 119, 209, 202, 48];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "mathOverflow";
      msg: "Math operation overflow";
    },
    {
      code: 6001;
      name: "invalidFee";
      msg: "Invalid fee setup";
    },
    {
      code: 6002;
      name: "invalidInvariant";
      msg: "Invalid invariant d";
    },
    {
      code: 6003;
      name: "feeCalculationFailure";
      msg: "Fee calculation failure";
    },
    {
      code: 6004;
      name: "exceededSlippage";
      msg: "Exceeded slippage tolerance";
    },
    {
      code: 6005;
      name: "invalidCalculation";
      msg: "Invalid curve calculation";
    },
    {
      code: 6006;
      name: "zeroTradingTokens";
      msg: "Given pool token amount results in zero trading tokens";
    },
    {
      code: 6007;
      name: "conversionError";
      msg: "Math conversion overflow";
    },
    {
      code: 6008;
      name: "faultyLpMint";
      msg: "LP mint authority must be 'A' vault lp, without freeze authority, and 0 supply";
    },
    {
      code: 6009;
      name: "mismatchedTokenMint";
      msg: "Token mint mismatched";
    },
    {
      code: 6010;
      name: "mismatchedLpMint";
      msg: "LP mint mismatched";
    },
    {
      code: 6011;
      name: "mismatchedOwner";
      msg: "Invalid lp token owner";
    },
    {
      code: 6012;
      name: "invalidVaultAccount";
      msg: "Invalid vault account";
    },
    {
      code: 6013;
      name: "invalidVaultLpAccount";
      msg: "Invalid vault lp account";
    },
    {
      code: 6014;
      name: "invalidPoolLpMintAccount";
      msg: "Invalid pool lp mint account";
    },
    {
      code: 6015;
      name: "poolDisabled";
      msg: "Pool disabled";
    },
    {
      code: 6016;
      name: "invalidAdminAccount";
      msg: "Invalid admin account";
    },
    {
      code: 6017;
      name: "invalidProtocolFeeAccount";
      msg: "Invalid protocol fee account";
    },
    {
      code: 6018;
      name: "sameAdminAccount";
      msg: "Same admin account";
    },
    {
      code: 6019;
      name: "identicalSourceDestination";
      msg: "Identical user source and destination token account";
    },
    {
      code: 6020;
      name: "apyCalculationError";
      msg: "Apy calculation error";
    },
    {
      code: 6021;
      name: "insufficientSnapshot";
      msg: "Insufficient virtual price snapshot";
    },
    {
      code: 6022;
      name: "nonUpdatableCurve";
      msg: "Current curve is non-updatable";
    },
    {
      code: 6023;
      name: "misMatchedCurve";
      msg: "New curve is mismatched with old curve";
    },
    {
      code: 6024;
      name: "invalidAmplification";
      msg: "Amplification is invalid";
    },
    {
      code: 6025;
      name: "unsupportedOperation";
      msg: "Operation is not supported";
    },
    {
      code: 6026;
      name: "exceedMaxAChanges";
      msg: "Exceed max amplification changes";
    },
    {
      code: 6027;
      name: "invalidRemainingAccountsLen";
      msg: "Invalid remaining accounts length";
    },
    {
      code: 6028;
      name: "invalidRemainingAccounts";
      msg: "Invalid remaining account";
    },
    {
      code: 6029;
      name: "mismatchedDepegMint";
      msg: "Token mint B doesn't matches depeg type token mint";
    },
    {
      code: 6030;
      name: "invalidApyAccount";
      msg: "Invalid APY account";
    },
    {
      code: 6031;
      name: "invalidTokenMultiplier";
      msg: "Invalid token multiplier";
    },
    {
      code: 6032;
      name: "invalidDepegInformation";
      msg: "Invalid depeg information";
    },
    {
      code: 6033;
      name: "updateTimeConstraint";
      msg: "Update time constraint violated";
    },
    {
      code: 6034;
      name: "exceedMaxFeeBps";
      msg: "Exceeded max fee bps";
    },
    {
      code: 6035;
      name: "invalidAdmin";
      msg: "Invalid admin";
    },
    {
      code: 6036;
      name: "poolIsNotPermissioned";
      msg: "Pool is not permissioned";
    },
    {
      code: 6037;
      name: "invalidDepositAmount";
      msg: "Invalid deposit amount";
    },
    {
      code: 6038;
      name: "invalidFeeOwner";
      msg: "Invalid fee owner";
    },
    {
      code: 6039;
      name: "nonDepletedPool";
      msg: "Pool is not depleted";
    },
    {
      code: 6040;
      name: "amountNotPeg";
      msg: "Token amount is not 1:1";
    },
    {
      code: 6041;
      name: "amountIsZero";
      msg: "Amount is zero";
    },
    {
      code: 6042;
      name: "typeCastFailed";
      msg: "Type cast error";
    },
    {
      code: 6043;
      name: "amountIsNotEnough";
      msg: "Amount is not enough";
    },
    {
      code: 6044;
      name: "invalidActivationDuration";
      msg: "Invalid activation duration";
    },
    {
      code: 6045;
      name: "poolIsNotLaunchPool";
      msg: "Pool is not launch pool";
    },
    {
      code: 6046;
      name: "unableToModifyActivationPoint";
      msg: "Unable to modify activation point";
    },
    {
      code: 6047;
      name: "invalidAuthorityToCreateThePool";
      msg: "Invalid authority to create the pool";
    },
    {
      code: 6048;
      name: "invalidActivationType";
      msg: "Invalid activation type";
    },
    {
      code: 6049;
      name: "invalidActivationPoint";
      msg: "Invalid activation point";
    },
    {
      code: 6050;
      name: "preActivationSwapStarted";
      msg: "Pre activation swap window started";
    },
    {
      code: 6051;
      name: "invalidPoolType";
      msg: "Invalid pool type";
    },
    {
      code: 6052;
      name: "invalidQuoteMint";
      msg: "Quote token must be SOL,USDC";
    }
  ];
  types: [
    {
      name: "tokenMultiplier";
      docs: [
        "Multiplier for the pool token. Used to normalized token with different decimal into the same precision."
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "tokenAMultiplier";
            docs: ["Multiplier for token A of the pool."];
            type: "u64";
          },
          {
            name: "tokenBMultiplier";
            docs: ["Multiplier for token B of the pool."];
            type: "u64";
          },
          {
            name: "precisionFactor";
            docs: [
              "Record the highest token decimal in the pool. For example, Token A is 6 decimal, token B is 9 decimal. This will save value of 9."
            ];
            type: "u8";
          }
        ];
      };
    },
    {
      name: "poolFees";
      docs: ["Information regarding fee charges"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "tradeFeeNumerator";
            docs: [
              "Trade fees are extra token amounts that are held inside the token",
              "accounts during a trade, making the value of liquidity tokens rise.",
              "Trade fee numerator"
            ];
            type: "u64";
          },
          {
            name: "tradeFeeDenominator";
            docs: ["Trade fee denominator"];
            type: "u64";
          },
          {
            name: "protocolTradeFeeNumerator";
            docs: [
              "Protocol trading fees are extra token amounts that are held inside the token",
              "accounts during a trade, with the equivalent in pool tokens minted to",
              "the protocol of the program.",
              "Protocol trade fee numerator"
            ];
            type: "u64";
          },
          {
            name: "protocolTradeFeeDenominator";
            docs: ["Protocol trade fee denominator"];
            type: "u64";
          }
        ];
      };
    },
    {
      name: "depeg";
      docs: ["Contains information for depeg pool"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "baseVirtualPrice";
            docs: ["The virtual price of staking / interest bearing token"];
            type: "u64";
          },
          {
            name: "baseCacheUpdated";
            docs: ["The last time base_virtual_price is updated"];
            type: "u64";
          },
          {
            name: "depegType";
            docs: ["Type of the depeg pool"];
            type: {
              defined: {
                name: "depegType";
              };
            };
          }
        ];
      };
    },
    {
      name: "configParameters";
      type: {
        kind: "struct";
        fields: [
          {
            name: "tradeFeeNumerator";
            type: "u64";
          },
          {
            name: "protocolTradeFeeNumerator";
            type: "u64";
          },
          {
            name: "activationDuration";
            type: "u64";
          },
          {
            name: "vaultConfigKey";
            type: "pubkey";
          },
          {
            name: "poolCreatorAuthority";
            type: "pubkey";
          },
          {
            name: "activationType";
            type: "u8";
          },
          {
            name: "index";
            type: "u64";
          },
          {
            name: "partnerFeeNumerator";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "customizableParams";
      type: {
        kind: "struct";
        fields: [
          {
            name: "tradeFeeNumerator";
            docs: ["Trading fee."];
            type: "u32";
          },
          {
            name: "activationPoint";
            docs: ["The pool start trading."];
            type: {
              option: "u64";
            };
          },
          {
            name: "hasAlphaVault";
            docs: ["Whether the pool support alpha vault"];
            type: "bool";
          },
          {
            name: "activationType";
            docs: ["Activation type"];
            type: "u8";
          },
          {
            name: "padding";
            docs: ["padding"];
            type: {
              array: ["u8", 90];
            };
          }
        ];
      };
    },
    {
      name: "padding";
      docs: ["Padding for future pool fields"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "padding0";
            docs: ["Padding 0"];
            type: {
              array: ["u8", 6];
            };
          },
          {
            name: "padding1";
            docs: ["Padding 1"];
            type: {
              array: ["u64", 21];
            };
          },
          {
            name: "padding2";
            docs: ["Padding 2"];
            type: {
              array: ["u64", 21];
            };
          }
        ];
      };
    },
    {
      name: "partnerInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "feeNumerator";
            type: "u64";
          },
          {
            name: "partnerAuthority";
            type: "pubkey";
          },
          {
            name: "pendingFeeA";
            type: "u64";
          },
          {
            name: "pendingFeeB";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "bootstrapping";
      type: {
        kind: "struct";
        fields: [
          {
            name: "activationPoint";
            docs: ["Activation point, can be slot or timestamp"];
            type: "u64";
          },
          {
            name: "whitelistedVault";
            docs: [
              "Whitelisted vault to be able to buy pool before activation_point"
            ];
            type: "pubkey";
          },
          {
            name: "poolCreator";
            docs: [
              "Need to store pool creator in lauch pool, so they can modify liquidity before activation_point"
            ];
            type: "pubkey";
          },
          {
            name: "activationType";
            docs: ["Activation type, 0 means by slot, 1 means by timestamp"];
            type: "u8";
          }
        ];
      };
    },
    {
      name: "activationType";
      docs: ["Type of the activation"];
      type: {
        kind: "enum";
        variants: [
          {
            name: "slot";
          },
          {
            name: "timestamp";
          }
        ];
      };
    },
    {
      name: "roundDirection";
      docs: ["Rounding direction"];
      type: {
        kind: "enum";
        variants: [
          {
            name: "floor";
          },
          {
            name: "ceiling";
          }
        ];
      };
    },
    {
      name: "tradeDirection";
      docs: ["Trade (swap) direction"];
      type: {
        kind: "enum";
        variants: [
          {
            name: "atoB";
          },
          {
            name: "btoA";
          }
        ];
      };
    },
    {
      name: "newCurveType";
      docs: ["Type of the swap curve"];
      type: {
        kind: "enum";
        variants: [
          {
            name: "constantProduct";
          },
          {
            name: "stable";
            fields: [
              {
                name: "amp";
                docs: ["Amplification coefficient"];
                type: "u64";
              },
              {
                name: "tokenMultiplier";
                docs: [
                  "Multiplier for the pool token. Used to normalized token with different decimal into the same precision."
                ];
                type: {
                  defined: {
                    name: "tokenMultiplier";
                  };
                };
              },
              {
                name: "depeg";
                docs: [
                  "Depeg pool information. Contains functions to allow token amount to be repeg using stake / interest bearing token virtual price"
                ];
                type: {
                  defined: {
                    name: "depeg";
                  };
                };
              },
              {
                name: "lastAmpUpdatedTimestamp";
                docs: [
                  "The last amp updated timestamp. Used to prevent update_curve_info called infinitely many times within a short period"
                ];
                type: "u64";
              }
            ];
          },
          {
            name: "newCurve";
            fields: [
              {
                name: "fieldOne";
                type: "u64";
              },
              {
                name: "fieldTwo";
                type: "u64";
              }
            ];
          }
        ];
      };
    },
    {
      name: "curveType";
      docs: ["Type of the swap curve"];
      type: {
        kind: "enum";
        variants: [
          {
            name: "constantProduct";
          },
          {
            name: "stable";
            fields: [
              {
                name: "amp";
                docs: ["Amplification coefficient"];
                type: "u64";
              },
              {
                name: "tokenMultiplier";
                docs: [
                  "Multiplier for the pool token. Used to normalized token with different decimal into the same precision."
                ];
                type: {
                  defined: {
                    name: "tokenMultiplier";
                  };
                };
              },
              {
                name: "depeg";
                docs: [
                  "Depeg pool information. Contains functions to allow token amount to be repeg using stake / interest bearing token virtual price"
                ];
                type: {
                  defined: {
                    name: "depeg";
                  };
                };
              },
              {
                name: "lastAmpUpdatedTimestamp";
                docs: [
                  "The last amp updated timestamp. Used to prevent update_curve_info called infinitely many times within a short period"
                ];
                type: "u64";
              }
            ];
          }
        ];
      };
    },
    {
      name: "depegType";
      docs: ["Type of depeg pool"];
      type: {
        kind: "enum";
        variants: [
          {
            name: "none";
          },
          {
            name: "marinade";
          },
          {
            name: "lido";
          },
          {
            name: "splStake";
          }
        ];
      };
    },
    {
      name: "rounding";
      docs: ["Round up, down"];
      type: {
        kind: "enum";
        variants: [
          {
            name: "up";
          },
          {
            name: "down";
          }
        ];
      };
    },
    {
      name: "poolType";
      docs: ["Pool type"];
      type: {
        kind: "enum";
        variants: [
          {
            name: "permissioned";
          },
          {
            name: "permissionless";
          }
        ];
      };
    },
    {
      name: "config";
      type: {
        kind: "struct";
        fields: [
          {
            name: "poolFees";
            type: {
              defined: {
                name: "poolFees";
              };
            };
          },
          {
            name: "activationDuration";
            type: "u64";
          },
          {
            name: "vaultConfigKey";
            type: "pubkey";
          },
          {
            name: "poolCreatorAuthority";
            docs: [
              "Only pool_creator_authority can use the current config to initialize new pool. When it's Pubkey::default, it's a public config."
            ];
            type: "pubkey";
          },
          {
            name: "activationType";
            docs: ["Activation type"];
            type: "u8";
          },
          {
            name: "partnerFeeNumerator";
            type: "u64";
          },
          {
            name: "padding";
            type: {
              array: ["u8", 219];
            };
          }
        ];
      };
    },
    {
      name: "lockEscrow";
      docs: ["State of lock escrow account"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            docs: ["Pool address"];
            type: "pubkey";
          },
          {
            name: "owner";
            docs: ["Owner address"];
            type: "pubkey";
          },
          {
            name: "escrowVault";
            docs: ["Vault address, store the lock user lock"];
            type: "pubkey";
          },
          {
            name: "bump";
            docs: ["bump, used to sign"];
            type: "u8";
          },
          {
            name: "totalLockedAmount";
            docs: ["Total locked amount"];
            type: "u64";
          },
          {
            name: "lpPerToken";
            docs: ["Lp per token, virtual price of lp token"];
            type: "u128";
          },
          {
            name: "unclaimedFeePending";
            docs: ["Unclaimed fee pending"];
            type: "u64";
          },
          {
            name: "aFee";
            docs: ["Total a fee claimed so far"];
            type: "u64";
          },
          {
            name: "bFee";
            docs: ["Total b fee claimed so far"];
            type: "u64";
          }
        ];
      };
    },
    {
      name: "pool";
      docs: ["State of pool account"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "lpMint";
            docs: ["LP token mint of the pool"];
            type: "pubkey";
          },
          {
            name: "tokenAMint";
            docs: ["Token A mint of the pool. Eg: USDT"];
            type: "pubkey";
          },
          {
            name: "tokenBMint";
            docs: ["Token B mint of the pool. Eg: USDC"];
            type: "pubkey";
          },
          {
            name: "aVault";
            docs: [
              "Vault account for token A. Token A of the pool will be deposit / withdraw from this vault account."
            ];
            type: "pubkey";
          },
          {
            name: "bVault";
            docs: [
              "Vault account for token B. Token B of the pool will be deposit / withdraw from this vault account."
            ];
            type: "pubkey";
          },
          {
            name: "aVaultLp";
            docs: [
              "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
            ];
            type: "pubkey";
          },
          {
            name: "bVaultLp";
            docs: [
              "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
            ];
            type: "pubkey";
          },
          {
            name: "aVaultLpBump";
            docs: ['"A" vault lp bump. Used to create signer seeds.'];
            type: "u8";
          },
          {
            name: "enabled";
            docs: [
              "Flag to determine whether the pool is enabled, or disabled."
            ];
            type: "bool";
          },
          {
            name: "protocolTokenAFee";
            docs: [
              "Protocol fee token account for token A. Used to receive trading fee."
            ];
            type: "pubkey";
          },
          {
            name: "protocolTokenBFee";
            docs: [
              "Protocol fee token account for token B. Used to receive trading fee."
            ];
            type: "pubkey";
          },
          {
            name: "feeLastUpdatedAt";
            docs: ["Fee last updated timestamp"];
            type: "u64";
          },
          {
            name: "padding0";
            type: {
              array: ["u8", 24];
            };
          },
          {
            name: "fees";
            docs: ["Store the fee charges setting."];
            type: {
              defined: {
                name: "poolFees";
              };
            };
          },
          {
            name: "poolType";
            docs: ["Pool type"];
            type: {
              defined: {
                name: "poolType";
              };
            };
          },
          {
            name: "stake";
            docs: ["Stake pubkey of SPL stake pool"];
            type: "pubkey";
          },
          {
            name: "totalLockedLp";
            docs: ["Total locked lp token"];
            type: "u64";
          },
          {
            name: "bootstrapping";
            docs: ["bootstrapping config"];
            type: {
              defined: {
                name: "bootstrapping";
              };
            };
          },
          {
            name: "partnerInfo";
            type: {
              defined: {
                name: "partnerInfo";
              };
            };
          },
          {
            name: "padding";
            docs: ["Padding for future pool field"];
            type: {
              defined: {
                name: "padding";
              };
            };
          },
          {
            name: "curveType";
            docs: ["The type of the swap curve supported by the pool."];
            type: {
              defined: {
                name: "curveType";
              };
            };
          }
        ];
      };
    },
    {
      name: "addLiquidity";
      type: {
        kind: "struct";
        fields: [
          {
            name: "lpMintAmount";
            type: "u64";
          },
          {
            name: "tokenAAmount";
            type: "u64";
          },
          {
            name: "tokenBAmount";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "removeLiquidity";
      type: {
        kind: "struct";
        fields: [
          {
            name: "lpUnmintAmount";
            type: "u64";
          },
          {
            name: "tokenAOutAmount";
            type: "u64";
          },
          {
            name: "tokenBOutAmount";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "bootstrapLiquidity";
      type: {
        kind: "struct";
        fields: [
          {
            name: "lpMintAmount";
            type: "u64";
          },
          {
            name: "tokenAAmount";
            type: "u64";
          },
          {
            name: "tokenBAmount";
            type: "u64";
          },
          {
            name: "pool";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "swap";
      type: {
        kind: "struct";
        fields: [
          {
            name: "inAmount";
            type: "u64";
          },
          {
            name: "outAmount";
            type: "u64";
          },
          {
            name: "tradeFee";
            type: "u64";
          },
          {
            name: "protocolFee";
            type: "u64";
          },
          {
            name: "hostFee";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "setPoolFees";
      type: {
        kind: "struct";
        fields: [
          {
            name: "tradeFeeNumerator";
            type: "u64";
          },
          {
            name: "tradeFeeDenominator";
            type: "u64";
          },
          {
            name: "protocolTradeFeeNumerator";
            type: "u64";
          },
          {
            name: "protocolTradeFeeDenominator";
            type: "u64";
          },
          {
            name: "pool";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "poolInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "tokenAAmount";
            type: "u64";
          },
          {
            name: "tokenBAmount";
            type: "u64";
          },
          {
            name: "virtualPrice";
            type: "f64";
          },
          {
            name: "currentTimestamp";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "transferAdmin";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            type: "pubkey";
          },
          {
            name: "newAdmin";
            type: "pubkey";
          },
          {
            name: "pool";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "overrideCurveParam";
      type: {
        kind: "struct";
        fields: [
          {
            name: "newAmp";
            type: "u64";
          },
          {
            name: "updatedTimestamp";
            type: "u64";
          },
          {
            name: "pool";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "poolCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "lpMint";
            type: "pubkey";
          },
          {
            name: "tokenAMint";
            type: "pubkey";
          },
          {
            name: "tokenBMint";
            type: "pubkey";
          },
          {
            name: "poolType";
            type: {
              defined: {
                name: "poolType";
              };
            };
          },
          {
            name: "pool";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "poolEnabled";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            type: "pubkey";
          },
          {
            name: "enabled";
            type: "bool";
          }
        ];
      };
    },
    {
      name: "migrateFeeAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            type: "pubkey";
          },
          {
            name: "newAdminTokenAFee";
            type: "pubkey";
          },
          {
            name: "newAdminTokenBFee";
            type: "pubkey";
          },
          {
            name: "tokenAAmount";
            type: "u64";
          },
          {
            name: "tokenBAmount";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "createLockEscrow";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            type: "pubkey";
          },
          {
            name: "owner";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "lock";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            type: "pubkey";
          },
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "claimFee";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            type: "pubkey";
          },
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "aFee";
            type: "u64";
          },
          {
            name: "bFee";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "createConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "tradeFeeNumerator";
            type: "u64";
          },
          {
            name: "protocolTradeFeeNumerator";
            type: "u64";
          },
          {
            name: "config";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "closeConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "config";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "withdrawProtocolFees";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            type: "pubkey";
          },
          {
            name: "protocolAFee";
            type: "u64";
          },
          {
            name: "protocolBFee";
            type: "u64";
          },
          {
            name: "protocolAFeeOwner";
            type: "pubkey";
          },
          {
            name: "protocolBFeeOwner";
            type: "pubkey";
          }
        ];
      };
    },
    {
      name: "partnerClaimFees";
      type: {
        kind: "struct";
        fields: [
          {
            name: "pool";
            type: "pubkey";
          },
          {
            name: "feeA";
            type: "u64";
          },
          {
            name: "feeB";
            type: "u64";
          },
          {
            name: "partner";
            type: "pubkey";
          }
        ];
      };
    }
  ];
};
