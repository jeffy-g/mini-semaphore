[![CircleCI](https://circleci.com/gh/jeffy-g/mini-semaphore/tree/master.svg?style=svg)](https://circleci.com/gh/jeffy-g/mini-semaphore/tree/master)
[![codecov](https://codecov.io/gh/jeffy-g/mini-semaphore/graph/badge.svg?token=SEEIAGR8HW)](https://codecov.io/gh/jeffy-g/mini-semaphore)
![GitHub](https://img.shields.io/github/license/jeffy-g/mini-semaphore?style=plastic)
[![npm version](https://badge.fury.io/js/mini-semaphore.svg)](https://badge.fury.io/js/mini-semaphore)
![node](https://img.shields.io/node/v/mini-semaphore.svg?style=plastic)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/jeffy-g/mini-semaphore.svg?style=plastic)
![npm bundle size](https://img.shields.io/bundlephobia/min/mini-semaphore?style=plastic)
![npm](https://img.shields.io/npm/dm/mini-semaphore.svg?style=plastic)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/jeffy-g/mini-semaphore.svg?style=plastic)

# Mini Semaphore (mini-semaphore

A lightweight version of `Semaphore` that limits the number of process that can simultaneously access a resource or pool of resources.  
This implementation can only work within one javascript runtime thead and realized by `Promise`

> ## API

  + [mini-semaphore API](./mini-semaphore-api.md)

> ## Usage

  + how to imports

```ts
// typescript
import {
    ISimplifiedLock, IFlowableLock, // types
    // NOTE: `class` and` object` both have the same interface
    MiniSemaphore, // get implementation as class
    create, // get implementation as object literal

    restrictor // see Flow Restrictor section
} from "mini-semaphore";

// node
const {
    MiniSemaphore,
    create,
    restrictor
} = require("mini-semaphore");
```

 + class
```ts
import { MiniSemaphore, IFlowableLock } from "mini-semaphore";

// like Mutex 
const ms: IFlowableLock = new MiniSemaphore(1);
// allow multiple
const ms = new MiniSemaphore(10);
```

 + object
```ts
import { create as createSemaphore, IFlowableLock } from "mini-semaphore";
const ms: IFlowableLock = createSemaphore(10);
```

 + Also, it can be read as a script element in the html page.
   + In that case, access from `MiniSema` global variable

```html
<script src="https://unpkg.com/mini-semaphore@latest/umd/index.js"></script>
<script>
    // class
    const ms = new MiniSema.MiniSemaphore(10);
    // object
    const mso = MiniSema.create(10);
</script>
```
---
> ## Examples

```javascript
// import MiniSemaphore class
import { MiniSemaphore } from "mini-semaphore";

// create `MiniSemaphore` with appropriate restrictions
// Limit the number of simultaneous requests to fire to 7
const s = new MiniSemaphore(7);

// example function
async function refreshToken(refresh_token: string) {
    const fetchOption = {
        method: "post",
        mode: "cors",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            host: "login.eveonline.com"
        },
        body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refresh_token)}&client_id=${CLIENT_ID}&code_verifier=${VERIFIER}`
    } as RequestInit;

    let response: Response;

    //
    // #1 When processing details are write in code
    //
    await s.acquire(); // If the pending exceeds the limit, wait for ...
    // Requires a "try catch" block to surely execute the "release" method
    try {
        response = await fetch("https://login.eveonline.com/v2/oauth/token", fetchOption);
    } finally {
        s.release();   // release the pending count
    }
    const data = await response.json() as TOAuth2AccessTokenResponse;
    // ...

    //
    // #2 simplfied with `IFlowableLock.flow` method (automatic acquire/release)
    //
    response = await s.flow(async () => fetch("https://login.eveonline.com/v2/oauth/token", fetchOption));
    const data = await response.json() as TOAuth2AccessTokenResponse;

    // ...
}
```

> ## Flow Restrictor

  + Utility module using `MiniSemaphore` is available

```ts
/**
 * create a semaphore for each `key`, and limit the number of shares with the value of `restriction`
 * 
 * @param key number or string as tag
 * @param restriction number of process restriction
 * @param processBody the process body
 */
export declare function multi<T>(key: string | number, restriction: number, processBody: () => Promise<T>): Promise<T>;

/**
 * synonym of `multi(key, 1, processBody)`
 * 
 *  + use case
 *    * Avoid concurrent requests to the same url
 * 
 * @param key number or string as tag
 * @param processBody the process body
 */
export declare function one<T>(key: string | number, processBody: () => Promise<T>): Promise<T>;
```

```ts
import { restrictor } from "mini-semaphore";

//
// Avoid concurrent requests to the same `id`
//
async function resolve(id: string | number): Promise<TType> {
    const data = await restrictor.one(id, async () => {
            let d = dataCache[id];
            if (d === void 0) {
                dataCache[id] = d = await fetch(
                  `https://esi.evetech.net/latest/universe/types/${id}/`)
                ).then(res => res.json());
            }
            return d;
        }
    );
    return data;
}

```

---
> ## Abortable Semaphore

Starting from version **1.4.3**, `mini-semaphore` introduces support for abortable semaphores.  
This feature allows you to cancel pending tasks and notify listeners when an abort event occurs.  
This is particularly useful in scenarios where you need to terminate ongoing operations gracefully.

### Key Features

- **Abort Method**: Immediately cancels all pending tasks and restores the semaphore's capacity.
- **Event Emission**: Emits an `abort` event to notify listeners of the cancellation.
- **Listener Management**: Provides `onAbort` and `offAbort` methods to register and remove event listeners.

### Example Usage

```typescript
import { createWithAbort } from "mini-semaphore";

// Create an abortable semaphore with a capacity of 3
const semaphore = createWithAbort(3);

// Register an abort event listener
semaphore.onAbort((reason) => {
    console.log("Abort event received:", reason.message);
});

// Simulate tasks
const task = async (id: number) => {
    try {
        await semaphore.acquire();
        console.log(`Task ${id} started`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate work
        console.log(`Task ${id} completed`);
        semaphore.release();
    } catch (e) {
        console.log(`Task ${id} aborted:`, e.message);
    }
};

// Start tasks
const tasks = [1, 2, 3, 4, 5].map((id) => task(id));

// Abort all pending tasks after 2 seconds
setTimeout(() => {
    semaphore.abort();
}, 2000);

// Wait for all tasks to settle
Promise.allSettled(tasks).then(() => {
    console.log("All tasks settled");
});
```

### Explanation

1. **Creating an Abortable Semaphore**: Use `createWithAbort` to create a semaphore with abort capabilities.
2. **Registering Listeners**: Use `onAbort` to listen for abort events and handle cleanup or logging.
3. **Aborting Tasks**: Call `abort` to cancel all pending tasks. Tasks that are already running will not be interrupted but will complete normally.
4. **Graceful Cleanup**: Use `offAbort` to remove listeners when they are no longer needed.

This feature enhances the flexibility of `mini-semaphore`, making it suitable for more complex concurrency control scenarios.

> ## Authors

 + **jeffy-g** - [jeffy-g](https://github.com/jeffy-g)


> ### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
