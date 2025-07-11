import { R as RedisOptions, a as RequesterConfig, b as Redis$1 } from './zmscore-uDFFyCiZ.mjs';
export { A as AppendCommand, B as BitCountCommand, f as BitOpCommand, g as BitPosCommand, C as CopyCommand, D as DBSizeCommand, i as DecrByCommand, h as DecrCommand, j as DelCommand, E as EchoCommand, k as EvalCommand, l as EvalshaCommand, m as ExistsCommand, o as ExpireAtCommand, n as ExpireCommand, F as FlushAllCommand, p as FlushDBCommand, G as GeoAddCommand, q as GeoAddCommandOptions, s as GeoDistCommand, t as GeoHashCommand, r as GeoMember, u as GeoPosCommand, v as GeoSearchCommand, w as GeoSearchStoreCommand, y as GetBitCommand, x as GetCommand, z as GetDelCommand, H as GetRangeCommand, I as GetSetCommand, J as HDelCommand, K as HExistsCommand, M as HGetAllCommand, L as HGetCommand, N as HIncrByCommand, O as HIncrByFloatCommand, Q as HKeysCommand, S as HLenCommand, T as HMGetCommand, V as HMSetCommand, W as HRandFieldCommand, X as HScanCommand, Y as HSetCommand, Z as HSetNXCommand, _ as HStrLenCommand, $ as HValsCommand, a1 as IncrByCommand, a2 as IncrByFloatCommand, a0 as IncrCommand, a3 as JsonArrAppendCommand, a4 as JsonArrIndexCommand, a5 as JsonArrInsertCommand, a6 as JsonArrLenCommand, a7 as JsonArrPopCommand, a8 as JsonArrTrimCommand, a9 as JsonClearCommand, aa as JsonDelCommand, ab as JsonForgetCommand, ac as JsonGetCommand, ad as JsonMGetCommand, ae as JsonNumIncrByCommand, af as JsonNumMultByCommand, ag as JsonObjKeysCommand, ah as JsonObjLenCommand, ai as JsonRespCommand, aj as JsonSetCommand, ak as JsonStrAppendCommand, al as JsonStrLenCommand, am as JsonToggleCommand, an as JsonTypeCommand, ao as KeysCommand, ap as LIndexCommand, aq as LInsertCommand, ar as LLenCommand, as as LMoveCommand, at as LPopCommand, au as LPushCommand, av as LPushXCommand, aw as LRangeCommand, ax as LRemCommand, ay as LSetCommand, az as LTrimCommand, aA as MGetCommand, aB as MSetCommand, aC as MSetNXCommand, aF as PExpireAtCommand, aE as PExpireCommand, aH as PSetEXCommand, aI as PTtlCommand, aD as PersistCommand, aG as PingCommand, P as Pipeline, aJ as PublishCommand, aN as RPopCommand, aO as RPushCommand, aP as RPushXCommand, aK as RandomKeyCommand, aL as RenameCommand, aM as RenameNXCommand, d as Requester, aQ as SAddCommand, aT as SCardCommand, aX as SDiffCommand, aY as SDiffStoreCommand, b3 as SInterCommand, b4 as SInterStoreCommand, b5 as SIsMemberCommand, b7 as SMIsMemberCommand, b6 as SMembersCommand, b8 as SMoveCommand, b9 as SPopCommand, ba as SRandMemberCommand, bb as SRemCommand, bc as SScanCommand, be as SUnionCommand, bf as SUnionStoreCommand, aR as ScanCommand, aS as ScanCommandOptions, bo as ScoreMember, aU as ScriptExistsCommand, aV as ScriptFlushCommand, aW as ScriptLoadCommand, a$ as SetBitCommand, aZ as SetCommand, a_ as SetCommandOptions, b0 as SetExCommand, b1 as SetNxCommand, b2 as SetRangeCommand, bd as StrLenCommand, bg as TimeCommand, bh as TouchCommand, bi as TtlCommand, bj as Type, bk as TypeCommand, bl as UnlinkCommand, U as UpstashRequest, c as UpstashResponse, bm as XAddCommand, bn as XRangeCommand, bq as ZAddCommand, bp as ZAddCommandOptions, br as ZCardCommand, bs as ZCountCommand, bt as ZDiffStoreCommand, bu as ZIncrByCommand, bv as ZInterStoreCommand, bw as ZInterStoreCommandOptions, bx as ZLexCountCommand, by as ZMScoreCommand, bz as ZPopMaxCommand, bA as ZPopMinCommand, bB as ZRangeCommand, bC as ZRangeCommandOptions, bD as ZRankCommand, bE as ZRemCommand, bF as ZRemRangeByLexCommand, bG as ZRemRangeByRankCommand, bH as ZRemRangeByScoreCommand, bI as ZRevRankCommand, bJ as ZScanCommand, bK as ZScoreCommand, bL as ZUnionCommand, bM as ZUnionCommandOptions, bN as ZUnionStoreCommand, bO as ZUnionStoreCommandOptions, e as errors } from './zmscore-uDFFyCiZ.mjs';

/**
 * Connection credentials for upstash redis.
 * Get them from https://console.upstash.com/redis/<uuid>
 */
type RedisConfigNodejs = {
    /**
     * UPSTASH_REDIS_REST_URL
     */
    url: string | undefined;
    /**
     * UPSTASH_REDIS_REST_TOKEN
     */
    token: string | undefined;
    /**
     * An agent allows you to reuse connections to reduce latency for multiple sequential requests.
     *
     * This is a node specific implementation and is not supported in various runtimes like Vercel
     * edge functions.
     *
     * @example
     * ```ts
     * import https from "https"
     *
     * const options: RedisConfigNodejs = {
     *  agent: new https.Agent({ keepAlive: true })
     * }
     * ```
     */
    /**
     * The signal will allow aborting requests on the fly.
     * For more check: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
     */
    signal?: AbortSignal;
    latencyLogging?: boolean;
    agent?: unknown;
    keepAlive?: boolean;
    /**
     * When this flag is enabled, any subsequent commands issued by this client are guaranteed to observe the effects of all earlier writes submitted by the same client.
     */
    readYourWrites?: boolean;
} & RedisOptions & RequesterConfig;
/**
 * Serverless redis client for upstash.
 */
declare class Redis extends Redis$1 {
    /**
     * Create a new redis client by providing the url and token
     *
     * @example
     * ```typescript
     * const redis = new Redis({
     *  url: "<UPSTASH_REDIS_REST_URL>",
     *  token: "<UPSTASH_REDIS_REST_TOKEN>",
     * });
     * ```
     */
    constructor(config: RedisConfigNodejs);
    /**
     * Create a new Upstash Redis instance from environment variables.
     *
     * Use this to automatically load connection secrets from your environment
     * variables. For instance when using the Vercel integration.
     *
     * This tries to load `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from
     * your environment using `process.env`.
     */
    static fromEnv(config?: Omit<RedisConfigNodejs, "url" | "token">): Redis;
}

export { Redis, type RedisConfigNodejs };
