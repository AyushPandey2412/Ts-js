import { Product } from "../../domain/product/product";

export interface IProductRepository {
  create(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  delete(id: string): Promise<void>;
}


// Mental Model for Ports

// “Ports are just a promise or a contract — what your app expects to do, without saying how.”

// Ports = “function declarations only”

// Implementation = “actual logic / code that fulfills the contract”



// Think of it like this:

// You (the service) say:

// “I need something that can save and fetch orders.”
// → That’s the port / interface.

// Someone else (repository / adapter) says:

// “Ok, I can do that — here’s how I save and fetch orders in MongoDB.”
// → That’s the implementation.

// Your service just uses the port

// Doesn’t care if it’s Mongo, Postgres, or in-memory.

// Focuses only on what it needs done, not how it’s done.

// Super short text cue
// PORT = DECLARATION / CONTRACT / “WHAT TO DO”
// IMPLEMENTATION = LOGIC / “HOW TO DO IT”