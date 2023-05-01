"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MulticallWrapper = exports.MulticallVersion = void 0;
const debounce_1 = __importDefault(require("lodash/debounce"));
const constants_1 = require("./constants");
const types_1 = require("./types");
const utils_1 = require("./utils");
var MulticallVersion;
(function (MulticallVersion) {
    MulticallVersion["V2"] = "2";
    MulticallVersion["V3"] = "3";
})(MulticallVersion = exports.MulticallVersion || (exports.MulticallVersion = {}));
class MulticallWrapper {
    /**
     * Returns whether a given provider is a multicall-enabled provider.
     * @param provider The provider to check.
     * @returns A boolean indicating whether the given provider is a multicall-enabled provider.
     */
    static isMulticallProvider(provider) {
        if (provider._isMulticallProvider)
            return true;
        return false;
    }
    /**
     * Wraps a given ethers provider to enable automatic call batching.
     * @param provider The underlying provider to use to batch calls.
     * @param delay The delay (in milliseconds) to wait before performing the ongoing batch of calls. Defaults to 16ms.
     * @param maxMulticallDataLength The maximum total calldata length allowed in a multicall batch, to avoid having the RPC backend to revert because of too large (or too long) request. Set to 0 to disable this behavior. Defaults to 200k.
     * @returns The multicall provider, which is a proxy to the given provider, automatically batching any call performed with it.
     */
    static wrap(provider, delay = 16, maxMulticallDataLength = 200_000) {
        if (MulticallWrapper.isMulticallProvider(provider))
            return provider; // Do not overwrap when given provider is already a multicall provider.
        // Overload provider
        Object.defineProperties(provider, {
            _isMulticallProvider: {
                value: true,
                writable: false,
                enumerable: true,
                configurable: false,
            },
            _provider: {
                value: provider,
                writable: false,
                enumerable: true,
                configurable: false,
            },
            maxMulticallDataLength: {
                value: maxMulticallDataLength,
                writable: true,
                enumerable: true,
                configurable: true,
            },
            isMulticallEnabled: {
                value: true,
                writable: true,
                enumerable: true,
                configurable: true,
            },
            multicallDelay: {
                get: function () {
                    return this._multicallDelay;
                },
                set: function (delay) {
                    this._debouncedPerformMulticall?.flush();
                    this._multicallDelay = delay;
                    this._debouncedPerformMulticall = (0, debounce_1.default)(this._performMulticall, delay);
                },
                enumerable: true,
                configurable: false,
            },
        });
        const multicallProvider = provider;
        // Define execution context
        const multicall2 = types_1.Multicall2__factory.connect(constants_1.multicall2Address, provider);
        const multicall3 = types_1.Multicall3__factory.connect(constants_1.multicall3Address, provider);
        let queuedCalls = [];
        multicallProvider._performMulticall = async function () {
            const _queuedCalls = [...queuedCalls];
            if (queuedCalls.length === 0)
                return;
            queuedCalls = [];
            const blockTagCalls = _queuedCalls.reduce((acc, queuedCall) => {
                const blockTag = queuedCall.blockTag.toString();
                return {
                    ...acc,
                    [blockTag]: [queuedCall].concat(acc[blockTag] ?? []),
                };
            }, {});
            await Promise.all(Object.values(blockTagCalls).map(async (blockTagQueuedCalls) => {
                const callStructs = blockTagQueuedCalls.map(({ to, data }) => ({
                    target: to,
                    callData: data,
                }));
                // Split call in parts of max length to avoid too-long requests
                let currentLength = 0;
                const calls = [[]];
                callStructs.forEach((callStruct) => {
                    const newLength = currentLength + callStruct.callData.length;
                    if (this.maxMulticallDataLength > 0 && newLength > this.maxMulticallDataLength) {
                        currentLength = callStruct.callData.length;
                        calls.push([]);
                    }
                    else
                        currentLength = newLength;
                    calls[calls.length - 1].push(callStruct);
                });
                const { blockTag, multicallVersion } = blockTagQueuedCalls[0];
                const multicall = multicallVersion === MulticallVersion.V2 ? multicall2 : multicall3;
                try {
                    const res = (await Promise.all(calls.map((call) => multicall.callStatic.tryAggregate(false, call, { blockTag })))).flat();
                    if (res.length !== callStructs.length)
                        throw new Error(`Unexpected multicall response length: received ${res.length}; expected ${callStructs.length}`);
                    blockTagQueuedCalls.forEach(({ resolve }, i) => {
                        resolve(res[i].returnData);
                    });
                }
                catch (error) {
                    blockTagQueuedCalls.forEach(({ reject }) => {
                        reject(error);
                    });
                }
            }));
        };
        // Overload multicall provider delay
        multicallProvider.multicallDelay = delay;
        // Overload `BaseProvider.perform`
        const _perform = provider.perform.bind(provider);
        multicallProvider.perform = async function (method, params) {
            if (method !== "call" || !this.isMulticallEnabled)
                return _perform(method, params);
            const { transaction: { to, data }, blockTag, } = params;
            const blockNumber = (0, utils_1.getBlockNumber)(blockTag);
            const multicallVersion = (0, utils_1.getMulticallVersion)(blockNumber, this.network.chainId);
            if (!to || !data || multicallVersion == null || constants_1.multicallAddresses.has(to.toLowerCase()))
                return _perform(method, params);
            this._debouncedPerformMulticall();
            return new Promise((resolve, reject) => {
                queuedCalls.push({
                    to,
                    data,
                    blockTag,
                    multicallVersion,
                    resolve,
                    reject,
                });
            });
        };
        return multicallProvider;
    }
}
exports.MulticallWrapper = MulticallWrapper;
exports.default = MulticallWrapper;
