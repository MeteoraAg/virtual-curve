import { PublicKey } from "@solana/web3.js";

/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/dynamic_amm.json`.
 */
/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/dynamic_amm.json`.
 */
export type DynamicAmm = {
  "address": "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB",
  "metadata": {
    "name": "dynamicAmm",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "docs": [
    "Program for AMM"
  ],
  "instructions": [
    {
      "name": "claimFee",
      "docs": [
        "Claim fee"
      ],
      "discriminator": [
        169,
        32,
        79,
        137,
        136,
        232,
        70,
        137
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "lpMint",
          "writable": true
        },
        {
          "name": "lockEscrow",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "sourceTokens",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "aTokenVault",
          "writable": true
        },
        {
          "name": "bTokenVault",
          "writable": true
        },
        {
          "name": "aVault",
          "writable": true
        },
        {
          "name": "bVault",
          "writable": true
        },
        {
          "name": "aVaultLp",
          "writable": true
        },
        {
          "name": "bVaultLp",
          "writable": true
        },
        {
          "name": "aVaultLpMint",
          "writable": true
        },
        {
          "name": "bVaultLpMint",
          "writable": true
        },
        {
          "name": "userAToken",
          "writable": true
        },
        {
          "name": "userBToken",
          "writable": true
        },
        {
          "name": "vaultProgram"
        }
      ],
      "args": [
        {
          "name": "maxAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createLockEscrow",
      "docs": [
        "Create lock account"
      ],
      "discriminator": [
        54,
        87,
        165,
        19,
        69,
        227,
        218,
        224
      ],
      "accounts": [
        {
          "name": "pool"
        },
        {
          "name": "lockEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner"
        },
        {
          "name": "lpMint"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": []
    },
    {
      "name": "initializePermissionlessConstantProductPoolWithConfig2",
      "docs": [
        "Initialize permissionless pool with config 2"
      ],
      "discriminator": [
        48,
        149,
        220,
        130,
        61,
        11,
        9,
        178
      ],
      "accounts": [
        {
          "name": "pool",
          "docs": [
            "Pool account (PDA address)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "tokenAMint"
              },
              {
                "kind": "account",
                "path": "tokenBMint"
              },
              {
                "kind": "account",
                "path": "config"
              }
            ]
          }
        },
        {
          "name": "config"
        },
        {
          "name": "lpMint",
          "docs": [
            "LP token mint of the pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "tokenAMint",
          "docs": [
            "Token A mint of the pool. Eg: USDT"
          ]
        },
        {
          "name": "tokenBMint",
          "docs": [
            "Token B mint of the pool. Eg: USDC"
          ]
        },
        {
          "name": "aVault",
          "writable": true
        },
        {
          "name": "bVault",
          "writable": true
        },
        {
          "name": "aTokenVault",
          "docs": [
            "Token vault account of vault A"
          ],
          "writable": true
        },
        {
          "name": "bTokenVault",
          "docs": [
            "Token vault account of vault B"
          ],
          "writable": true
        },
        {
          "name": "aVaultLpMint",
          "docs": [
            "LP token mint of vault A"
          ],
          "writable": true
        },
        {
          "name": "bVaultLpMint",
          "docs": [
            "LP token mint of vault B"
          ],
          "writable": true
        },
        {
          "name": "aVaultLp",
          "docs": [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "aVault"
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "bVaultLp",
          "docs": [
            "LP token account of vault B. Used to receive/burn vault LP upon deposit/withdraw from the vault."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "bVault"
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "payerTokenA",
          "docs": [
            "Payer token account for pool token A mint. Used to bootstrap the pool with initial liquidity."
          ],
          "writable": true
        },
        {
          "name": "payerTokenB",
          "docs": [
            "Admin token account for pool token B mint. Used to bootstrap the pool with initial liquidity."
          ],
          "writable": true
        },
        {
          "name": "payerPoolLp",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "payer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "lpMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "protocolTokenAFee",
          "docs": [
            "Protocol fee token account for token A. Used to receive trading fee."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tokenAMint"
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "protocolTokenBFee",
          "docs": [
            "Protocol fee token account for token B. Used to receive trading fee."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tokenBMint"
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "payer",
          "docs": [
            "Admin account. This account will be the admin of the pool, and the payer for PDA during initialize pool."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "rent",
          "docs": [
            "Rent account."
          ],
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "mintMetadata",
          "writable": true
        },
        {
          "name": "metadataProgram"
        },
        {
          "name": "vaultProgram"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program."
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "docs": [
            "Associated token program."
          ],
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program."
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "tokenAAmount",
          "type": "u64"
        },
        {
          "name": "tokenBAmount",
          "type": "u64"
        },
        {
          "name": "activationPoint",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "lock",
      "docs": [
        "Lock Lp token"
      ],
      "discriminator": [
        21,
        19,
        208,
        43,
        237,
        62,
        255,
        87
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "lpMint"
        },
        {
          "name": "lockEscrow",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "sourceTokens",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "aVault"
        },
        {
          "name": "bVault"
        },
        {
          "name": "aVaultLp"
        },
        {
          "name": "bVaultLp"
        },
        {
          "name": "aVaultLpMint"
        },
        {
          "name": "bVaultLpMint"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "partnerClaimFee",
      "docs": [
        "Partner claim fee"
      ],
      "discriminator": [
        57,
        53,
        176,
        30,
        123,
        70,
        52,
        64
      ],
      "accounts": [
        {
          "name": "pool",
          "docs": [
            "Pool account (PDA)"
          ],
          "writable": true
        },
        {
          "name": "aVaultLp",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "protocolTokenAFee",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "protocolTokenBFee",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "partnerTokenA",
          "writable": true
        },
        {
          "name": "partnerTokenB",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "partnerAuthority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "maxAmountA",
          "type": "u64"
        },
        {
          "name": "maxAmountB",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "docs": [
        "Swap token A to B, or vice versa. An amount of trading fee will be charged for liquidity provider, and the admin of the pool."
      ],
      "discriminator": [
        248,
        198,
        158,
        145,
        225,
        117,
        135,
        200
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "userSourceToken",
          "writable": true
        },
        {
          "name": "userDestinationToken",
          "writable": true
        },
        {
          "name": "aVault",
          "writable": true
        },
        {
          "name": "bVault",
          "writable": true
        },
        {
          "name": "aTokenVault",
          "writable": true
        },
        {
          "name": "bTokenVault",
          "writable": true
        },
        {
          "name": "aVaultLpMint",
          "writable": true
        },
        {
          "name": "bVaultLpMint",
          "writable": true
        },
        {
          "name": "aVaultLp",
          "writable": true
        },
        {
          "name": "bVaultLp",
          "writable": true
        },
        {
          "name": "protocolTokenFee",
          "writable": true
        },
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "vaultProgram"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "inAmount",
          "type": "u64"
        },
        {
          "name": "minimumOutAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    }
  ],
  "types": [
    {
      "name": "bootstrapping",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "activationPoint",
            "docs": [
              "Activation point, can be slot or timestamp"
            ],
            "type": "u64"
          },
          {
            "name": "whitelistedVault",
            "docs": [
              "Whitelisted vault to be able to buy pool before open slot"
            ],
            "type": "pubkey"
          },
          {
            "name": "poolCreator",
            "type": "pubkey"
          },
          {
            "name": "activationType",
            "docs": [
              "Activation type, 0 means by slot, 1 means by timestamp"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poolFees",
            "type": {
              "defined": {
                "name": "poolFees"
              }
            }
          },
          {
            "name": "activationDuration",
            "type": "u64"
          },
          {
            "name": "vaultConfigKey",
            "type": "pubkey"
          },
          {
            "name": "poolCreatorAuthority",
            "type": "pubkey"
          },
          {
            "name": "activationType",
            "type": "u8"
          },
          {
            "name": "partnerFeeNumerator",
            "type": "u64"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                219
              ]
            }
          }
        ]
      }
    },
    {
      "name": "curveType",
      "docs": [
        "Type of the swap curve"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "constantProduct"
          },
          {
            "name": "stable",
            "fields": [
              {
                "name": "amp",
                "docs": [
                  "Amplification coefficient"
                ],
                "type": "u64"
              },
              {
                "name": "tokenMultiplier",
                "docs": [
                  "Multiplier for the pool token. Used to normalized token with different decimal into the same precision."
                ],
                "type": {
                  "defined": {
                    "name": "tokenMultiplier"
                  }
                }
              },
              {
                "name": "depeg",
                "docs": [
                  "Depeg pool information. Contains functions to allow token amount to be repeg using stake / interest bearing token virtual price"
                ],
                "type": {
                  "defined": {
                    "name": "depeg"
                  }
                }
              },
              {
                "name": "lastAmpUpdatedTimestamp",
                "docs": [
                  "The last amp updated timestamp. Used to prevent update_curve_info called infinitely many times within a short period"
                ],
                "type": "u64"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "depeg",
      "docs": [
        "Contains information for depeg pool"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baseVirtualPrice",
            "docs": [
              "The virtual price of staking / interest bearing token"
            ],
            "type": "u64"
          },
          {
            "name": "baseCacheUpdated",
            "docs": [
              "The virtual price of staking / interest bearing token"
            ],
            "type": "u64"
          },
          {
            "name": "depegType",
            "docs": [
              "Type of the depeg pool"
            ],
            "type": {
              "defined": {
                "name": "depegType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "depegType",
      "docs": [
        "Type of depeg pool"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "marinade"
          },
          {
            "name": "lido"
          },
          {
            "name": "splStake"
          }
        ]
      }
    },
    {
      "name": "padding",
      "docs": [
        "Padding for future pool fields"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "padding0",
            "docs": [
              "Padding 0"
            ],
            "type": {
              "array": [
                "u8",
                6
              ]
            }
          },
          {
            "name": "padding1",
            "docs": [
              "Padding 1"
            ],
            "type": {
              "array": [
                "u64",
                21
              ]
            }
          },
          {
            "name": "padding2",
            "docs": [
              "Padding 2"
            ],
            "type": {
              "array": [
                "u64",
                21
              ]
            }
          }
        ]
      }
    },
    {
      "name": "partnerInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeNumerator",
            "type": "u64"
          },
          {
            "name": "partnerAuthority",
            "type": "pubkey"
          },
          {
            "name": "pendingFeeA",
            "type": "u64"
          },
          {
            "name": "pendingFeeB",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pool",
      "docs": [
        "State of pool account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lpMint",
            "docs": [
              "LP token mint of the pool"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenAMint",
            "docs": [
              "Token A mint of the pool. Eg: USDT"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenBMint",
            "docs": [
              "Token B mint of the pool. Eg: USDC"
            ],
            "type": "pubkey"
          },
          {
            "name": "aVault",
            "docs": [
              "Vault account for token A. Token A of the pool will be deposit / withdraw from this vault account."
            ],
            "type": "pubkey"
          },
          {
            "name": "bVault",
            "docs": [
              "Vault account for token B. Token B of the pool will be deposit / withdraw from this vault account."
            ],
            "type": "pubkey"
          },
          {
            "name": "aVaultLp",
            "docs": [
              "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
            ],
            "type": "pubkey"
          },
          {
            "name": "bVaultLp",
            "docs": [
              "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
            ],
            "type": "pubkey"
          },
          {
            "name": "aVaultLpBump",
            "docs": [
              "\"A\" vault lp bump. Used to create signer seeds."
            ],
            "type": "u8"
          },
          {
            "name": "enabled",
            "docs": [
              "Flag to determine whether the pool is enabled, or disabled."
            ],
            "type": "bool"
          },
          {
            "name": "protocolTokenAFee",
            "docs": [
              "Protocol fee token account for token A. Used to receive trading fee."
            ],
            "type": "pubkey"
          },
          {
            "name": "protocolTokenBFee",
            "docs": [
              "Protocol fee token account for token B. Used to receive trading fee."
            ],
            "type": "pubkey"
          },
          {
            "name": "feeLastUpdatedAt",
            "docs": [
              "Fee last updated timestamp"
            ],
            "type": "u64"
          },
          {
            "name": "padding0",
            "type": {
              "array": [
                "u8",
                24
              ]
            }
          },
          {
            "name": "fees",
            "docs": [
              "Store the fee charges setting."
            ],
            "type": {
              "defined": {
                "name": "poolFees"
              }
            }
          },
          {
            "name": "poolType",
            "docs": [
              "Pool type"
            ],
            "type": {
              "defined": {
                "name": "poolType"
              }
            }
          },
          {
            "name": "stake",
            "docs": [
              "Stake pubkey of SPL stake pool"
            ],
            "type": "pubkey"
          },
          {
            "name": "totalLockedLp",
            "docs": [
              "Total locked lp token"
            ],
            "type": "u64"
          },
          {
            "name": "bootstrapping",
            "docs": [
              "Bootstrapping config"
            ],
            "type": {
              "defined": {
                "name": "bootstrapping"
              }
            }
          },
          {
            "name": "partnerInfo",
            "type": {
              "defined": {
                "name": "partnerInfo"
              }
            }
          },
          {
            "name": "padding",
            "docs": [
              "Padding for future pool field"
            ],
            "type": {
              "defined": {
                "name": "padding"
              }
            }
          },
          {
            "name": "curveType",
            "docs": [
              "The type of the swap curve supported by the pool."
            ],
            "type": {
              "defined": {
                "name": "curveType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "poolFees",
      "docs": [
        "Information regarding fee charges"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tradeFeeNumerator",
            "docs": [
              "Trade fees are extra token amounts that are held inside the token",
              "accounts during a trade, making the value of liquidity tokens rise.",
              "Trade fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "tradeFeeDenominator",
            "docs": [
              "Trade fee denominator"
            ],
            "type": "u64"
          },
          {
            "name": "protocolTradeFeeNumerator",
            "docs": [
              "Owner trading fees are extra token amounts that are held inside the token",
              "accounts during a trade, with the equivalent in pool tokens minted to",
              "the owner of the program.",
              "Owner trade fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "protocolTradeFeeDenominator",
            "docs": [
              "Owner trade fee denominator"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "poolType",
      "docs": [
        "Pool type"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "permissioned"
          },
          {
            "name": "permissionless"
          }
        ]
      }
    },
    {
      "name": "tokenMultiplier",
      "docs": [
        "Multiplier for the pool token. Used to normalized token with different decimal into the same precision."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenAMultiplier",
            "docs": [
              "Multiplier for token A of the pool."
            ],
            "type": "u64"
          },
          {
            "name": "tokenBMultiplier",
            "docs": [
              "Multiplier for token B of the pool."
            ],
            "type": "u64"
          },
          {
            "name": "precisionFactor",
            "docs": [
              "Record the highest token decimal in the pool. For example, Token A is 6 decimal, token B is 9 decimal. This will save value of 9."
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};

export const DynamicAmmInstance = {
  "address": new PublicKey("Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB"),
  "metadata": {
    "name": "dynamicAmm",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "docs": [
    "Program for AMM"
  ],
  "instructions": [
    {
      "name": "claimFee",
      "docs": [
        "Claim fee"
      ],
      "discriminator": [
        169,
        32,
        79,
        137,
        136,
        232,
        70,
        137
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "lpMint",
          "writable": true
        },
        {
          "name": "lockEscrow",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "sourceTokens",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "aTokenVault",
          "writable": true
        },
        {
          "name": "bTokenVault",
          "writable": true
        },
        {
          "name": "aVault",
          "writable": true
        },
        {
          "name": "bVault",
          "writable": true
        },
        {
          "name": "aVaultLp",
          "writable": true
        },
        {
          "name": "bVaultLp",
          "writable": true
        },
        {
          "name": "aVaultLpMint",
          "writable": true
        },
        {
          "name": "bVaultLpMint",
          "writable": true
        },
        {
          "name": "userAToken",
          "writable": true
        },
        {
          "name": "userBToken",
          "writable": true
        },
        {
          "name": "vaultProgram"
        }
      ],
      "args": [
        {
          "name": "maxAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createLockEscrow",
      "docs": [
        "Create lock account"
      ],
      "discriminator": [
        54,
        87,
        165,
        19,
        69,
        227,
        218,
        224
      ],
      "accounts": [
        {
          "name": "pool"
        },
        {
          "name": "lockEscrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  99,
                  107,
                  95,
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner"
        },
        {
          "name": "lpMint"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": []
    },
    {
      "name": "initializePermissionlessConstantProductPoolWithConfig2",
      "docs": [
        "Initialize permissionless pool with config 2"
      ],
      "discriminator": [
        48,
        149,
        220,
        130,
        61,
        11,
        9,
        178
      ],
      "accounts": [
        {
          "name": "pool",
          "docs": [
            "Pool account (PDA address)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "tokenAMint"
              },
              {
                "kind": "account",
                "path": "tokenBMint"
              },
              {
                "kind": "account",
                "path": "config"
              }
            ]
          }
        },
        {
          "name": "config"
        },
        {
          "name": "lpMint",
          "docs": [
            "LP token mint of the pool"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "tokenAMint",
          "docs": [
            "Token A mint of the pool. Eg: USDT"
          ]
        },
        {
          "name": "tokenBMint",
          "docs": [
            "Token B mint of the pool. Eg: USDC"
          ]
        },
        {
          "name": "aVault",
          "writable": true
        },
        {
          "name": "bVault",
          "writable": true
        },
        {
          "name": "aTokenVault",
          "docs": [
            "Token vault account of vault A"
          ],
          "writable": true
        },
        {
          "name": "bTokenVault",
          "docs": [
            "Token vault account of vault B"
          ],
          "writable": true
        },
        {
          "name": "aVaultLpMint",
          "docs": [
            "LP token mint of vault A"
          ],
          "writable": true
        },
        {
          "name": "bVaultLpMint",
          "docs": [
            "LP token mint of vault B"
          ],
          "writable": true
        },
        {
          "name": "aVaultLp",
          "docs": [
            "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "aVault"
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "bVaultLp",
          "docs": [
            "LP token account of vault B. Used to receive/burn vault LP upon deposit/withdraw from the vault."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "bVault"
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "payerTokenA",
          "docs": [
            "Payer token account for pool token A mint. Used to bootstrap the pool with initial liquidity."
          ],
          "writable": true
        },
        {
          "name": "payerTokenB",
          "docs": [
            "Admin token account for pool token B mint. Used to bootstrap the pool with initial liquidity."
          ],
          "writable": true
        },
        {
          "name": "payerPoolLp",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "payer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "lpMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "protocolTokenAFee",
          "docs": [
            "Protocol fee token account for token A. Used to receive trading fee."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tokenAMint"
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "protocolTokenBFee",
          "docs": [
            "Protocol fee token account for token B. Used to receive trading fee."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "tokenBMint"
              },
              {
                "kind": "account",
                "path": "pool"
              }
            ]
          }
        },
        {
          "name": "payer",
          "docs": [
            "Admin account. This account will be the admin of the pool, and the payer for PDA during initialize pool."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "rent",
          "docs": [
            "Rent account."
          ],
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "mintMetadata",
          "writable": true
        },
        {
          "name": "metadataProgram"
        },
        {
          "name": "vaultProgram"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program."
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "docs": [
            "Associated token program."
          ],
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "docs": [
            "System program."
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "tokenAAmount",
          "type": "u64"
        },
        {
          "name": "tokenBAmount",
          "type": "u64"
        },
        {
          "name": "activationPoint",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "lock",
      "docs": [
        "Lock Lp token"
      ],
      "discriminator": [
        21,
        19,
        208,
        43,
        237,
        62,
        255,
        87
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "lpMint"
        },
        {
          "name": "lockEscrow",
          "writable": true
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "sourceTokens",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "aVault"
        },
        {
          "name": "bVault"
        },
        {
          "name": "aVaultLp"
        },
        {
          "name": "bVaultLp"
        },
        {
          "name": "aVaultLpMint"
        },
        {
          "name": "bVaultLpMint"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "partnerClaimFee",
      "docs": [
        "Partner claim fee"
      ],
      "discriminator": [
        57,
        53,
        176,
        30,
        123,
        70,
        52,
        64
      ],
      "accounts": [
        {
          "name": "pool",
          "docs": [
            "Pool account (PDA)"
          ],
          "writable": true
        },
        {
          "name": "aVaultLp",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "protocolTokenAFee",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "protocolTokenBFee",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "partnerTokenA",
          "writable": true
        },
        {
          "name": "partnerTokenB",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "partnerAuthority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "maxAmountA",
          "type": "u64"
        },
        {
          "name": "maxAmountB",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "docs": [
        "Swap token A to B, or vice versa. An amount of trading fee will be charged for liquidity provider, and the admin of the pool."
      ],
      "discriminator": [
        248,
        198,
        158,
        145,
        225,
        117,
        135,
        200
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "userSourceToken",
          "writable": true
        },
        {
          "name": "userDestinationToken",
          "writable": true
        },
        {
          "name": "aVault",
          "writable": true
        },
        {
          "name": "bVault",
          "writable": true
        },
        {
          "name": "aTokenVault",
          "writable": true
        },
        {
          "name": "bTokenVault",
          "writable": true
        },
        {
          "name": "aVaultLpMint",
          "writable": true
        },
        {
          "name": "bVaultLpMint",
          "writable": true
        },
        {
          "name": "aVaultLp",
          "writable": true
        },
        {
          "name": "bVaultLp",
          "writable": true
        },
        {
          "name": "protocolTokenFee",
          "writable": true
        },
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "vaultProgram"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "inAmount",
          "type": "u64"
        },
        {
          "name": "minimumOutAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    }
  ],
  "types": [
    {
      "name": "bootstrapping",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "activationPoint",
            "docs": [
              "Activation point, can be slot or timestamp"
            ],
            "type": "u64"
          },
          {
            "name": "whitelistedVault",
            "docs": [
              "Whitelisted vault to be able to buy pool before open slot"
            ],
            "type": "pubkey"
          },
          {
            "name": "poolCreator",
            "type": "pubkey"
          },
          {
            "name": "activationType",
            "docs": [
              "Activation type, 0 means by slot, 1 means by timestamp"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "poolFees",
            "type": {
              "defined": {
                "name": "poolFees"
              }
            }
          },
          {
            "name": "activationDuration",
            "type": "u64"
          },
          {
            "name": "vaultConfigKey",
            "type": "pubkey"
          },
          {
            "name": "poolCreatorAuthority",
            "type": "pubkey"
          },
          {
            "name": "activationType",
            "type": "u8"
          },
          {
            "name": "partnerFeeNumerator",
            "type": "u64"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                219
              ]
            }
          }
        ]
      }
    },
    {
      "name": "curveType",
      "docs": [
        "Type of the swap curve"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "constantProduct"
          },
          {
            "name": "stable",
            "fields": [
              {
                "name": "amp",
                "docs": [
                  "Amplification coefficient"
                ],
                "type": "u64"
              },
              {
                "name": "tokenMultiplier",
                "docs": [
                  "Multiplier for the pool token. Used to normalized token with different decimal into the same precision."
                ],
                "type": {
                  "defined": {
                    "name": "tokenMultiplier"
                  }
                }
              },
              {
                "name": "depeg",
                "docs": [
                  "Depeg pool information. Contains functions to allow token amount to be repeg using stake / interest bearing token virtual price"
                ],
                "type": {
                  "defined": {
                    "name": "depeg"
                  }
                }
              },
              {
                "name": "lastAmpUpdatedTimestamp",
                "docs": [
                  "The last amp updated timestamp. Used to prevent update_curve_info called infinitely many times within a short period"
                ],
                "type": "u64"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "depeg",
      "docs": [
        "Contains information for depeg pool"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baseVirtualPrice",
            "docs": [
              "The virtual price of staking / interest bearing token"
            ],
            "type": "u64"
          },
          {
            "name": "baseCacheUpdated",
            "docs": [
              "The virtual price of staking / interest bearing token"
            ],
            "type": "u64"
          },
          {
            "name": "depegType",
            "docs": [
              "Type of the depeg pool"
            ],
            "type": {
              "defined": {
                "name": "depegType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "depegType",
      "docs": [
        "Type of depeg pool"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "marinade"
          },
          {
            "name": "lido"
          },
          {
            "name": "splStake"
          }
        ]
      }
    },
    {
      "name": "padding",
      "docs": [
        "Padding for future pool fields"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "padding0",
            "docs": [
              "Padding 0"
            ],
            "type": {
              "array": [
                "u8",
                6
              ]
            }
          },
          {
            "name": "padding1",
            "docs": [
              "Padding 1"
            ],
            "type": {
              "array": [
                "u64",
                21
              ]
            }
          },
          {
            "name": "padding2",
            "docs": [
              "Padding 2"
            ],
            "type": {
              "array": [
                "u64",
                21
              ]
            }
          }
        ]
      }
    },
    {
      "name": "partnerInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeNumerator",
            "type": "u64"
          },
          {
            "name": "partnerAuthority",
            "type": "pubkey"
          },
          {
            "name": "pendingFeeA",
            "type": "u64"
          },
          {
            "name": "pendingFeeB",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pool",
      "docs": [
        "State of pool account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lpMint",
            "docs": [
              "LP token mint of the pool"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenAMint",
            "docs": [
              "Token A mint of the pool. Eg: USDT"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenBMint",
            "docs": [
              "Token B mint of the pool. Eg: USDC"
            ],
            "type": "pubkey"
          },
          {
            "name": "aVault",
            "docs": [
              "Vault account for token A. Token A of the pool will be deposit / withdraw from this vault account."
            ],
            "type": "pubkey"
          },
          {
            "name": "bVault",
            "docs": [
              "Vault account for token B. Token B of the pool will be deposit / withdraw from this vault account."
            ],
            "type": "pubkey"
          },
          {
            "name": "aVaultLp",
            "docs": [
              "LP token account of vault A. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
            ],
            "type": "pubkey"
          },
          {
            "name": "bVaultLp",
            "docs": [
              "LP token account of vault B. Used to receive/burn the vault LP upon deposit/withdraw from the vault."
            ],
            "type": "pubkey"
          },
          {
            "name": "aVaultLpBump",
            "docs": [
              "\"A\" vault lp bump. Used to create signer seeds."
            ],
            "type": "u8"
          },
          {
            "name": "enabled",
            "docs": [
              "Flag to determine whether the pool is enabled, or disabled."
            ],
            "type": "bool"
          },
          {
            "name": "protocolTokenAFee",
            "docs": [
              "Protocol fee token account for token A. Used to receive trading fee."
            ],
            "type": "pubkey"
          },
          {
            "name": "protocolTokenBFee",
            "docs": [
              "Protocol fee token account for token B. Used to receive trading fee."
            ],
            "type": "pubkey"
          },
          {
            "name": "feeLastUpdatedAt",
            "docs": [
              "Fee last updated timestamp"
            ],
            "type": "u64"
          },
          {
            "name": "padding0",
            "type": {
              "array": [
                "u8",
                24
              ]
            }
          },
          {
            "name": "fees",
            "docs": [
              "Store the fee charges setting."
            ],
            "type": {
              "defined": {
                "name": "poolFees"
              }
            }
          },
          {
            "name": "poolType",
            "docs": [
              "Pool type"
            ],
            "type": {
              "defined": {
                "name": "poolType"
              }
            }
          },
          {
            "name": "stake",
            "docs": [
              "Stake pubkey of SPL stake pool"
            ],
            "type": "pubkey"
          },
          {
            "name": "totalLockedLp",
            "docs": [
              "Total locked lp token"
            ],
            "type": "u64"
          },
          {
            "name": "bootstrapping",
            "docs": [
              "Bootstrapping config"
            ],
            "type": {
              "defined": {
                "name": "bootstrapping"
              }
            }
          },
          {
            "name": "partnerInfo",
            "type": {
              "defined": {
                "name": "partnerInfo"
              }
            }
          },
          {
            "name": "padding",
            "docs": [
              "Padding for future pool field"
            ],
            "type": {
              "defined": {
                "name": "padding"
              }
            }
          },
          {
            "name": "curveType",
            "docs": [
              "The type of the swap curve supported by the pool."
            ],
            "type": {
              "defined": {
                "name": "curveType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "poolFees",
      "docs": [
        "Information regarding fee charges"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tradeFeeNumerator",
            "docs": [
              "Trade fees are extra token amounts that are held inside the token",
              "accounts during a trade, making the value of liquidity tokens rise.",
              "Trade fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "tradeFeeDenominator",
            "docs": [
              "Trade fee denominator"
            ],
            "type": "u64"
          },
          {
            "name": "protocolTradeFeeNumerator",
            "docs": [
              "Owner trading fees are extra token amounts that are held inside the token",
              "accounts during a trade, with the equivalent in pool tokens minted to",
              "the owner of the program.",
              "Owner trade fee numerator"
            ],
            "type": "u64"
          },
          {
            "name": "protocolTradeFeeDenominator",
            "docs": [
              "Owner trade fee denominator"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "poolType",
      "docs": [
        "Pool type"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "permissioned"
          },
          {
            "name": "permissionless"
          }
        ]
      }
    },
    {
      "name": "tokenMultiplier",
      "docs": [
        "Multiplier for the pool token. Used to normalized token with different decimal into the same precision."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenAMultiplier",
            "docs": [
              "Multiplier for token A of the pool."
            ],
            "type": "u64"
          },
          {
            "name": "tokenBMultiplier",
            "docs": [
              "Multiplier for token B of the pool."
            ],
            "type": "u64"
          },
          {
            "name": "precisionFactor",
            "docs": [
              "Record the highest token decimal in the pool. For example, Token A is 6 decimal, token B is 9 decimal. This will save value of 9."
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};
