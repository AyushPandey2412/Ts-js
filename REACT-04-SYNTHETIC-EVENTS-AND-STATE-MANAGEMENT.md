# MODULE REACT-04 — SYNTHETIC EVENTS & STATE MANAGEMENT
## Event Delegation, Automatic Batching & External Store Subscriptions

---

# 01. THE SYNTHETIC EVENT SYSTEM

### What is it?
A Synthetic Event in React is a cross-browser JavaScript wrapper around the browser's native DOM event. It normalizes inconsistent event properties across different browsers and standardizes behavior.

Instead of attaching individual event listeners to every DOM element (e.g. thousands of `<button onClick={...}>` elements), React uses **Event Delegation**:

```text
BROWSER DOM
┌────────────────────────────────────────────────────────┐
│ div#root (React Root Container)                        │
│   └── Attached listener: addEventListener('click', ..) │
└──────────────────────────┬─────────────────────────────┘
                           │
             All events bubble up to Root
                           │
┌──────────────────────────┴─────────────────────────────┐
│  <button onClick={handleClick}>Click me</button>       │
│  (No event listener attached directly to button DOM!)  │
└────────────────────────────────────────────────────────┘
```

Here are the key technical terms used in this topic:
- Event Delegation is a technique where a single event listener is attached to a parent node to manage events for all of its descendants.
- A SyntheticEvent is React's cross-browser object that wraps the native browser event.
- Event Bubbling is the process where an event travels from the target node upward through ancestor nodes to the root.
- Event Capturing is the process where an event travels downward from the root to the target node before bubbling.

---

### Key Shift: React 16 vs React 17/18/19
- In **React 16**, React attached all delegated listeners to the global `document` node. This caused conflicts when embedding a React app inside another React app or another framework (like jQuery or Vue).
- In **React 17, 18, and 19**, React attaches listeners directly to the **root DOM container** (`root.render()` target, such as `document.getElementById('root')`). Multiple React applications running on the same webpage now operate with complete event isolation.

---

# 02. AUTOMATIC BATCHING IN REACT 18+

### What is Batching?
Batching is when React groups multiple state updates into a single re-render pass to optimize performance.

In React 17 and earlier, batching occurred **only** inside React event handlers. Updates inside promises, `setTimeout`, or native event listeners were **NOT** batched:

```javascript
// React 17 Behavior:
setTimeout(() => {
  setCount(c => c + 1); // Triggered Render 1
  setFlag(f => !f);     // Triggered Render 2 (Two separate renders!)
}, 1000);
```

In **React 18 and 19**, React introduced **Automatic Batching** everywhere:

```javascript
// React 18 & 19 Behavior:
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React batches these together -> Triggered Render 1 ONLY!
}, 1000);
```

