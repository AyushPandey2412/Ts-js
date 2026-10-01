# MODULE REACT-01 — VIRTUAL DOM VS FIBER ARCHITECTURE
## Stack Reconciler Limitations, Fiber Node Anatomy & Double-Buffering Mechanics

---

# 01. WHAT IS A FIBER?

### What is it?
A Fiber is a plain JavaScript object that represents a unit of work and a node in React's component tree. While JSX and React elements are immutable descriptions of what the UI should look like at a single moment, a Fiber node is a mutable, persistent record that tracks a component's state, hooks, DOM elements, and pending updates across renders.

Here are the key technical terms used in this topic:
- A React Element is a lightweight, immutable JavaScript object returned by `React.createElement` or JSX describing a virtual DOM node.
- A Fiber Node is a persistent, mutable runtime object that holds component state, effects, and tree pointers.
- Reconciliation is the recursive diffing algorithm React uses to compute the differences between an old tree and a new tree.
- A Reconciler is the engine (such as Fiber) that coordinates component evaluation and decides which DOM mutations to schedule.
- A Renderer is the environment-specific package (such as `react-dom` for web browsers or `react-native` for mobile OS) that applies mutations to the actual host platform.

---

### Why does it exist?
In React 15 and earlier, React used an engine called the **Stack Reconciler**. The Stack Reconciler processed component trees using synchronous JavaScript function recursion:

```javascript
// Conceptual Stack Reconciler in React 15
function reconcileSubtree(element) {
  const instance = new element.type();
  const childElements = instance.render();
  // Recursive call on the JavaScript execution stack:
  childElements.forEach(child => reconcileSubtree(child));
}
```

This caused a critical performance problem:
1. **Uninterruptible execution**: Once reconciliation started at the root, JavaScript stayed inside the recursive call stack until the entire tree was traversed.
2. **Main-thread blocking (Frame drops)**: If the component tree had thousands of nodes, the traversal took 50ms to 200ms. During this time, the browser main thread was completely blocked, causing user clicks to lag, typing to freeze, and animations to stutter.

React Fiber was created to solve this problem. By replacing JavaScript call stack recursion with a linked-list graph of Fiber nodes, React can pause work after any single component, yield control back to the browser to handle user input, and resume where it left off.

---

# 02. FIBER NODE ANATOMY

A Fiber node contains several dozen internal fields. Here is the architectural anatomy of a Fiber node:

```javascript
function FiberNode(tag, pendingProps, key, mode) {
  // 1. Instance Identification
  this.tag = tag;                       // Integer identifying type (0 = FunctionComponent, 1 = ClassComponent, 5 = HostComponent)
  this.key = key;                       // String key used for list diffing
  this.elementType = null;              // Raw function or class reference
  this.type = null;                     // Resolved component type
  this.stateNode = null;                // Reference to the actual DOM node or class instance

  // 2. Fiber Tree Pointers (Singly-Linked List)
  this.return = null;                   // Pointer to parent Fiber node
  this.child = null;                    // Pointer to FIRST child Fiber node
  this.sibling = null;                  // Pointer to NEXT sibling Fiber node
  this.index = 0;                       // Index in parent's children array

  // 3. State & Work Data
  this.pendingProps = pendingProps;     // Incoming props for the new render
  this.memoizedProps = null;            // Props used in the previous render
  this.updateQueue = null;              // Queue of pending state updates
  this.memoizedState = null;            // Hooks linked list (for function components) or instance state

  // 4. Effects & Commit Flags (Bitmasks)
  this.flags = 0;                       // Bitmask flags for DOM mutations (Placement, Update, Deletion)
  this.subtreeFlags = 0;                // Bitmask flags showing if any descendant has mutations

  // 5. Scheduling & Concurrency
  this.lanes = 0;                       // Bitmask indicating priority of pending work on this fiber
  this.childLanes = 0;                  // Bitmask indicating priority of work in child subtrees

  // 6. Double Buffering Pointer
  this.alternate = null;                // Pointer to corresponding fiber in opposite tree (current <-> workInProgress)
}
```

---

# 03. TREE TRAVERSAL WITHOUT RECURSION

Instead of recursive function calls, Fiber walks the component tree using three pointers: `child`, `sibling`, and `return`.

```text
               ┌───────────────┐
               │    App        │
               └───────┬───────┘
                       │ child
                       ▼
               ┌───────────────┐  sibling   ┌───────────────┐
               │    Header     ├───────────►│    Main       │
               └───────┬───────┘            └───────┬───────┘
                       │ return                     │ return
                       └──────────────► App ◄───────┘
```

### The Traversal Algorithm:
1. **Go down**: If the current Fiber has a `child`, visit `current.child`.
2. **Go right**: If there is no child, complete work on the current node. If it has a `sibling`, visit `current.sibling`.
3. **Go up**: If there is neither a child nor a sibling, climb back up to `current.return` and look for the parent's sibling.
4. **Finish**: When we climb back to the root and find no more siblings, the render phase is complete.

Because this traversal is managed using a loop (`while (workInProgress !== null)`), React can stop the loop at any time:

```javascript
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

If `shouldYield()` returns `true` because a frame boundary (16ms) has been reached, the loop exits. The variable `workInProgress` retains the pointer to the exact Fiber node being worked on. When the browser becomes idle, the loop resumes at that exact pointer.

---

# 04. THE DOUBLE BUFFERING PATTERN

React maintains two complete Fiber trees in memory simultaneously:

1. **The `current` tree**: Represents the nodes and state currently rendered on the browser screen.
2. **The `workInProgress` (WIP) tree**: A scratchpad tree built in memory during the render phase to compute new updates.

```text
SCREEN (DOM)
     ▲
     │ (Displayed)
