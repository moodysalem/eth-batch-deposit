import React, { ChangeEventHandler, useCallback, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  useSigner,
} from "wagmi";
import { BigNumber } from "ethers";

const BATCH_DEPOSIT_ABI = [
  {
    inputs: [],
    name: "AmountTooLow",
    type: "error",
  },
  {
    inputs: [],
    name: "AtLeastOneValidator",
    type: "error",
  },
  {
    inputs: [],
    name: "CountsDoNotMatch",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidPubKeyLength",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSignatureLength",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidWithdrawalCredentialsLength",
    type: "error",
  },
  {
    inputs: [],
    name: "InvaligMessageValue",
    type: "error",
  },
  {
    inputs: [],
    name: "MaxValidatorsExceeded",
    type: "error",
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
];
const BATCH_DEPOSIT_ADDRESS = "0xcb72ba0A2ee7d10582EBC8f120435e77399f653f";

interface BatchDepositCallData {
  pubkeys: `0x${string}`;
  withdrawal_credentials: `0x${string}`;
  signatures: `0x${string}`;
  deposit_data_roots: `0x${string}`[];
}

type DepositDataJson = Array<{
  pubkey: string;
  withdrawal_credentials: string;
  amount: number;
  signature: string;
  deposit_data_root: string;
}>;

function App() {
  const { isConnected } = useAccount();
  const [calldata, setCalldata] = useState<BatchDepositCallData | null>(null);

  const processFiles: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const fr = new FileReader();
      fr.addEventListener("load", async () => {
        const parsed = JSON.parse(fr.result!.toString()) as DepositDataJson;

        setCalldata({
          deposit_data_roots: parsed.map(
            (p): `0x${string}` => `0x${p.deposit_data_root}`
          ),
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

  const { data: signer } = useSigner({ chainId: 1 });

  const { config, error: prepareError } = usePrepareContractWrite({
    abi: BATCH_DEPOSIT_ABI,
    address: BATCH_DEPOSIT_ADDRESS,
    functionName: "batchDeposit",
    chainId: 1,
    signer,
    enabled: !!signer && !!calldata,
    args: calldata
      ? [
          calldata.pubkeys,
          calldata.withdrawal_credentials,
          calldata.signatures,
          calldata.deposit_data_roots,
        ]
      : undefined,
    overrides: calldata
      ? {
          value: BigNumber.from(32)
            .mul(BigNumber.from(10).pow(18))
            .mul(calldata.deposit_data_roots.length),
        }
      : {},
  });

  const {
    write: batchDeposit,
    data: transaction,
    isLoading,
    isIdle,
  } = useContractWrite(config);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div style={{ maxWidth: 600, padding: 12 }}>
        <h1>Batch deposit tool</h1>
        <label>
          <h5>1. Select deposit data file</h5>
          <input
            type="file"
            multiple={false}
            onChange={processFiles}
            accept={".json"}
          />
        </label>

        <div>
          <h5>2. Execute the batch deposit</h5>
          <button
            disabled={!calldata || !isConnected || !isIdle || !!prepareError}
            onClick={batchDeposit}
          >
            {isLoading ? "Loading..." : "Send batch deposit"}
          </button>

          <div>{prepareError?.message}</div>
          <hr />

          <ConnectButton showBalance={false} />
        </div>
      </div>
    </div>
  );
}

export default App;