### Opting Out: `flushSync`
If you need the DOM to update immediately before running the next line (for example, to measure an element's new height before animating):

```javascript
import { flushSync } from 'react-dom';

function handleClick() {
  flushSync(() => {
    setIsOpen(true); // Forces React to commit DOM mutations synchronously
  });
  // DOM is updated right here on the next line:
  const height = dialogRef.current.offsetHeight;
}
```

---

# 03. HOW STATE UPDATER QUEUES WORK

When you call `setState`, React does not execute your state change immediately. It packages the update into an **Update Object** and appends it to a **circular linked list** on the Fiber:

```javascript
const update = {
  lane: priorityLane,
  action: payloadOrFunction,
  hasEagerState: false,
  eagerState: null,
  next: null
};
```

### The Circular Queue Structure:
```text
queue.pending ──► Update 2
                    │ next
                    ▼
                  Update 1 ──► next points back to Update 2
```

Because `queue.pending` points to the *last* update, and `queue.pending.next` points to the *first* update, React can perform two critical operations in O(1) time:
1. Append a new update to the tail of the list.
2. Find the head of the list to start processing updates in chronological order.

---

# 04. UI TEARING & `useSyncExternalStore`

### What is UI Tearing?
In Concurrent React, rendering is interruptible. If a component tree reads from an external global store (such as Redux, Zustand, or browser `window.innerWidth`) and an update occurs while React has paused between two components:

```text
Component A reads Store -> gets Value 1
───► BROWSER PAUSES WORK (Yields for 5ms)
───► External Store changes to Value 2
───► BROWSER RESUMES
Component B reads Store -> gets Value 2
```

Result: The top of the screen displays `Value 1`, while the bottom of the screen displays `Value 2`. This visual glitch is called **Tearing**.

### The Solution: `useSyncExternalStore`
To prevent tearing, React 18 introduced `useSyncExternalStore`. It forces any external store read to be synchronous during the render phase:

```javascript
import { useSyncExternalStore } from 'react';

// Example: Subscribing to browser online status
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
```

---

# 05. THINK FIRST

What do you think this code outputs in React 18+? Decide first before checking below.

```javascript
function BatchTest() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    Promise.resolve().then(() => {
      setCount(c => c + 1);
      setCount(c => c + 1);
    });
  };

  console.log("Render count:", count);
  return <button onClick={handleClick}>Run</button>;
}
```

---

Result:
When clicked, the component logs:
`Render count: 2`
(It renders **once**, jumping from `0` straight to `2`, because Automatic Batching batches both updates inside microtasks).

---

# 06. RULES TO REMEMBER

1. React delegates events to the root container (`#root`), not individual DOM elements.
2. React 18+ automatically batches state updates across event handlers, promises, and timeouts.
3. Use `flushSync` only when you must force immediate DOM layout updates for imperative measurements.
4. State updates are stored in a circular linked list (`updateQueue.shared.pending`) for O(1) appending and traversal.
5. Use `useSyncExternalStore` to read from third-party state stores to prevent concurrent UI tearing.

---

# 07. EXERCISES

#### Question 1 (Predict the output)
If an element calls `e.stopPropagation()` inside an `onClick` handler in React 18, does it stop the native DOM event on `document`?

#### Question 2 (Find and fix the bug)
A developer wrote a custom window resize store hook that causes infinite re-renders. Find the bug.
```javascript
function useWindowSize() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => ({ width: window.innerWidth, height: window.innerHeight }) // Bug!
  );
}
```

#### Question 3 (Write code from scratch)
Write a custom `createStore(initialState)` utility that supports a `.getState()`, `.setState(val)`, `.subscribe(listener)` pattern and integrates with `useSyncExternalStore`.

#### Question 4 (Explain in your own words)
Why did React 17 move event listeners from `document` to the root DOM container?

---

# 08. SOLUTIONS

#### Solution for Question 1
Answer:
No.
Explanation: Because React's synthetic event handler executes when the event bubbles up to the root container, native event listeners attached directly to ancestor DOM elements below the root or to `document` have already executed or will execute through native bubbling. `e.stopPropagation()` in React stops propagation across React synthetic event handlers.

---

#### Solution for Question 2
Explanation:
`getSnapshot` must return a cached value if the underlying state has not changed. Returning a new object literal `{ width, height }` on every call creates a new object reference, causing `Object.is` comparison to fail and triggering infinite re-render loops.
Corrected code:
```javascript
let currentSize = { width: typeof window !== 'undefined' ? window.innerWidth : 0, height: typeof window !== 'undefined' ? window.innerHeight : 0 };

function subscribe(callback) {
  function handleResize() {
    currentSize = { width: window.innerWidth, height: window.innerHeight };
    callback();
  }
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}

function getSnapshot() {
  return currentSize;
}

function useWindowSize() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
```

---

#### Solution for Question 3
Code:
```javascript
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState: () => state,
    setState: (next) => {
      state = typeof next === 'function' ? next(state) : next;
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
```

---

#### Solution for Question 4
Explanation:
Attaching all listeners to `document` caused problems when embedding multiple React applications or microfrontends on the same page. If an inner React app stopped propagation, it would block the outer app. Moving delegation to each app's root DOM container ensures each React instance has its own isolated event system.

---

# 09. RECALL

1. Where are synthetic event listeners attached in React 18?
2. Which function allows developers to opt out of automatic batching?
3. What hook should be used to subscribe to external stores safely in concurrent mode?

---

### If you remember only one thing:
React 18 automatically batches all state updates across any execution context, and root-level event delegation guarantees complete event isolation between applications.
