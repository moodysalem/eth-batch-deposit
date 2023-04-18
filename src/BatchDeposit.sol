// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IDepositContract} from "./IDepositContract.sol";

contract BatchDeposit {
    IDepositContract private constant DEPOSIT_CONTRACT =
        IDepositContract(0x00000000219ab540356cBB839Cbe05303d7705Fa);

    uint32 private constant PUBKEY_LENGTH = 48;
    uint32 private constant SIGNATURE_LENGTH = 96;
    uint32 private constant CREDENTIALS_LENGTH = 32;
    uint8 private constant MAX_VALIDATORS = 100;
    uint256 private constant DEPOSIT_AMOUNT = 32 ether;

    error AmountTooLow();
    error AtLeastOneValidator();
    error InvalidPubKeyLength();
    error MaxValidatorsExceeded();
    error InvalidSignatureLength();
    error InvalidWithdrawalCredentialsLength();
    error CountsDoNotMatch();
    error InvaligMessageValue();

    /**
     * @dev Performs a batch deposit
     */
    function batchDeposit(
        bytes calldata pubkeys,
        bytes calldata withdrawal_credentials,
        bytes calldata signatures,
        bytes32[] calldata deposit_data_roots
    ) external payable {
        unchecked {
            // sanity checks
            if (msg.value < DEPOSIT_AMOUNT) revert AmountTooLow();

            if (pubkeys.length < PUBKEY_LENGTH) revert AtLeastOneValidator();

            if (pubkeys.length % PUBKEY_LENGTH != 0)
                revert InvalidPubKeyLength();
            if (pubkeys.length > PUBKEY_LENGTH * MAX_VALIDATORS)
                revert MaxValidatorsExceeded();

            if (signatures.length < SIGNATURE_LENGTH)
                revert InvalidSignatureLength();

            if (signatures.length % SIGNATURE_LENGTH != 0)
                revert InvalidSignatureLength();

            if (withdrawal_credentials.length < CREDENTIALS_LENGTH)
                revert InvalidWithdrawalCredentialsLength();

            if (withdrawal_credentials.length % CREDENTIALS_LENGTH != 0)
                revert InvalidWithdrawalCredentialsLength();

            uint32 pubkeyCount = uint32(pubkeys.length / PUBKEY_LENGTH);
            if (
                pubkeyCount != signatures.length / SIGNATURE_LENGTH ||
                pubkeyCount !=
                withdrawal_credentials.length / CREDENTIALS_LENGTH ||
                pubkeyCount != deposit_data_roots.length
            ) revert CountsDoNotMatch();

            uint256 expectedAmount = DEPOSIT_AMOUNT * pubkeyCount;
            if (msg.value != expectedAmount) revert InvaligMessageValue();

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
}
