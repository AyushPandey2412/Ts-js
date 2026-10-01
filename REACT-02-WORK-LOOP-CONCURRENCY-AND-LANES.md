# MODULE REACT-02 — WORK LOOP, CONCURRENCY & PRIORITY LANES
## Time-Slicing, Cooperative Multitasking & Bitmask Priority Scheduling

---

# 01. THE COOPERATIVE WORK LOOP

### What is it?
The Work Loop is the central execution loop in React that traverses the Fiber tree and processes units of work. React has two modes for this loop:
1. `workLoopSync`: Runs continuously until all work is done. It cannot be interrupted.
2. `workLoopConcurrent`: Evaluates a single Fiber, checks whether the browser needs the main thread back, and pauses if necessary.

```javascript
// Synchronous Work Loop (React 15-style or urgent updates)
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

// Concurrent Work Loop (React 18/19 default for transitions)
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

Here are the key technical terms used in this topic:
- Cooperative Multitasking is an operating model where a process voluntarily yields execution back to the system so other tasks (such as browser rendering and input handling) can run.
- Time Slicing is dividing a large computing task into small slices of time (typically 5ms) across multiple browser frames.
- `shouldYield()` is an internal scheduler function that returns `true` if the current 5ms time slice has expired.

---

### Why does it exist?
JavaScript runs on a single thread in web browsers. That single thread is responsible for:
1. Running your JavaScript code
2. Handling user input (mouse clicks, typing, touches)
3. Calculating CSS styles and layout
4. Painting pixels to the display hardware at 60Hz (16.6ms per frame) or 120Hz (8.3ms per frame)

If a React render takes 80ms, the browser cannot run input events or paint frames during that time. The user experiences noticeable interface lag. The Concurrent Work Loop breaks that 80ms calculation into sixteen 5ms chunks. After each 5ms chunk, React yields to the browser. If the user clicks or types, the browser handles it immediately.

---

# 02. HOW TIME-SLICING WORKS: MESSAGECHANNEL

React does not use `setTimeout(fn, 0)` or `requestAnimationFrame(fn)` for time-slicing because:
- `setTimeout` has a browser-enforced 4ms clamping delay on nested calls.
- `requestAnimationFrame` fires only once per frame immediately before layout/paint, which is too early for scheduling background JavaScript work.

Instead, React Scheduler uses `MessageChannel`:

```javascript
let scheduledHostCallback = null;
let deadline = 0;
const yieldInterval = 5; // 5 milliseconds time slice

const channel = new MessageChannel();
const port = channel.port2;

channel.port1.onmessage = function performWorkUntilDeadline() {
  if (scheduledHostCallback !== null) {
    const currentTime = performance.now();
    deadline = currentTime + yieldInterval;

    const hasMoreWork = scheduledHostCallback(currentTime);
    if (hasMoreWork) {
      // If work remains, post another message to schedule the next slice
      port.postMessage(null);
    } else {
      scheduledHostCallback = null;
    }
  }
};

function shouldYieldToHost() {
  return performance.now() >= deadline;
}

