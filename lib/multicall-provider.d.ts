import { BytesLike } from "ethers/lib/utils";
import { DebouncedFunc } from "lodash";
import { BaseProvider, BlockTag } from "@ethersproject/providers";
export declare enum MulticallVersion {
    V2 = "2",
    V3 = "3"
}
export interface ContractCall {
    to: string;
    data: BytesLike;
    blockTag: BlockTag;
    multicallVersion: MulticallVersion;
    resolve: (value: string | PromiseLike<string>) => void;
    reject: (reason?: any) => void;
}
export type MulticallProvider<T extends BaseProvider = BaseProvider> = T & {
    readonly _isMulticallProvider: boolean;
    _multicallDelay: number;
    multicallDelay: number;
    maxMulticallDataLength: number;
    isMulticallEnabled: boolean;
    _performMulticall: () => Promise<void>;
    _debouncedPerformMulticall: DebouncedFunc<() => Promise<void>>;
};
export declare class MulticallWrapper {
    /**
     * Returns whether a given provider is a multicall-enabled provider.
     * @param provider The provider to check.
     * @returns A boolean indicating whether the given provider is a multicall-enabled provider.
     */
    static isMulticallProvider<T extends BaseProvider>(provider: T): provider is MulticallProvider<T>;
    /**
     * Wraps a given ethers provider to enable automatic call batching.
     * @param provider The underlying provider to use to batch calls.
     * @param delay The delay (in milliseconds) to wait before performing the ongoing batch of calls. Defaults to 16ms.
     * @param maxMulticallDataLength The maximum total calldata length allowed in a multicall batch, to avoid having the RPC backend to revert because of too large (or too long) request. Set to 0 to disable this behavior. Defaults to 200k.
     * @returns The multicall provider, which is a proxy to the given provider, automatically batching any call performed with it.
     */
    static wrap<T extends BaseProvider>(provider: T, delay?: number, maxMulticallDataLength?: number): MulticallProvider<T>;
}
export default MulticallWrapper;