┌────┴─────────────────────────┐               ┌──────────────────────────────┐
│        CURRENT TREE          │  alternate    │     WORK IN PROGRESS TREE    │
│  RootFiber (current) ────────┼──────────────►│  RootFiber (workInProgress)  │
│       │                      │               │       │                      │
│       ▼                      │  alternate    │       ▼                      │
│     FiberA ──────────────────┼──────────────►│     FiberA' (Modified)       │
└──────────────────────────────┘               └──────────────────────────────┘
```

### The 4 Steps of Double Buffering:
1. When an update is triggered, React checks if the root already has an `alternate` Fiber.
2. If `current.alternate` exists, React reuses the existing object instead of allocating a new one, resetting only its properties.
3. React executes the render phase on the `workInProgress` tree without touching the DOM.
4. In the **Commit Phase**, React applies all DOM mutations synchronously. Once the DOM reflects the new state, React executes a single pointer switch:

```javascript
root.current = workInProgress;
```

With this single variable assignment, the `workInProgress` tree instantly becomes the `current` tree. The old `current` tree now becomes the spare buffer ready to be reused for the next update.

---

# 05. THINK FIRST

What do you think this code outputs? Decide first before checking below.

```javascript
import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    console.log("Count value:", count);
  };

  return <button onClick={handleClick}>{count}</button>;
}
```

---

Result on click:
```text
Count value: 0
```

Why:
Calling `setCount(count + 1)` schedules an update on the Fiber node's `updateQueue`. It does not mutate the local variable `count` in the currently executing execution frame. The current component function completes with `count = 0`. Only on the *next* render pass will React invoke `Counter` again, reading the updated state from `fiber.memoizedState`.

---

# 06. RULES TO REMEMBER

1. React Elements are transient descriptions; Fiber nodes are persistent runtime entities.
2. The Fiber tree is traversed via `child`, `sibling`, and `return` pointers, allowing work to be paused and resumed without call stack limits.
3. The render phase computes mutations on the `workInProgress` tree and is interruptible.
4. The commit phase applies DOM mutations and is always synchronous and uninterruptible.
5. `root.current = workInProgress` switches the active UI buffer in a single operation.

---

# 07. EXERCISES

#### Question 1 (Predict the output)
Why does accessing `element._owner` in React 18/19 development tools return a Fiber reference, but `element` itself cannot be mutated directly?

#### Question 2 (Find and fix the bug)
A developer wrote this custom tree traversal utility. What causes it to enter an infinite loop when traversing sibling nodes?
```javascript
function traverse(root) {
  let node = root;
  while (node) {
    console.log(node.type);
    if (node.child) {
      node = node.child;
    } else if (node.sibling) {
      node = node.sibling;
    } else {
      node = node.return;
    }
  }
}
```

#### Question 3 (Write code from scratch)
Write a function `countFiberNodes(rootFiber)` that walks a Fiber tree using `child`, `sibling`, and `return` without using recursion.

#### Question 4 (Explain in your own words)
Explain why the Stack Reconciler dropped animation frames during deep tree updates, and how Fiber's linked-list architecture prevents this.

---

# 08. SOLUTIONS

#### Solution for Question 1
- Hint 1: What is the freeze state of React elements?
- Hint 2: Elements are recreated every render.

Answer:
React Elements are frozen using `Object.freeze()`. They are disposable descriptors created on every render. The `_owner` property points to the persistent Fiber node that mounted the element, which is managed internally by the runtime.

---

#### Solution for Question 2
- Hint 1: What happens when `node` climbs up to `node.return`?
- Hint 2: Does it re-check `node.child` on the parent?

Corrected code:
```javascript
function traverse(root) {
  let node = root;
  while (node) {
    console.log(node.type);
    if (node.child) {
      node = node.child;
      continue;
    }
    while (node) {
      if (node.sibling) {
        node = node.sibling;
        break;
      }
      node = node.return;
      if (node === root) return;
    }
  }
}
```
Explanation: When climbing back up with `node = node.return`, you must not inspect `node.child` again; you must inspect `node.sibling` of that ancestor or continue climbing.

---

#### Solution for Question 3
Code:
```javascript
function countFiberNodes(root) {
  if (!root) return 0;
  let count = 0;
  let node = root;

  while (node) {
    count++;
    if (node.child) {
      node = node.child;
      continue;
    }
    while (node) {
      if (node === root) return count;
      if (node.sibling) {
        node = node.sibling;
        break;
      }
      node = node.return;
    }
  }
  return count;
}
```

---

#### Solution for Question 4
Explanation:
The Stack Reconciler relied on native JavaScript function recursion. Because call stack frames cannot be paused by the browser engine, a long traversal ran uninterrupted until finished. If this took longer than 16ms, the browser could not run layout or paint passes, causing animation frames to drop. Fiber replaces call stack recursion with a linked-list loop. Because the loop state is stored in heap pointers (`workInProgress`), React can exit the loop at 16ms boundaries, allow the browser to paint, and resume from the saved pointer in the next frame.

---

# 09. RECALL

1. What are the three primary pointers used to traverse a Fiber tree?
2. Which phase of React Fiber is interruptible: the render phase or the commit phase?
3. What is the name of the pointer that connects a `current` Fiber to its corresponding `workInProgress` Fiber?

---

### If you remember only one thing:
React Fiber converts recursive component rendering into an interruptible linked-list traversal, enabling cooperative scheduling and smooth 60fps user experiences.
