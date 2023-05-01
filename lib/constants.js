"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multicall2DeploymentBlockNumbers = exports.multicall3DeploymentBlockNumbers = exports.multicallAddresses = exports.multicall3Address = exports.multicall2Address = void 0;
// same address on all networks: https://github.com/mds1/multicall#multicall2-contract-addresses
exports.multicall2Address = "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696";
// same address on all networks: https://github.com/mds1/multicall#multicall3-contract-addresses
exports.multicall3Address = "0xcA11bde05977b3631167028862bE2a173976CA11";
exports.multicallAddresses = new Set([
    exports.multicall2Address.toLowerCase(),
    exports.multicall3Address.toLowerCase(),
]);
exports.multicall3DeploymentBlockNumbers = {
    1: 14353601,
    3: 12063863,
    4: 10299530,
    5: 6507670,
    42: 30285908,
    11155111: 751532,
    10: 4286263,
    420: 49461,
    42161: 7654707,
    42170: 1746963,
    421613: 88114,
    421611: 88114,
    137: 25770160,
    80001: 25444704,
    1101: 57746,
    100: 21022491,
    43114: 11907934,
    43113: 7096959,
    250: 33001987,
    4002: 8328688,
    56: 15921452,
    97: 17422483,
    1284: 609002,
    1285: 1597904,
    1287: 1850686,
    1666600000: 24185753,
    25: 1963112,
    122: 16146628,
    14: 3002461, // Flare
};
exports.multicall2DeploymentBlockNumbers = {
    1: 12336033,
    3: 9894101,
    4: 8283206,
    5: 4489716,
    42: 24025820, // Kovan
};
