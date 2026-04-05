// type guard , any and unknow , interface and type 






// ts-stage3-interfaces-types.ts

// ==============================
// Stage 3 – Interfaces vs Types
// ==============================

// In TypeScript, both `interface` and `type` describe shape.
// But in production, they have different *roles*.

// --------------------------------
// interface → Real things in system
// --------------------------------

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

// Think:
// "This is a real entity in my app."
//
// Use `interface` for:
// - Domain models (User, Order, Payment)
// - API request/response shapes
// - Core objects that exist in the system

// --------------------------------
// type → Type-level logic & shaping
// --------------------------------

type Role = "admin" | "user";

type ApiResponse<T> = {
  data: T;
  error: string | null;
};

// Think:
// "This is a rule or a view of data."
//
// Use `type` for:
// - Unions
// - Derived views
// - API shaping
// - Utility-based transformations

// --------------------------------
// Extension vs Composition
// --------------------------------

// Extension = identity growth ("is-a")
interface Admin extends User {
  permissions: string[];
}

// Composition = data shaping ("has-a")
type UserWithRole = User & {
  role: Role;
};

// extends → new kind of entity  
// &       → same entity, reshaped for a use-case

// --------------------------------
// One Source of Truth Pattern
// --------------------------------

interface CoreUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  createdAt: Date;
}

// Never duplicate CoreUser.
// Always derive views from it.

type PublicUser = Pick<CoreUser, "id" | "name" | "avatar">;

type AuthResponse = Pick<CoreUser, "id" | "email"> & {
  token: string;
};

// CoreUser = truth  
// PublicUser / AuthResponse = views of truth

// --------------------------------
// Utility Patterns
// --------------------------------

// Pick<T, K>    → select fields
// Partial<T>    → make all fields optional
// Required<T>   → make all fields required

type UpdateProfileRequest =
  Partial<Pick<CoreUser, "name" | "avatar">>;

// Make only one field optional
type UserForUI =
  Pick<CoreUser, "id" | "name" | "email"> &
  Partial<Pick<CoreUser, "avatar">>;

// ==============================
// DEV GUIDE – HOW REAL APPS USE THIS
// ==============================
//
// Use `interface` when:
// - Modeling real entities
// - Defining core domain objects
// - Creating API contracts
//
// Use `type` when:
// - Creating unions
// - Shaping data for APIs/UI
// - Deriving views from domain
//
// Why this matters:
// - Prevents password & internal data leaks
// - Avoids duplicated types
// - Keeps domain stable, boundaries flexible
// - Scales in large codebases
//
// Junior mistakes:
// - Randomly mixing type/interface
// - One giant “God type”
// - Copy-pasting similar shapes
// - Letting frontend depend on backend internals
//
// Senior mental model:
// - interface = truth
// - type = views of truth
// - Domain is stable
// - Boundaries are shaped
