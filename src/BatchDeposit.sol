// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IDepositContract} from "./IDepositContract.sol";

contract BatchDeposit {
    IDepositContract public constant DEPOSIT_CONTRACT =
        IDepositContract(0x00000000219ab540356cBB839Cbe05303d7705Fa);

    uint32 public constant PUBKEY_LENGTH = 48;
    uint32 public constant SIGNATURE_LENGTH = 96;
    uint32 public constant CREDENTIALS_LENGTH = 32;
    uint8 public constant MAX_VALIDATORS = 100;
    uint256 public constant DEPOSIT_AMOUNT = 32 ether;

    /**
     * @dev Performs a batch deposit
     */
    function batchDeposit(
        bytes calldata pubkeys,
        bytes calldata withdrawal_credentials,
        bytes calldata signatures,
        bytes32[] calldata deposit_data_roots
    ) external payable {
        // sanity checks
        require(msg.value >= DEPOSIT_AMOUNT, "BatchDeposit: Amount is too low");

        require(
            pubkeys.length >= PUBKEY_LENGTH,
            "BatchDeposit: You should deposit at least one validator"
        );

        require(
            pubkeys.length % PUBKEY_LENGTH == 0,
            "BatchDeposit: Invalid pubkey length"
        );
        require(
            pubkeys.length <= PUBKEY_LENGTH * MAX_VALIDATORS,
            "BatchDeposit: You can deposit max 100 validators at a time"
        );

        require(
            signatures.length >= SIGNATURE_LENGTH,
            "DepositContract: Invalid signature length"
        );

        require(
            signatures.length % SIGNATURE_LENGTH == 0,
            "BatchDeposit: Invalid signature length mod"
        );

        require(
            withdrawal_credentials.length >= CREDENTIALS_LENGTH,
            "BatchDeposit: Invalid withdrawal_credentials length"
        );

        require(
            withdrawal_credentials.length % CREDENTIALS_LENGTH == 0,
            "BatchDeposit: Invalid withdrawal_credentials length mod"
        );

        uint32 pubkeyCount = uint32(pubkeys.length / PUBKEY_LENGTH);
        require(
            pubkeyCount == signatures.length / SIGNATURE_LENGTH &&
                pubkeyCount == withdrawal_credentials / CREDENTIALS_LENGTH &&
                pubkeyCount == deposit_data_roots.length,
            "BatchDeposit: Data counts don't match"
        );

        uint256 expectedAmount = DEPOSIT_AMOUNT * pubkeyCount;
        require(
            msg.value == expectedAmount,
            "BatchDeposit: Amount is not aligned with pubkeys number"
        );

        for (uint32 i = 0; i < pubkeyCount; ++i) {
            bytes memory pubkey = bytes(
                pubkeys[i * PUBKEY_LENGTH:(i + 1) * PUBKEY_LENGTH]
            );
            bytes memory signature = bytes(
                signatures[i * SIGNATURE_LENGTH:(i + 1) * SIGNATURE_LENGTH]
            );
            bytes memory credential = bytes(
                withdrawal_credentials[i * CREDENTIALS_LENGTH:(i + 1) *
                    CREDENTIALS_LENGTH]
            );

            DEPOSIT_CONTRACT.deposit{value: DEPOSIT_AMOUNT}(
                pubkey,
                credential,
                signature,
                deposit_data_roots[i]
            );
        }
    }
}
