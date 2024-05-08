// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";

contract FrancisGovernor is Governor, GovernorCountingSimple, GovernorVotes {
    constructor(IVotes _token) Governor("FrancisGovernor") GovernorVotes(_token) {}

    function votingDelay() public pure override returns (uint256) {
        return 0; // 1 second
    }

    function votingPeriod() public pure override returns (uint256) {
        return 7200; // 1 day
    }

    function quorum(uint256 blockNumber) public pure override returns (uint256) {
        return 1e18;
    }
}
