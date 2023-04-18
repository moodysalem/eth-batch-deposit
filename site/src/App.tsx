import React, { ChangeEventHandler, useCallback, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useContract, useSigner } from "wagmi";
import { BigNumber } from "ethers";

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
    address: "0xcb72ba0A2ee7d10582EBC8f120435e77399f653f",
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
            disabled={!calldata || !isConnected}
            onClick={callBatchDeposit}
          >
            Send transaction
          </button>
          <hr />
          <ConnectButton />
        </div>
      </div>
    </div>
  );
}

export default App;
