import { createEnv as createEnv$1 } from '@t3-oss/env-core';

const CLIENT_PREFIX = "NEXT_PUBLIC_";
function createEnv(opts) {
    const client = typeof opts.client === "object" ? opts.client : {};
    const server = typeof opts.server === "object" ? opts.server : {};
    const shared = opts.shared;
    const runtimeEnv = opts.runtimeEnv ? opts.runtimeEnv : {
        ...process.env,
        ...opts.experimental__runtimeEnv
    };
    return createEnv$1({
        ...opts,
        shared,
        client,
        server,
        clientPrefix: CLIENT_PREFIX,
        runtimeEnv
    });
}

export { createEnv };
