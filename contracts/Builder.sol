// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Builder is Pausable, Ownable {
    event UserJoined(address indexed user);

    mapping(address => bool) public hasJoined;
    uint public totalUsers;
    
    constructor(address initialOwner)
    Ownable(initialOwner)
    {}

    function joinCommunity() public whenNotPaused {
        require(!hasJoined[msg.sender], "User has already joined.");
        hasJoined[msg.sender] = true;
        totalUsers += 1;
        emit UserJoined(msg.sender);
    }

    // Function to get the total number of users
    function getTotalUsers() public view returns (uint) {
        return totalUsers;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
}
