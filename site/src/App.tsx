import React, { ChangeEventHandler, useCallback, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import {
  ByteVectorType,
  ContainerType,
  fromHexString,
  toHexString,
  UintBigintType,
} from "@chainsafe/ssz";
import { useContract, useSigner } from "wagmi";
import { BigNumber } from "ethers";

export const Bytes32 = new ByteVectorType(32);
export const Bytes48 = new ByteVectorType(48);
export const Bytes96 = new ByteVectorType(96);
export const UintBn64 = new UintBigintType(8);
export const BLSPubkey = Bytes48;

export const BLSSignature = Bytes96;

export const DepositData = new ContainerType(
  {
    pubkey: BLSPubkey,
    withdrawalCredentials: Bytes32,
    amount: UintBn64,
    signature: BLSSignature,
  },
  { typeName: "DepositData", jsonCase: "eth2" }
);

async function computeDepositDataRoot(depositData: {
  pubkey: Uint8Array;
  withdrawal_credentials: Uint8Array;
  amount: bigint;
  signature: Uint8Array;
}): Promise<`0x${string}`> {
  const encodedDepositData = DepositData.serialize({
    pubkey: depositData.pubkey,
    amount: depositData.amount,
    signature: depositData.signature,
    withdrawalCredentials: depositData.withdrawal_credentials,
  });
  const result = await crypto.subtle.digest("SHA-256", encodedDepositData);

  return toHexString([...new Uint8Array(result)]) as `0x${string}`;
}

function useBatchDepositContract() {
  const { data: signer } = useSigner({ chainId: 1 });
  return useContract({
    signerOrProvider: signer,
    abi: [
      {
        inputs: [],
        name: "CREDENTIALS_LENGTH",
        outputs: [
          {
            internalType: "uint32",
            name: "",
            type: "uint32",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "DEPOSIT_AMOUNT",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "DEPOSIT_CONTRACT",
        outputs: [
          {
            internalType: "contract IDepositContract",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "MAX_VALIDATORS",
        outputs: [
          {
            internalType: "uint8",
            name: "",
            type: "uint8",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "PUBKEY_LENGTH",
        outputs: [
          {
            internalType: "uint32",
            name: "",
            type: "uint32",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "SIGNATURE_LENGTH",
        outputs: [
          {
            internalType: "uint32",
            name: "",
            type: "uint32",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "pubkeys",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "withdrawal_credentials",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "signatures",
            type: "bytes",
          },
          {
            internalType: "bytes32[]",
            name: "deposit_data_roots",
            type: "bytes32[]",
          },
        ],
        name: "batchDeposit",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
    ],
    address: "0x4e59b44847b379578588920ca78fbf26c0b4956c",
  });
}

interface BatchDepositCallData {
  pubkeys: `0x${string}`;
  withdrawal_credentials: `0x${string}`;
  signatures: `0x${string}`;
  deposit_data_roots: `0x${string}`[];
}

type DepositDataJson = Array<{
  pubkey: string;
  withdrawal_credentials: string;
  amount: string;
  signature: string;
}>;

function App() {
  const [calldata, setCalldata] = useState<BatchDepositCallData | null>(null);

  const processFiles: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const fr = new FileReader();
      fr.addEventListener("load", async () => {
        const parsed = JSON.parse(fr.result!.toString()) as DepositDataJson;

        const deposit_data_roots: `0x${string}`[] = await Promise.all(
          parsed.map(({ pubkey, withdrawal_credentials, amount, signature }) =>
            computeDepositDataRoot({
              pubkey: fromHexString(pubkey),
              withdrawal_credentials: fromHexString(withdrawal_credentials),
              amount: BigInt(amount), // 32 ETH
              signature: fromHexString(signature),
            })
          )
        );

        setCalldata({
          deposit_data_roots,
          signatures: `0x${parsed.map((p) => p.signature).join("")}`,
          pubkeys: `0x${parsed.map((p) => p.pubkey).join("")}`,
          withdrawal_credentials: `0x${parsed
            .map((p) => p.withdrawal_credentials)
            .join("")}`,
        });
      });
      fr.readAsText(e.target.files![0]);
    },
    [setCalldata]
  );

  const batchDepositContract = useBatchDepositContract();

  const callBatchDeposit = useCallback(async () => {
    if (!calldata) throw new Error("Missing calldata");
    if (!batchDepositContract)
      throw new Error("Missing batch deposit contract");

    console.log(calldata);

    const result = await batchDepositContract.batchDeposit(
      calldata.pubkeys,
      calldata.withdrawal_credentials,
      calldata.signatures,
      calldata.deposit_data_roots,
      {
        value: BigNumber.from(32)
          .mul(BigNumber.from(10).pow(18))
          .mul(calldata.deposit_data_roots.length),
      }
    );
    console.log(result.hash);
  }, [batchDepositContract, calldata]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <label>
        Select deposit data file
        <input
          type="file"
          multiple={false}
          onChange={processFiles}
          accept={".json"}
        />
      </label>

      <button onClick={callBatchDeposit}>Do batch deposit</button>

      <ConnectButton />
    </div>
  );
}

export default App;