function requestHostCallback(callback) {
  scheduledHostCallback = callback;
  port.postMessage(null); // Schedules a macrotask in the browser event loop
}
```

Because `MessageChannel.port1.onmessage` is a browser macro-task that runs without the 4ms clamping delay, React yields control to the browser, lets the browser process user input and paint the screen, and immediately resumes on the next turn of the event loop.

---

# 03. PRIORITY LANES: 31-BIT INTEGER BITMASKS

React 18 and 19 represent task priorities using a **31-bit integer bitmask** called **Lanes**. Each bit in a 32-bit signed integer represents a priority bucket:

```text
31-bit Lane Mask:
0b0000000000000000000000000000001  ──► SyncLane (Highest priority: User input)
0b0000000000000000000000000000010  ──► InputContinuousLane (Scrolling, dragging)
0b0000000000000000000000000010000  ──► DefaultLane (Normal setState, data fetch)
0b0000000000000000000001000000000  ──► TransitionLane1 (startTransition)
0b0100000000000000000000000000000  ──► IdleLane (Lowest priority)
```

### Why Bitmasks?
Bitwise operations are evaluated directly by CPU registers in 1 clock cycle:
1. **Combine lanes** using bitwise OR (`|`):
   ```javascript
   const combinedLanes = laneA | laneB;
   ```
2. **Check if a lane exists** using bitwise AND (`&`):
   ```javascript
   const hasSyncWork = (combinedLanes & SyncLane) !== 0;
   ```
3. **Remove a lane** when work finishes using bitwise AND with NOT (`& ~`):
   ```javascript
   wipLanes = wipLanes & ~finishedLane;
   ```
4. **Isolate highest priority lane**:
   Using two's-complement arithmetic (`lane & -lane`):
   ```javascript
   function getHighestPriorityLane(lanes) {
     return lanes & -lanes; // Returns lowest set bit (highest priority in React)
   }
   ```

---

# 04. INTERRUPTIBLE RENDERING & TRANSITION LIFECYCLES

When a low-priority task (such as rendering a list of 5,000 items inside `startTransition`) is running in `workLoopConcurrent`, and the user types into an input field:

```javascript
import { useState, useTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [list, setList] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    // 1. High-priority SyncLane: immediate input update
    setQuery(e.target.value);

    // 2. Low-priority TransitionLane: interruptible heavy update
    startTransition(() => {
      const filtered = computeLargeList(e.target.value);
      setList(filtered);
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <p>Filtering list...</p>}
      <HeavyList items={list} />
    </div>
  );
}
```

### The Step-by-Step Interruption Flow:
1. React begins executing `startTransition` at `TransitionLane` priority.
2. In the middle of rendering `HeavyList`, the user presses a key on their keyboard.
3. The browser triggers an `onChange` event. React assigns this update `SyncLane` priority.
4. In the next iteration of `workLoopConcurrent`, React notices:
   ```javascript
   if (hasHigherPriorityWork(root)) {
     // ABORT current low-priority workInProgress tree!
     workInProgress = null;
   }
   ```
5. React discards the partially computed `HeavyList` tree without committing it to the DOM.
6. React immediately runs `workLoopSync` for the `SyncLane` update, updating the `<input>` value on screen in less than 2ms.
7. Once the `SyncLane` work commits to the DOM, React restarts the `TransitionLane` render from scratch with the latest text.

---

# 05. THINK FIRST

What do you think happens if an update inside `startTransition` throws an error? Decide first before checking below.

```javascript
startTransition(() => {
  setItems(computeItems());
});
```

---

Result:
React handles errors in transitions gracefully. If a transition render throws an error, React does not show a blank screen. It aborts the transition, discards the unfinished `workInProgress` tree, and keeps the previous UI visible on screen while triggering the nearest `<ErrorBoundary>`.

---

# 06. RULES TO REMEMBER

1. `workLoopSync` runs without interruptions; `workLoopConcurrent` yields every 5ms using `shouldYield()`.
2. React Scheduler uses `MessageChannel` macro-tasks to avoid the 4ms timer clamping delay of `setTimeout`.
3. Priorities are represented as 31-bit integers where lower numerical values represent higher priorities (`lane & -lane`).
4. High-priority updates (`SyncLane`) immediately interrupt and discard in-flight low-priority transitions.
5. Use `startTransition` or `useDeferredValue` for non-urgent state updates that should not block user input.

---

# 07. EXERCISES

#### Question 1 (Predict the output)
Given `lanes = 0b00000100` (`DefaultLane = 4`), what is the result of `lanes & -lanes`?

#### Question 2 (Find and fix the bug)
A developer attempted to make an expensive API fetch inside `startTransition`. Why does this fail to improve responsiveness?
```javascript
startTransition(async () => {
  const data = await fetch('/api/large-dataset').then(r => r.json());
  setData(data);
});
```

#### Question 3 (Write code from scratch)
Write a bitwise helper function `hasAnyLane(lanes, checkMask)` that returns `true` if `lanes` contains any matching bits in `checkMask`.

#### Question 4 (Explain in your own words)
Explain how two's complement arithmetic (`lanes & -lanes`) extracts the highest-priority lane in a single CPU operation.

---

# 08. SOLUTIONS

#### Solution for Question 1
Answer:
`4` (or `0b00000100`).
Explanation: For any single bit set, `x & -x` returns that exact bit.

---

#### Solution for Question 2
Explanation:
`startTransition` must be synchronous. It only tracks state updater calls executed during the synchronous execution of its callback. Any code after `await` runs in a microtask after `startTransition` has already closed its tracking scope. The `setData(data)` call outside the synchronous block will be treated as an ordinary `DefaultLane` update.
Corrected code:
```javascript
const data = await fetch('/api/large-dataset').then(r => r.json());
startTransition(() => {
  setData(data);
});
```

---

#### Solution for Question 3
Code:
```javascript
function hasAnyLane(lanes, checkMask) {
  return (lanes & checkMask) !== 0;
}

// Example usage:
const SyncLane = 0b0001;
const InputContinuousLane = 0b0010;
const currentLanes = 0b0011;

console.log(hasAnyLane(currentLanes, SyncLane)); // true
```

---

#### Solution for Question 4
Explanation:
In binary two's-complement arithmetic, negating a number (`-x`) is computed by inverting all bits (`~x`) and adding 1 (`~x + 1`). This flips all leading zeros to ones, leaves the rightmost set bit as 1, and turns all bits to the right of it into zeros. Performing a bitwise AND between `x` and `-x` zeroes out all bits except the lowest set bit. In React, lower bit positions correspond to higher task priority, meaning `lanes & -lanes` extracts the highest-priority pending task instantly.

---

# 09. RECALL

1. What browser API does React Scheduler use to schedule time-sliced work?
2. What is the standard duration of a React Scheduler time slice?
3. How does React handle an in-flight transition when an urgent keystroke arrives?

---

### If you remember only one thing:
Priority Lanes allow React to treat user input as urgent and non-blocking by interrupting and discarding heavy background renders mid-calculation.
