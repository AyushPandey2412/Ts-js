# MODULE REACT-05 — REACT SERVER COMPONENTS & STREAMING SSR
## The Flight Wire Format, Streaming SSR & Zero-Bundle Component Architecture

---

# 01. RSC VS TRADITIONAL SSR: THE FUNDAMENTAL DIVIDE

### What is it?
React Server Components (RSC) is an architecture where certain components execute exclusively on the server and are **never** included in the client JavaScript bundle.

To understand RSC, compare it to traditional Server-Side Rendering (SSR):

```text
TRADITIONAL SSR (React 16/17):
1. Server runs component tree ──► Generates static HTML string
2. Browser receives HTML      ──► Displays non-interactive page immediately
3. Browser downloads JS bundle──► Re-executes the ENTIRE tree (Hydration)
Result: High First Contentful Paint (FCP), but large JavaScript bundle!

REACT SERVER COMPONENTS (React 19):
1. Server runs Server Components ──► Emits streaming Flight protocol JSON
2. Client receives zero JS for Server Components ──► Only HTML + data
3. Client components hydrate independently       ──► Selective Hydration
Result: Fast initial render, small JS bundle, direct database access!
```

Here are the key technical terms used in this topic:
- A Server Component is a component that renders exclusively on the server, can access backend resources (databases, filesystem) directly, and ships zero JavaScript to the client.
- A Client Component (marked with `'use client'`) is a component that is pre-rendered on the server and hydrated in the browser to support interactivity (`useState`, `useEffect`, event listeners).
- Hydration is the process where client-side React attaches event listeners and state to server-rendered HTML.
- The Flight Protocol is the streaming, serialized format that React uses to send Server Component trees from server to client.

---

# 02. THE FLIGHT WIRE FORMAT

When a Server Component renders, React does **not** return raw HTML. It streams a special wire format called the **React Flight protocol**:

```text
M1:{"id":"./src/Button.client.js","chunks":["client1"],"name":"Button"}
J0:["$","div",null,{"className":"container","children":[["$","h1",null,{"children":"Dashboard"}],["$","$L1",null,{"label":"Click Me"}]]}]
```

### Deconstructing the Flight Protocol:
- Line `M1`: A module reference pointing to a Client Component (`Button.client.js`). The server tells the client: "Import the client chunk for Button here."
- Line `J0`: The component tree representation.
  - `"$"` represents a React element (`React.createElement`).
  - `"div"` is the HTML tag.
  - `"$L1"` refers to the Client Component defined in line `M1`.

### Why Send Flight JSON Instead of HTML?
When you navigate between pages in a Next.js or React 19 app, the server sends only the Flight protocol stream. The client-side reconciler merges this new server tree into the existing Fiber tree in memory. Because it is a Fiber diff rather than a full page reload:
1. Client-side state inside existing Client Components (such as an open modal or input text) is preserved.
2. DOM focus and scroll position are maintained.

---

# 03. STREAMING SSR & SELECTIVE HYDRATION

Traditional SSR had an **all-or-nothing waterfall**:
1. You could not show any HTML until all database queries on the server finished.
2. You could not hydrate any component until all client JavaScript was downloaded.
3. You could not interact with any component until the entire page was hydrated.

### How `<Suspense>` Solves This:
By wrapping slow components in `<Suspense>`, React streams the fast parts of the page immediately:

```javascript
// Server Component with Streaming
import { Suspense } from 'react';

export default function Page() {
  return (
    <div className="layout">
      <Header /> {/* Renders and streams immediately */}

      <Suspense fallback={<SkeletonCard />}>
        <SlowProductCatalog /> {/* Streams chunk as soon as database query finishes */}
      </Suspense>

      <Footer /> {/* Renders immediately */}
    </div>
  );
}
```

### The Progressive HTML Output:
1. The server immediately streams HTML for `<Header>`, `<SkeletonCard>`, and `<Footer>`.
2. When `<SlowProductCatalog>` completes its database query, the server sends an inline `<template>` block containing the final markup, followed by a tiny inline script that swaps the skeleton with the real content in the DOM.
3. React hydrates components selectively based on where the user clicks first!

---

# 04. SERVER ACTIONS & THE `"use server"` DIRECTIVE

A Server Action is an asynchronous function that executes securely on the server and can be invoked directly from client forms or event handlers without writing boilerplate REST/GraphQL endpoints:

