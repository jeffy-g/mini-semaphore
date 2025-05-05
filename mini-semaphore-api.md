## mini-semaphore API Reference

This document describes the public API of the **mini-semaphore** package, including classes, interfaces, factory functions, and the `restrictor` namespace.

---

### Class: `Deque<T>`

A bounded FIFO (first-in, first-out) queue implementation using a circular buffer.

```ts
constructor Deque<T>(ic?: number)
```

* **Parameters**:

  * `ic?` — Initial capacity (default: 16).

```ts
push(s: T): void
shift(): T | undefined
get length(): number
```

* **push(s)** — Adds item `s` to the back of the queue.
* **shift()** — Removes and returns the item at the front of the queue, or `undefined` if empty.
* **length** — Current number of items in the queue.

---

### Interface: `ISimplifiedLock`

Basic simplified lock interface for controlling access to async processes.

```ts
interface ISimplifiedLock {
  acquire(lazy?: boolean): Promise<void>;
  release(): void;
  setRestriction(restriction: number): void;
  readonly pending: number;
  limit: number;
  capacity: number;
}
```

* **acquire(lazy?)** — Acquire permission to proceed. If `lazy` is `true`, the acquisition may be deferred (default: `true`).
* **release()** — Release one pending slot, allowing another waiting process to proceed.
* **setRestriction(restriction)** — Adjusts the concurrency restriction (same as setting `limit`).
* **pending** — Number of currently waiting (pending) processes.
* **limit** — Maximum number of concurrent processes allowed.
* **capacity** — Current available slots (initially equals `limit`).

---

### Interface: `IFlowableLock` (extends `ISimplifiedLock`)

Adds a combined `acquire`/`release` workflow helper.

```ts
interface IFlowableLock extends ISimplifiedLock {
  flow<T>(f: () => Promise<T>, lazy?: boolean): Promise<T>;
}
```

* **flow(process, lazy?)** — Automatically acquires the lock, runs `process()`, and releases the lock when the returned promise settles. Returns the same value or rejection as the wrapped promise.

---

### Type: `TFlowableLock<T = TVoidFunction>`

Extension of `IFlowableLock` including an internal queue of resolve callbacks.

```ts
type TFlowableLock<T = TVoidFunction> = IFlowableLock & {
  readonly q: Deque<T>;
};

type TVoidFunction = () => void;
```

---

### Class: `MiniSemaphore` implements `TFlowableLock`

A minimal semaphore controlling concurrency of asynchronous operations.

```ts
constructor MiniSemaphore(capacity: number)
```

* **capacity** — Maximum concurrent operations.
* **limit** — Same as `capacity` (initial limit).
* **q: Deque<TVoidFunction>** — Internal queue holding waiting resolve callbacks.

```ts
acquire(lazy?: boolean): Promise<void>
release(): void
setRestriction(restriction: number): void
get pending(): number
flow<T>(process: () => Promise<T>, lazy?: boolean): Promise<T>
```

* **acquire(lazy?)** — If slots available, resolves immediately; otherwise queues and waits until a slot is freed.
* **release()** — Frees one slot and resumes the next queued waiter.
* **setRestriction(restriction)** — Dynamically adjust the `limit`.
* **pending** — Number of queued waiters.
* **flow(process, lazy?)** — Shorthand to wrap `acquire`/`release` around `process()`.

---

### Function: `create`

Factory returning a simple flowable lock (no explicit release required).

```ts
function create(capacity: number): IFlowableLock;
```

* Creates an `IFlowableLock` instance limited to `capacity` concurrent flows.

---

### Namespace: `restrictor` (alias `fr`)

Utilities for managing semaphores by key.

```ts
namespace restrictor {
  function cleanup(timeSpan: number, debug?: true): Promise<number>;
  function getLockByKey(key: string | number): Promise<IFlowableLock | undefined>;
  function multi<T>(key: string | number, restriction: number, pb: () => Promise<T>): Promise<T>;
  function one<T>(key: string | number, pb: () => Promise<T>): Promise<T>;
}
```

* **cleanup(timeSpan, debug?)** — Eliminates unused semaphores older than `timeSpan` seconds; returns count of removed locks.
* **getLockByKey(key)** — Retrieves an existing lock by its key, or `undefined` if not found.
* **multi(key, restriction, pb)** — Runs `pb()` under a semaphore keyed by `key`, with concurrency limited to `restriction`.
* **one(key, pb)** — Shortcut for `multi(key, 1, pb)`, useful for serializing per-key operations.
