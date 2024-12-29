import { Idl } from "@project-serum/anchor";

export const IDL: Idl = {
  version: "0.1.0",
  name: "minter",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "tipAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tipper",
          isMut: true,
          isSigner: true,
        },
        {
          name: "creator",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "sendTip",
      accounts: [
        {
          name: "tipAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tipper",
          isMut: true,
          isSigner: true,
        },
        {
          name: "creator",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "amount",
          type: "u64",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "TipAccount",
      type: {
        kind: "struct",
        fields: [
          {
            name: "tipper",
            type: "publicKey",
          },
          {
            name: "creator",
            type: "publicKey",
          },
          {
            name: "totalTips",
            type: "u64",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "InvalidTipper",
      msg: "The tipper in the tip account does not match the provided tipper",
    },
    {
      code: 6001,
      name: "CannotTipSelf",
      msg: "You cannot tip yourself",
    },
    {
      code: 6002,
      name: "InvalidAmount",
      msg: "The tip amount must be greater than 0",
    },
    {
      code: 6003,
      name: "OverflowError",
      msg: "Arithmetic overflow when adding tip amount",
    },
  ],
  metadata: {
    address: "8ubPzisSkpZ7NMcgK72MZUYfx4XcTL9wh9QaBtanGpLP",
  },
};
