// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Reporting is AccessControl {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant AUTHORITY_ROLE = keccak256("AUTHORITY_ROLE");

    // The 8 states of our civic issue lifecycle
    enum ReportStatus {
        Pending_Validation,       // 0
        Community_Rejected,       // 1 (Terminal)
        Open,                     // 2
        In_Progress,              // 3 (New: Authority actively working)
        Pending_Rejection_Review, // 4
        Pending_Verification,     // 5
        Closed,                   // 6 (Terminal)
        Reopened                  // 7
    }

    struct Report {
        uint256 id;
        string description;          // AI-approved text description
        string ipfsCID;              // IPFS CID for images
        bytes32 submissionNullifier;
        uint256 createdAt;
        uint256 expiresAt;
        address actionedBy;          // Last authority to take action
        
        // --- GAS OPTIMIZED SLOT ---
        // All variables below pack perfectly into a single 32-byte EVM storage slot
        address submitter;           // 20 bytes: Citizen's public key
        ReportStatus status;         // 1 byte: Current FSM state
        uint8 reopenCount;           // 1 byte: Max 255 reopens
        uint16 voteNonce;            // 2 bytes: Increments when votes reset, tracks voting rounds
        uint16 votesFor;             // 2 bytes: Max 65,535 votes
        uint16 votesAgainst;         // 2 bytes: Max 65,535 votes
        // --------------------------
    }

    uint256 public nextReportId;
    mapping(uint256 => Report) public reports;
    mapping(bytes32 => bool) public submissionNullifiers;
    
    // Sybil resistance: reportId => voteNonce => votingNullifier => hasVoted
    mapping(uint256 => mapping(uint16 => mapping(bytes32 => bool))) public reportVotes;
    
    // Traceability: Maps a citizen's public key to their report IDs
    mapping(address => uint256[]) public citizenReports;

    address public constant AUTOMATIC_TRANSITION = address(0); 

    // Hardcoded thresholds for community consensus
    uint16 public constant VALIDATION_THRESHOLD = 3;
    uint16 public constant REJECTION_THRESHOLD = 3;
    uint16 public constant VERIFICATION_THRESHOLD = 3;
    uint16 public constant REOPEN_THRESHOLD = 3;
    uint16 public constant APPEAL_THRESHOLD = 3;
    uint16 public constant UPHOLD_REJECTION_THRESHOLD = 3;
    
    uint8 public constant REOPEN_LIMIT = 3; 
    uint256 public constant EXPIRATION_TIMEOUT = 7 days; 

    event ReportCreated(uint256 indexed reportId, address indexed submitter, string ipfsCID, uint256 timestamp);
    event StatusChanged(uint256 indexed reportId, ReportStatus oldStatus, ReportStatus newStatus, address indexed changedBy);
    event VoteCast(uint256 indexed reportId, bool voteDirection, ReportStatus currentStatus);

    constructor(address _relayer, address _govNode, address _ngoNode, address _intlNode) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, _relayer);
        _grantRole(AUTHORITY_ROLE, _govNode);
        _grantRole(AUTHORITY_ROLE, _ngoNode);
        _grantRole(AUTHORITY_ROLE, _intlNode);
    }

    // --------------------------------------------------------
    // CITIZEN ACTION (Submitted via Relayer)
    // --------------------------------------------------------
    
    function createReport(
        string memory _description, 
        string memory _ipfsCID, 
        bytes32 _submissionNullifier,
        address _submitter
    ) external onlyRole(RELAYER_ROLE) {
        require(!submissionNullifiers[_submissionNullifier], "Report already submitted by this ticket");

        submissionNullifiers[_submissionNullifier] = true;
        uint256 reportId = nextReportId++;
        
        reports[reportId] = Report({
            id: reportId,
            description: _description,
            ipfsCID: _ipfsCID,
            submissionNullifier: _submissionNullifier,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + EXPIRATION_TIMEOUT,
            actionedBy: address(0),
            submitter: _submitter,
            status: ReportStatus.Pending_Validation,
            reopenCount: 0,
            voteNonce: 0,
            votesFor: 0,
            votesAgainst: 0
        });

        // Store relation for easy frontend querying
        citizenReports[_submitter].push(reportId);

        emit ReportCreated(reportId, _submitter, _ipfsCID, block.timestamp);
    }

    function voteOnReport(uint256 _reportId, bool _voteDirection, bytes32 _votingNullifier) external onlyRole(RELAYER_ROLE) {
        Report storage report = reports[_reportId];
        
        require(report.createdAt != 0, "Report does not exist");
        require(block.timestamp <= report.expiresAt, "Report expired");
        require(!reportVotes[_reportId][report.voteNonce][_votingNullifier], "Citizen already voted in this round");
        
        reportVotes[_reportId][report.voteNonce][_votingNullifier] = true;

        if (report.status == ReportStatus.Pending_Validation) {
            _processValidationVote(report, _voteDirection);
        } else if (report.status == ReportStatus.Pending_Rejection_Review) {
            _processRejectionReviewVote(report, _voteDirection);
        } else if (report.status == ReportStatus.Pending_Verification) {
            _processVerificationVote(report, _voteDirection);
        } else {
            revert("Report not in a voting state");
        }

        emit VoteCast(_reportId, _voteDirection, report.status);
    }

    // --------------------------------------------------------
    // AUTHORITY ACTIONS
    // --------------------------------------------------------
    
    function startWork(uint256 _reportId) external onlyRole(AUTHORITY_ROLE) {
        Report storage report = reports[_reportId];
        require(
            report.status == ReportStatus.Open || report.status == ReportStatus.Reopened, 
            "Must be Open or Reopened to start work"
        );

        ReportStatus oldStatus = report.status;
        report.status = ReportStatus.In_Progress;
        report.actionedBy = msg.sender;

        emit StatusChanged(_reportId, oldStatus, ReportStatus.In_Progress, msg.sender);
    }

    function markAsSolved(uint256 _reportId) external onlyRole(AUTHORITY_ROLE) {
        Report storage report = reports[_reportId];
        require(report.status == ReportStatus.In_Progress, "Must be In Progress to mark solved");

        ReportStatus oldStatus = report.status;
        report.status = ReportStatus.Pending_Verification;
        report.actionedBy = msg.sender;
        
        // Reset votes and increment nonce for the new verification phase
        report.votesFor = 0;      
        report.votesAgainst = 0;
        report.voteNonce++;

        emit StatusChanged(_reportId, oldStatus, ReportStatus.Pending_Verification, msg.sender);
    }

    function rejectIssue(uint256 _reportId) external onlyRole(AUTHORITY_ROLE) {
        Report storage report = reports[_reportId];
        require(
            report.status == ReportStatus.Open || report.status == ReportStatus.In_Progress, 
            "Must be Open or In Progress to reject"
        );

        ReportStatus oldStatus = report.status;
        report.status = ReportStatus.Pending_Rejection_Review;
        report.actionedBy = msg.sender;
        
        // Reset votes and increment nonce for the community appeal phase
        report.votesFor = 0;      
        report.votesAgainst = 0;
        report.voteNonce++;

        emit StatusChanged(_reportId, oldStatus, ReportStatus.Pending_Rejection_Review, msg.sender);
    }

    // --------------------------------------------------------
    // INTERNAL STATE MACHINE LOGIC
    // --------------------------------------------------------
    
    function _changeStatus(Report storage report, ReportStatus newStatus) internal {
        ReportStatus oldStatus = report.status;
        report.status = newStatus;
        emit StatusChanged(report.id, oldStatus, newStatus, AUTOMATIC_TRANSITION);
    }
    
    function _processValidationVote(Report storage report, bool _voteDirection) internal {
        if (_voteDirection) { 
            report.votesFor++;
            if (report.votesFor >= VALIDATION_THRESHOLD) _changeStatus(report, ReportStatus.Open);
        } else {              
            report.votesAgainst++;
            if (report.votesAgainst >= REJECTION_THRESHOLD) _changeStatus(report, ReportStatus.Community_Rejected);
        }
    }

    function _processRejectionReviewVote(Report storage report, bool _voteDirection) internal {
        if (_voteDirection) { 
            report.votesFor++;
            if (report.votesFor >= UPHOLD_REJECTION_THRESHOLD) _changeStatus(report, ReportStatus.Closed);
        } else {              
            report.votesAgainst++;
            if (report.votesAgainst >= APPEAL_THRESHOLD) _changeStatus(report, ReportStatus.Open);
        }
    }

    function _processVerificationVote(Report storage report, bool _voteDirection) internal {
        if (_voteDirection) { 
            report.votesFor++;
            if (report.votesFor >= VERIFICATION_THRESHOLD) _changeStatus(report, ReportStatus.Closed);
        } else {              
            report.votesAgainst++;
            if (report.votesAgainst >= REOPEN_THRESHOLD) {
                report.reopenCount++;
                
                if (report.reopenCount >= REOPEN_LIMIT) {
                    _changeStatus(report, ReportStatus.Closed);
                } else {
                    _changeStatus(report, ReportStatus.Reopened);
                }
            }
        }
    }

    // --------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------

    function getCitizenReports(address _citizen) external view returns (uint256[] memory) {
        return citizenReports[_citizen];
    }
}