import React, { ChangeEventHandler, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const { ContainerType } = require("@chainsafe/ssz");

// Define the DepositData type
const DepositDataType = new ContainerType({
  fields: {
    pubkey: "bytes48",
    withdrawal_credentials: "bytes32",
    amount: "uint64",
    signature: "bytes96",
  },
});

// Compute the deposit_data_root
function toUint8Array(hexString: string): Uint8Array {
  return new Uint8Array(hexString.match(/../g)!.map((h) => parseInt(h, 16)));
}

// Compute the deposit_data_root
function toHexString(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

async function computeDepositDataRoot(depositData: {
  pubkey: Uint8Array;
  withdrawal_credentials: Uint8Array;
  amount: BigInt;
  signature: Uint8Array;
}): Promise<string> {
  const encodedDepositData = DepositDataType.serialize(depositData);
  return toHexString(await crypto.subtle.digest("SHA-256", encodedDepositData));
}

function App() {
  const processFiles: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const fr = new FileReader();
      fr.addEventListener("load", () => {
        const parsed = JSON.parse(fr.result!.toString());

        const data = (parsed as any).map(
          ({ pubkey, withdrawal_credentials, amount, signature }: any) => ({
            pubkey: toUint8Array(pubkey),
            withdrawal_credentials: toUint8Array(withdrawal_credentials),
            amount: BigInt(amount), // 32 ETH
            signature: toUint8Array(signature),
          })
        );
        const roots = data.map(computeDepositDataRoot);

        console.log(roots);
      });
      fr.readAsText(e.target.files![0]);
    },
    []
  );

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

      <ConnectButton />
    </div>
  );
}

export default App;
