/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/locker.json`.
 */
export type Locker = {
  "address": "LocpQgucEQHbqNABEYvBvwoxCPsSbG91A1QaQhQQqjn",
  "metadata": {
    "name": "locker",
    "version": "0.4.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "cancelVestingEscrow",
      "docs": [
        "Cancel a vesting escrow.",
        "- The claimable token will be transferred to recipient",
        "- The remaining token will be transferred to the creator",
        "This instruction supports both splToken and token2022",
        "# Arguments",
        "",
        "* ctx - The accounts needed by instruction.",
        "* remaining_accounts_info: additional accounts needed by instruction",
        ""
      ],
      "discriminator": [
        217,
        233,
        13,
        3,
        143,
        101,
        53,
        201
      ],
      "accounts": [
        {
          "name": "escrow",
          "docs": [
            "Escrow."
          ],
          "writable": true
        },
        {
          "name": "tokenMint",
          "docs": [
            "Mint."
          ],
          "writable": true,
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "escrowToken",
          "docs": [
            "Escrow Token Account."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "escrow"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
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
          "name": "creatorToken",
          "docs": [
            "Creator Token Account."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "escrow"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
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
          "name": "recipientToken",
          "docs": [
            "Receipient Token Account."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "escrow"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
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
          "name": "rentReceiver",
          "docs": [
            "CHECKED: The Token Account will receive the rent"
          ],
          "writable": true
        },
        {
          "name": "signer",
          "docs": [
            "Signer."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "memoProgram",
          "docs": [
            "Memo program."
          ],
          "address": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program."
          ]
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "remainingAccountsInfo",
          "type": {
            "option": {
              "defined": {
                "name": "remainingAccountsInfo"
              }
            }
          }
        }
      ]
    },
    {
      "name": "claim",
      "docs": [
        "Claim maximum amount from the vesting escrow",
        "# Arguments",
        "",
        "* ctx - The accounts needed by instruction.",
        "* max_amount - The maximum amount claimed by the recipient",
        ""
      ],
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "escrow",
          "docs": [
            "Escrow."
          ],
          "writable": true
        },
        {
          "name": "escrowToken",
          "docs": [
            "Escrow Token Account."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "escrow"
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
                "path": "escrow"
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
          "name": "recipient",
          "docs": [
            "Recipient."
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "recipientToken",
          "docs": [
            "Recipient Token Account."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program."
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
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
      "name": "claimV2",
      "docs": [
        "Claim maximum amount from the vesting escrow",
        "This instruction supports both splToken and token2022",
        "# Arguments",
        "",
        "* ctx - The accounts needed by instruction.",
        "* max_amount - The maximum amount claimed by the recipient",
        "* remaining_accounts_info: additional accounts needed by instruction",
        ""
      ],
      "discriminator": [
        229,
        87,
        46,
        162,
        21,
        157,
        231,
        114
      ],
      "accounts": [
        {
          "name": "escrow",
          "docs": [
            "Escrow."
          ],
          "writable": true
        },
        {
          "name": "tokenMint",
          "docs": [
            "Mint."
          ],
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "escrowToken",
          "docs": [
            "Escrow Token Account."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "escrow"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
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
          "name": "recipient",
          "docs": [
            "Recipient."
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "recipientToken",
          "docs": [
            "Recipient Token Account."
          ],
          "writable": true
        },
        {
          "name": "memoProgram",
          "docs": [
            "Memo program."
          ],
          "address": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program."
          ]
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "maxAmount",
          "type": "u64"
        },
        {
          "name": "remainingAccountsInfo",
          "type": {
            "option": {
              "defined": {
                "name": "remainingAccountsInfo"
              }
            }
          }
        }
      ]
    },
    {
      "name": "closeVestingEscrow",
      "docs": [
        "Close vesting escrow",
        "- Close vesting escrow and escrow ATA and escrow metadata if recipient already claimed all tokens",
        "- Rent receiver must be escrow's creator",
        "This instruction supports both splToken and token2022",
        "# Arguments",
        "",
        "* ctx - The accounts needed by instruction.",
        "* remaining_accounts_info: additional accounts needed by instruction",
        ""
      ],
      "discriminator": [
        221,
        185,
        95,
        135,
        136,
        67,
        252,
        87
      ],
      "accounts": [
        {
          "name": "escrow",
          "docs": [
            "Escrow."
          ],
          "writable": true
        },
        {
          "name": "escrowMetadata",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "tokenMint",
          "docs": [
            "Mint."
          ],
          "writable": true
        },
        {
          "name": "escrowToken",
          "writable": true
        },
        {
          "name": "creatorToken",
          "writable": true
        },
        {
          "name": "creator",
          "docs": [
            "Creator."
          ],
          "writable": true,
          "signer": true,
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program."
          ]
        },
        {
          "name": "memoProgram",
          "docs": [
            "Memo program."
          ],
          "address": "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "remainingAccountsInfo",
          "type": {
            "option": {
              "defined": {
                "name": "remainingAccountsInfo"
              }
            }
          }
        }
      ]
    },
    {
      "name": "createRootEscrow",
      "docs": [
        "Create root escrow"
      ],
      "discriminator": [
        116,
        212,
        12,
        188,
        77,
        226,
        32,
        201
      ],
      "accounts": [
        {
          "name": "base",
          "signer": true
        },
        {
          "name": "rootEscrow",
          "docs": [
            "Root Escrow."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116,
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
                "path": "base"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              },
              {
                "kind": "arg",
                "path": "params.version"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "payer",
          "docs": [
            "payer."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "creator"
        },
        {
          "name": "systemProgram",
          "docs": [
            "system program."
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createRootEscrowParameters"
            }
          }
        }
      ]
    },
    {
      "name": "createVestingEscrow",
      "docs": [
        "Create a vesting escrow for the given params",
        "# Arguments",
        "",
        "* ctx - The accounts needed by instruction.",
        "* params - The params needed by instruction.",
        "* vesting_start_time - The creation time of this escrow",
        "* cliff_time - Trade cliff time of the escrow",
        "* frequency - How frequent the claimable amount will be updated",
        "* cliff_unlock_amount - The amount unlocked after cliff time",
        "* amount_per_period - The amount unlocked per vesting period",
        "* number_of_period - The total number of vesting period",
        "* update_recipient_mode - Decide who can update the recipient of the escrow",
        "* cancel_mode - Decide who can cancel the the escrow",
        ""
      ],
      "discriminator": [
        23,
        100,
        197,
        94,
        222,
        153,
        38,
        90
      ],
      "accounts": [
        {
          "name": "base",
          "docs": [
            "Base."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
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
                "path": "base"
              }
            ]
          }
        },
        {
          "name": "escrowToken",
          "docs": [
            "Escrow Token Account."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "escrow"
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
                "path": "sender_token.mint",
                "account": "tokenAccount"
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
          "name": "sender",
          "docs": [
            "Sender."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "senderToken",
          "docs": [
            "Sender Token Account."
          ],
          "writable": true
        },
        {
          "name": "recipient"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program."
          ],
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "docs": [
            "system program."
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createVestingEscrowParameters"
            }
          }
        }
      ]
    },
    {
      "name": "createVestingEscrowFromRoot",
      "docs": [
        "Crate vesting escrow from root"
      ],
      "discriminator": [
        6,
        238,
        161,
        108,
        252,
        114,
        246,
        91
      ],
      "accounts": [
        {
          "name": "rootEscrow",
          "docs": [
            "Root Escrow."
          ],
          "writable": true
        },
        {
          "name": "base",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "rootEscrow"
              },
              {
                "kind": "account",
                "path": "recipient"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
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
                "path": "base"
              }
            ]
          }
        },
        {
          "name": "escrowToken",
          "docs": [
            "Escrow Token Account."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "escrow"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
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
          "name": "rootEscrowToken",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "rootEscrow"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
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
          "name": "tokenMint",
          "docs": [
            "Mint."
          ],
          "relations": [
            "rootEscrow"
          ]
        },
        {
          "name": "payer",
          "docs": [
            "Rent Payer"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "recipient"
        },
        {
          "name": "systemProgram",
          "docs": [
            "system program."
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program."
          ]
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createVestingEscrowFromRootParams"
            }
          }
        },
        {
          "name": "proof",
          "type": {
            "vec": {
              "array": [
                "u8",
                32
              ]
            }
          }
        },
        {
          "name": "remainingAccountsInfo",
          "type": {
            "option": {
              "defined": {
                "name": "remainingAccountsInfo"
              }
            }
          }
        }
      ]
    },
    {
      "name": "createVestingEscrowMetadata",
      "docs": [
        "Create vesting escrow metadata",
        "# Arguments",
        "",
        "* ctx - The accounts needed by instruction.",
        "* params - The params needed by instruction.",
        "* name - The name of the vesting escrow",
        "* description - The description of the vesting escrow",
        "* creator_email - The email of the creator",
        "* recipient_email - The email of the recipient",
        ""
      ],
      "discriminator": [
        93,
        78,
        33,
        103,
        173,
        125,
        70,
        0
      ],
      "accounts": [
        {
          "name": "escrow",
          "docs": [
            "The [Escrow]."
          ],
          "writable": true
        },
        {
          "name": "creator",
          "docs": [
            "Creator of the escrow."
          ],
          "signer": true,
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "escrowMetadata",
          "docs": [
            "The [ProposalMeta]."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "payer",
          "docs": [
            "Payer of the [ProposalMeta]."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "system program."
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createVestingEscrowMetadataParameters"
            }
          }
        }
      ]
    },
    {
      "name": "createVestingEscrowV2",
      "docs": [
        "Create a vesting escrow for the given params",
        "This instruction supports both splToken and token2022",
        "# Arguments",
        "",
        "* ctx - The accounts needed by instruction.",
        "* params - The params needed by instruction.",
        "* vesting_start_time - The creation time of this escrow",
        "* cliff_time - Trade cliff time of the escrow",
        "* frequency - How frequent the claimable amount will be updated",
        "* cliff_unlock_amount - The amount unlocked after cliff time",
        "* amount_per_period - The amount unlocked per vesting period",
        "* number_of_period - The total number of vesting period",
        "* update_recipient_mode - Decide who can update the recipient of the escrow",
        "* cancel_mode - Decide who can cancel the the escrow",
        "* remaining_accounts_info: additional accounts needed by instruction",
        ""
      ],
      "discriminator": [
        181,
        155,
        104,
        183,
        182,
        128,
        35,
        47
      ],
      "accounts": [
        {
          "name": "base",
          "docs": [
            "Base."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
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
                "path": "base"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "escrowToken",
          "docs": [
            "Escrow Token Account."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "escrow"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
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
          "name": "sender",
          "docs": [
            "Sender."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "senderToken",
          "docs": [
            "Sender Token Account."
          ],
          "writable": true
        },
        {
          "name": "recipient"
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program."
          ]
        },
        {
          "name": "systemProgram",
          "docs": [
            "system program."
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "createVestingEscrowParameters"
            }
          }
        },
        {
          "name": "remainingAccountsInfo",
          "type": {
            "option": {
              "defined": {
                "name": "remainingAccountsInfo"
              }
            }
          }
        }
      ]
    },
    {
      "name": "fundRootEscrow",
      "docs": [
        "Fund root escrow"
      ],
      "discriminator": [
        251,
        106,
        189,
        200,
        108,
        15,
        144,
        95
      ],
      "accounts": [
        {
          "name": "rootEscrow",
          "docs": [
            "Root Escrow."
          ],
          "writable": true
        },
        {
          "name": "tokenMint",
          "relations": [
            "rootEscrow"
          ]
        },
        {
          "name": "rootEscrowToken",
          "docs": [
            "Escrow Token Account."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "rootEscrow"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "tokenMint"
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
          "name": "payer",
          "docs": [
            "Payer."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "payerToken",
          "docs": [
            "Payer Token Account."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program."
          ]
        },
        {
          "name": "systemProgram",
          "docs": [
            "system program."
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "maxAmount",
          "type": "u64"
        },
        {
          "name": "remainingAccountsInfo",
          "type": {
            "option": {
              "defined": {
                "name": "remainingAccountsInfo"
              }
            }
          }
        }
      ]
    },
    {
      "name": "updateVestingEscrowRecipient",
      "docs": [
        "Update vesting escrow metadata",
        "# Arguments",
        "",
        "* ctx - The accounts needed by instruction.",
        "* new_recipient - The address of the new recipient",
        "* new_recipient_email - The email of the new recipient",
        ""
      ],
      "discriminator": [
        26,
        242,
        127,
        255,
        237,
        109,
        47,
        206
      ],
      "accounts": [
        {
          "name": "escrow",
          "docs": [
            "Escrow."
          ],
          "writable": true
        },
        {
          "name": "escrowMetadata",
          "docs": [
            "Escrow metadata."
          ],
          "writable": true,
          "optional": true
        },
        {
          "name": "signer",
          "docs": [
            "Signer."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "docs": [
            "system program."
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "newRecipient",
          "type": "pubkey"
        },
        {
          "name": "newRecipientEmail",
          "type": {
            "option": "string"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "rootEscrow",
      "discriminator": [
        253,
        209,
        220,
        107,
        206,
        191,
        71,
        158
      ]
    },
    {
      "name": "vestingEscrow",
      "discriminator": [
        244,
        119,
        183,
        4,
        73,
        116,
        135,
        195
      ]
    },
    {
      "name": "vestingEscrowMetadata",
      "discriminator": [
        24,
        204,
        166,
        104,
        87,
        158,
        76,
        13
      ]
    }
  ],
  "events": [
    {
      "name": "eventCancelVestingEscrow",
      "discriminator": [
        113,
        2,
        117,
        173,
        195,
        39,
        101,
        155
      ]
    },
    {
      "name": "eventCancelVestingEscrowV3",
      "discriminator": [
        41,
        143,
        236,
        79,
        116,
        120,
        91,
        143
      ]
    },
    {
      "name": "eventClaim",
      "discriminator": [
        171,
        144,
        1,
        189,
        120,
        200,
        38,
        11
      ]
    },
    {
      "name": "eventClaimV3",
      "discriminator": [
        229,
        197,
        142,
        10,
        41,
        122,
        171,
        154
      ]
    },
    {
      "name": "eventCloseClaimStatus",
      "discriminator": [
        87,
        68,
        38,
        194,
        241,
        155,
        125,
        107
      ]
    },
    {
      "name": "eventCloseVestingEscrow",
      "discriminator": [
        45,
        141,
        253,
        209,
        196,
        133,
        21,
        204
      ]
    },
    {
      "name": "eventCreateRootEscrow",
      "discriminator": [
        105,
        216,
        97,
        182,
        27,
        224,
        199,
        228
      ]
    },
    {
      "name": "eventCreateVestingEscrow",
      "discriminator": [
        248,
        222,
        89,
        61,
        170,
        208,
        131,
        117
      ]
    },
    {
      "name": "eventFundRootEscrow",
      "discriminator": [
        74,
        8,
        68,
        181,
        198,
        235,
        138,
        81
      ]
    },
    {
      "name": "eventUpdateVestingEscrowRecipient",
      "discriminator": [
        206,
        218,
        33,
        65,
        133,
        237,
        131,
        57
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "mathOverflow",
      "msg": "Math operation overflow"
    },
    {
      "code": 6001,
      "name": "frequencyIsZero",
      "msg": "Frequency is zero"
    },
    {
      "code": 6002,
      "name": "invalidEscrowTokenAddress",
      "msg": "Invalid escrow token address"
    },
    {
      "code": 6003,
      "name": "invalidUpdateRecipientMode",
      "msg": "Invalid update recipient mode"
    },
    {
      "code": 6004,
      "name": "invalidCancelMode",
      "msg": "Invalid cancel mode"
    },
    {
      "code": 6005,
      "name": "notPermitToDoThisAction",
      "msg": "Not permit to do this action"
    },
    {
      "code": 6006,
      "name": "invalidRecipientTokenAccount",
      "msg": "Invalid recipient token account"
    },
    {
      "code": 6007,
      "name": "invalidCreatorTokenAccount",
      "msg": "Invalid creator token account"
    },
    {
      "code": 6008,
      "name": "invalidEscrowMetadata",
      "msg": "Invalid escrow metadata"
    },
    {
      "code": 6009,
      "name": "invalidVestingStartTime",
      "msg": "Invalid vesting start time"
    },
    {
      "code": 6010,
      "name": "alreadyCancelled",
      "msg": "Already cancelled"
    },
    {
      "code": 6011,
      "name": "cancelledAtIsZero",
      "msg": "Cancelled timestamp is zero"
    },
    {
      "code": 6012,
      "name": "incorrectTokenProgramId",
      "msg": "Invalid token program ID"
    },
    {
      "code": 6013,
      "name": "transferFeeCalculationFailure",
      "msg": "Calculate transfer fee failure"
    },
    {
      "code": 6014,
      "name": "unsupportedMint",
      "msg": "Unsupported mint"
    },
    {
      "code": 6015,
      "name": "invalidRemainingAccountSlice",
      "msg": "Invalid remaining accounts"
    },
    {
      "code": 6016,
      "name": "insufficientRemainingAccounts",
      "msg": "Insufficient remaining accounts"
    },
    {
      "code": 6017,
      "name": "duplicatedRemainingAccountTypes",
      "msg": "Same accounts type is provided more than once"
    },
    {
      "code": 6018,
      "name": "noTransferHookProgram",
      "msg": "Missing remaining accounts for transfer hook."
    },
    {
      "code": 6019,
      "name": "claimingIsNotFinished",
      "msg": "Claiming is not finished"
    },
    {
      "code": 6020,
      "name": "invalidMerkleProof",
      "msg": "Invalid merkle proof"
    },
    {
      "code": 6021,
      "name": "escrowNotCancelled",
      "msg": "Escrow is not cancelled"
    },
    {
      "code": 6022,
      "name": "amountIsZero",
      "msg": "Amount is zero"
    },
    {
      "code": 6023,
      "name": "invalidParams",
      "msg": "Invalid params"
    }
  ],
  "types": [
    {
      "name": "accountsType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "transferHookEscrow"
          }
        ]
      }
    },
    {
      "name": "createRootEscrowParameters",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxClaimAmount",
            "type": "u64"
          },
          {
            "name": "maxEscrow",
            "type": "u64"
          },
          {
            "name": "version",
            "type": "u64"
          },
          {
            "name": "root",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "createVestingEscrowFromRootParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vestingStartTime",
            "type": "u64"
          },
          {
            "name": "cliffTime",
            "type": "u64"
          },
          {
            "name": "frequency",
            "type": "u64"
          },
          {
            "name": "cliffUnlockAmount",
            "type": "u64"
          },
          {
            "name": "amountPerPeriod",
            "type": "u64"
          },
          {
            "name": "numberOfPeriod",
            "type": "u64"
          },
          {
            "name": "updateRecipientMode",
            "type": "u8"
          },
          {
            "name": "cancelMode",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "createVestingEscrowMetadataParameters",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "creatorEmail",
            "type": "string"
          },
          {
            "name": "recipientEmail",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "createVestingEscrowParameters",
      "docs": [
        "Accounts for [locker::create_vesting_escrow]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vestingStartTime",
            "type": "u64"
          },
          {
            "name": "cliffTime",
            "type": "u64"
          },
          {
            "name": "frequency",
            "type": "u64"
          },
          {
            "name": "cliffUnlockAmount",
            "type": "u64"
          },
          {
            "name": "amountPerPeriod",
            "type": "u64"
          },
          {
            "name": "numberOfPeriod",
            "type": "u64"
          },
          {
            "name": "updateRecipientMode",
            "type": "u8"
          },
          {
            "name": "cancelMode",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "eventCancelVestingEscrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrow",
            "type": "pubkey"
          },
          {
            "name": "signer",
            "type": "pubkey"
          },
          {
            "name": "claimableAmount",
            "type": "u64"
          },
          {
            "name": "remainingAmount",
            "type": "u64"
          },
          {
            "name": "cancelledAt",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "eventCancelVestingEscrowV3",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrow",
            "type": "pubkey"
          },
          {
            "name": "signer",
            "type": "pubkey"
          },
          {
            "name": "remainingAmount",
            "type": "u64"
          },
          {
            "name": "cancelledAt",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "eventClaim",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "currentTs",
            "type": "u64"
          },
          {
            "name": "escrow",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "eventClaimV3",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "currentTs",
            "type": "u64"
          },
          {
            "name": "escrow",
            "type": "pubkey"
          },
          {
            "name": "vestingStartTime",
            "type": "u64"
          },
          {
            "name": "cliffTime",
            "type": "u64"
          },
          {
            "name": "frequency",
            "type": "u64"
          },
          {
            "name": "cliffUnlockAmount",
            "type": "u64"
          },
          {
            "name": "amountPerPeriod",
            "type": "u64"
          },
          {
            "name": "numberOfPeriod",
            "type": "u64"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "eventCloseClaimStatus",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrow",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "rentReceiver",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "eventCloseVestingEscrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrow",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "eventCreateRootEscrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rootEscrow",
            "type": "pubkey"
          },
          {
            "name": "maxClaimAmount",
            "type": "u64"
          },
          {
            "name": "maxEscrow",
            "type": "u64"
          },
          {
            "name": "version",
            "type": "u64"
          },
          {
            "name": "root",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "eventCreateVestingEscrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vestingStartTime",
            "type": "u64"
          },
          {
            "name": "cliffTime",
            "type": "u64"
          },
          {
            "name": "frequency",
            "type": "u64"
          },
          {
            "name": "cliffUnlockAmount",
            "type": "u64"
          },
          {
            "name": "amountPerPeriod",
            "type": "u64"
          },
          {
            "name": "numberOfPeriod",
            "type": "u64"
          },
          {
            "name": "updateRecipientMode",
            "type": "u8"
          },
          {
            "name": "cancelMode",
            "type": "u8"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "escrow",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "eventFundRootEscrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "rootEscrow",
            "type": "pubkey"
          },
          {
            "name": "fundedAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "eventUpdateVestingEscrowRecipient",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrow",
            "type": "pubkey"
          },
          {
            "name": "oldRecipient",
            "type": "pubkey"
          },
          {
            "name": "newRecipient",
            "type": "pubkey"
          },
          {
            "name": "signer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "remainingAccountsInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "slices",
            "type": {
              "vec": {
                "defined": {
                  "name": "remainingAccountsSlice"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "remainingAccountsSlice",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "accountsType",
            "type": {
              "defined": {
                "name": "accountsType"
              }
            }
          },
          {
            "name": "length",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "rootEscrow",
      "serialization": "bytemuck",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint",
            "docs": [
              "token mint"
            ],
            "type": "pubkey"
          },
          {
            "name": "creator",
            "docs": [
              "creator of the escrow"
            ],
            "type": "pubkey"
          },
          {
            "name": "base",
            "docs": [
              "escrow base key"
            ],
            "type": "pubkey"
          },
          {
            "name": "root",
            "docs": [
              "256 bit merkle root"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bump",
            "docs": [
              "bump"
            ],
            "type": "u8"
          },
          {
            "name": "tokenProgramFlag",
            "docs": [
              "token program flag"
            ],
            "type": "u8"
          },
          {
            "name": "padding0",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u8",
                6
              ]
            }
          },
          {
            "name": "maxClaimAmount",
            "docs": [
              "max claim amount"
            ],
            "type": "u64"
          },
          {
            "name": "maxEscrow",
            "docs": [
              "max escrow"
            ],
            "type": "u64"
          },
          {
            "name": "totalFundedAmount",
            "docs": [
              "total funded amount"
            ],
            "type": "u64"
          },
          {
            "name": "totalEscrowCreated",
            "docs": [
              "total escrow created"
            ],
            "type": "u64"
          },
          {
            "name": "totalDistributeAmount",
            "docs": [
              "total distributed amount"
            ],
            "type": "u64"
          },
          {
            "name": "version",
            "docs": [
              "version"
            ],
            "type": "u64"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": "u64"
          },
          {
            "name": "buffer",
            "docs": [
              "buffer"
            ],
            "type": {
              "array": [
                "u128",
                5
              ]
            }
          }
        ]
      }
    },
    {
      "name": "vestingEscrow",
      "serialization": "bytemuck",
      "repr": {
        "kind": "c"
      },
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "recipient",
            "docs": [
              "recipient address"
            ],
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "docs": [
              "token mint"
            ],
            "type": "pubkey"
          },
          {
            "name": "creator",
            "docs": [
              "creator of the escrow"
            ],
            "type": "pubkey"
          },
          {
            "name": "base",
            "docs": [
              "escrow base key"
            ],
            "type": "pubkey"
          },
          {
            "name": "escrowBump",
            "docs": [
              "escrow bump"
            ],
            "type": "u8"
          },
          {
            "name": "updateRecipientMode",
            "docs": [
              "updateRecipientMode"
            ],
            "type": "u8"
          },
          {
            "name": "cancelMode",
            "docs": [
              "cancelMode"
            ],
            "type": "u8"
          },
          {
            "name": "tokenProgramFlag",
            "docs": [
              "token program flag"
            ],
            "type": "u8"
          },
          {
            "name": "padding0",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u8",
                4
              ]
            }
          },
          {
            "name": "cliffTime",
            "docs": [
              "cliff time"
            ],
            "type": "u64"
          },
          {
            "name": "frequency",
            "docs": [
              "frequency"
            ],
            "type": "u64"
          },
          {
            "name": "cliffUnlockAmount",
            "docs": [
              "cliff unlock amount"
            ],
            "type": "u64"
          },
          {
            "name": "amountPerPeriod",
            "docs": [
              "amount per period"
            ],
            "type": "u64"
          },
          {
            "name": "numberOfPeriod",
            "docs": [
              "number of period"
            ],
            "type": "u64"
          },
          {
            "name": "totalClaimedAmount",
            "docs": [
              "total claimed amount"
            ],
            "type": "u64"
          },
          {
            "name": "vestingStartTime",
            "docs": [
              "vesting start time"
            ],
            "type": "u64"
          },
          {
            "name": "cancelledAt",
            "docs": [
              "cancelledAt"
            ],
            "type": "u64"
          },
          {
            "name": "padding1",
            "docs": [
              "buffer"
            ],
            "type": "u64"
          },
          {
            "name": "buffer",
            "docs": [
              "buffer"
            ],
            "type": {
              "array": [
                "u128",
                5
              ]
            }
          }
        ]
      }
    },
    {
      "name": "vestingEscrowMetadata",
      "docs": [
        "Metadata about an escrow."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrow",
            "docs": [
              "The [Escrow]."
            ],
            "type": "pubkey"
          },
          {
            "name": "name",
            "docs": [
              "Name of escrow."
            ],
            "type": "string"
          },
          {
            "name": "description",
            "docs": [
              "Description of escrow."
            ],
            "type": "string"
          },
          {
            "name": "creatorEmail",
            "docs": [
              "Email of creator"
            ],
            "type": "string"
          },
          {
            "name": "recipientEmail",
            "docs": [
              "Email of recipient"
            ],
            "type": "string"
          }
        ]
      }
    }
  ]
};
