import React, { ChangeEventHandler, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { ContainerType, fromHexString, toHexString } from "@chainsafe/ssz";
import {
  ByteVectorType,
  UintNumberType,
  UintBigintType,
  BooleanType,
} from "@chainsafe/ssz";

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
}): Promise<string> {
  const encodedDepositData = DepositData.serialize({
    pubkey: depositData.pubkey,
    amount: depositData.amount,
    signature: depositData.signature,
    withdrawalCredentials: depositData.withdrawal_credentials,
  });
  const result = await crypto.subtle.digest("SHA-256", encodedDepositData);

  return toHexString([...new Uint8Array(result)]);
}

function App() {
  const processFiles: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const fr = new FileReader();
      fr.addEventListener("load", async () => {
        const parsed = JSON.parse(fr.result!.toString());

        const data = (parsed as any).map(
          ({ pubkey, withdrawal_credentials, amount, signature }: any) => ({
            pubkey: fromHexString(pubkey),
            withdrawal_credentials: fromHexString(withdrawal_credentials),
            amount: BigInt(amount), // 32 ETH
            signature: fromHexString(signature),
          })
        );
        const roots = await Promise.all(data.map(computeDepositDataRoot));
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
