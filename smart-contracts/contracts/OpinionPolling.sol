// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface IReporting {
    // Allows us to verify if the caller is an official authority worker
    function authorizedAuthorities(address account) external view returns (bool);
    // Allows us to verify if a linked ticket actually exists
    function reportCount() external view returns (uint256);
}

contract OpinionPolling {
    using ECDSA for bytes32;

    // ─── Structs ─────────────────────────────────────────────────────────────
    struct Poll {
        uint256 id;
        address creator;
        bytes32 contentHash;
        uint256 deadline;
        uint256 ticketId;
        bool isActive;
    }

    // ─── State Variables ─────────────────────────────────────────────────────
    IReporting public immutable reportingContract;
    address public immutable aiOracleAddress;
    
    // EIP-712 Domain Separator and TypeHash
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant APPROVAL_TYPEHASH = keccak256(
        "OfficialPollApproval(bytes32 contentHash,uint256 deadline,uint256 ticketId)"
    );

    uint256 public pollCount;
    
    // Core Data Stores
    mapping(uint256 => Poll) public polls;
    // pollId => optionIndex => voteCount
    mapping(uint256 => mapping(uint256 => uint256)) public pollResults;
    // pollId => citizenWalletAddress => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // ─── Events ──────────────────────────────────────────────────────────────
    event PollCreated(uint256 indexed pollId, address indexed creator, bytes32 contentHash, uint256 deadline, uint256 ticketId);
    event VoteCast(uint256 indexed pollId, address indexed voter, uint256 optionIndex);

    // ─── Custom Errors ───────────────────────────────────────────────────────
    error UnauthorizedAuthority();
    error InvalidTicketId();
    error InvalidOracleSignature();
    error PollInactiveOrClosed();
    error AlreadyVoted();
    error InvalidDeadline();

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(address _reportingContract, address _aiOracleAddress) {
        require(_reportingContract != address(0), "Invalid reporting contract");
        require(_aiOracleAddress != address(0), "Invalid oracle address");

        reportingContract = IReporting(_reportingContract);
        aiOracleAddress = _aiOracleAddress;

        // EIP-712 Initialization
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("OpinionPolling")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    // ─── Core Functions ──────────────────────────────────────────────────────

    /**
     * @notice Creates a new official government poll. Requires a cryptographic signature 
     * from the off-chain AI moderation oracle.
     * @param contentHash The IPFS CID hash of the poll details.
     * @param deadline The unix timestamp when voting closes.
     * @param ticketId The associated civic issue ID (0 if standalone).
     * @param oracleSignature The EIP-712 signature provided by the backend AI Oracle.
     */
    function createOfficialPoll(
        bytes32 contentHash,
        uint256 deadline,
        uint256 ticketId,
        bytes calldata oracleSignature
    ) external returns (uint256) {
        // 1. Verify Authority Status via Reporting.sol
        if (!reportingContract.authorizedAuthorities(msg.sender)) {
            revert UnauthorizedAuthority();
        }

        // 2. Validate Parameters
        if (deadline <= block.timestamp) {
            revert InvalidDeadline();
        }
        if (ticketId > 0 && ticketId > reportingContract.reportCount()) {
            revert InvalidTicketId();
        }

        // 3. Reconstruct EIP-712 Digest & Verify AI Oracle Signature
        bytes32 structHash = keccak256(
            abi.encode(APPROVAL_TYPEHASH, contentHash, deadline, ticketId)
        );
        bytes32 digest = MessageHashUtils.toTypedDataHash(DOMAIN_SEPARATOR, structHash);
        
        address recoveredSigner = ECDSA.recover(digest, oracleSignature);
        if (recoveredSigner != aiOracleAddress) {
            revert InvalidOracleSignature();
        }

        // 4. Store Poll State
        pollCount++;
        uint256 newPollId = pollCount;

        polls[newPollId] = Poll({
            id: newPollId,
            creator: msg.sender,
            contentHash: contentHash,
            deadline: deadline,
            ticketId: ticketId,
            isActive: true
        });                                                       

        emit PollCreated(newPollId, msg.sender, contentHash, deadline, ticketId);
        
        return newPollId;
    }

    /**
     * @notice Casts a transparent, public-ledger vote on an active poll.
     * @param pollId The ID of the poll.
     * @param optionIndex The index of the selected option (e.g., 0 for Yes, 1 for No).
     */
    function castVote(uint256 pollId, uint256 optionIndex) external {
        Poll storage poll = polls[pollId];

        // 1. Verify Poll Status and Deadline
        if (!poll.isActive || block.timestamp >= poll.deadline) {
            revert PollInactiveOrClosed();
        }

        // 2. Enforce One-Vote-Per-Address
        if (hasVoted[pollId][msg.sender]) {
            revert AlreadyVoted();
        }

        // 3. Record Vote
        hasVoted[pollId][msg.sender] = true;
        pollResults[pollId][optionIndex]++;

        emit VoteCast(pollId, msg.sender, optionIndex);
    }

    // ─── Query / View Functions ──────────────────────────────────────────────

    /**
     * @notice Fetches the current vote tally for a specific option in a poll.
     */
    function getOptionResult(uint256 pollId, uint256 optionIndex) external view returns (uint256) {
        return pollResults[pollId][optionIndex];
    }
}