```javascript
// app/actions.js
'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateUsername(userId, formData) {
  const newName = formData.get('username');

  // Direct database query on server:
  await db.user.update({
    where: { id: userId },
    data: { name: newName }
  });

  // Automatically purge cached RSC flight payload:
  revalidatePath('/profile');
}
```

```javascript
// app/ProfileForm.jsx
'use client';

import { updateUsername } from './actions';

export default function ProfileForm({ userId }) {
  return (
    <form action={updateUsername.bind(null, userId)}>
      <input name="username" defaultValue="Alex" />
      <button type="submit">Save</button>
    </form>
  );
}
```

---

# 05. THINK FIRST

Can a Server Component import a Client Component? Can a Client Component import a Server Component? Decide first before checking below.

---

Result:
1. A Server Component **CAN** directly import and render a Client Component.
2. A Client Component **CANNOT** directly import a Server Component via `import ServerComponent from './ServerComponent'`.
Why:
If a Client Component imports a Server Component, that Server Component would have to be compiled into the client JavaScript bundle, defeating the entire purpose of server-only execution.
However, a Client Component **CAN** accept a Server Component passed as a prop (such as `children`):

```javascript
// ALLOWED: Composition pattern
<ClientWrapper>
  <ServerDataDisplay />
</ClientWrapper>
```

---

# 06. RULES TO REMEMBER

1. Server Components execute only on the server; their code is never sent to the browser bundle.
2. Client Components (`'use client'`) are still pre-rendered on the server to static HTML and then hydrated.
3. The Flight protocol serializes component trees into streaming JSON with Client Component references (`M1`).
4. `<Suspense>` enables progressive HTML streaming and selective hydration without blocking page rendering.
5. Client Components cannot directly import Server Components, but can render them via `children` composition.

---

# 07. EXERCISES

#### Question 1 (Predict the output)
Why does putting `useState` inside a component without `'use client'` throw an error during build time?

#### Question 2 (Find and fix the bug)
A developer passed a non-serializable object as a prop from a Server Component to a Client Component. What happens and how do you fix it?
```javascript
// ServerComponent.jsx
import ClientButton from './ClientButton';

export default function ServerComponent() {
  const handleClick = () => console.log('Clicked');
  return <ClientButton onClick={handleClick} />;
}
```

#### Question 3 (Write code from scratch)
Write a Server Component `UserList` that connects directly to a simulated async database `db.queryUsers()` and renders an unordered list of user names wrapped in a `<Suspense>` boundary.

#### Question 4 (Explain in your own words)
Explain the difference between Hydration and Rendering in the context of React Server Components.

---

# 08. SOLUTIONS

#### Solution for Question 1
Answer:
Server Components execute only once on the server and do not maintain interactive lifecycle states in browser memory. `useState` and `useEffect` require a browser environment and an active client Fiber reconciler. Without `'use client'`, React rejects client hooks at compile time.

---

#### Solution for Question 2
Explanation:
Props passed across the Server-to-Client boundary must be serializable by the Flight protocol (strings, numbers, booleans, arrays, plain objects). Functions cannot be serialized across the wire.
Fix: Define the event handler inside the Client Component itself or use a Server Action with `'use server'`.

---

#### Solution for Question 3
Code:
```javascript
import { Suspense } from 'react';

// Simulated async database call:
async function dbQueryUsers() {
  return [
    { id: 1, name: 'Taylor' },
    { id: 2, name: 'Jordan' }
  ];
}

async function UserListContent() {
  const users = await dbQueryUsers();
  return (
    <ul>
      {users.map(u => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}

export default function UserList() {
  return (
    <Suspense fallback={<p>Loading users...</p>}>
      <UserListContent />
    </Suspense>
  );
}
```

---

#### Solution for Question 4
Explanation:
Rendering is the phase where React executes component functions to produce descriptions of the UI (Virtual DOM or Fiber tree). In RSC, rendering of Server Components happens strictly on the server to produce the Flight protocol payload.
Hydration is a client-only phase where React scans existing HTML elements sent by the server and attaches event listeners, state hooks, and Fiber nodes to make the HTML interactive. Server Components are never hydrated on the client; only Client Components are hydrated.

---

# 09. RECALL

1. What wire protocol does React use to stream Server Component trees to the client?
2. What directive marks a component file as a Client Component boundary?
3. Can a Server Component read directly from a database using `async/await`?

---

### If you remember only one thing:
React Server Components eliminate the client bundle cost of backend rendering by streaming serialized UI descriptions directly from server to client.
