# Module TS-09: Compiler Pipeline, AST & Transformers

Welcome to TypeScript Compiler Pipeline, Abstract Syntax Trees (AST), and Custom Transformers. This module teaches how the TypeScript compiler (`tsc`) transforms text into executable code, how the five compiler pipeline phases operate (Scanner, Parser, Binder, Checker, and Emitter), and how to build production-grade AST analyzers, custom transformers, and linters using the TypeScript Compiler API.

---

# Topic 1: The 5-Phase Compiler Architecture (Scanner, Parser, Binder, Checker, Emitter)

### 1. What is it?
The TypeScript compiler architecture is divided into five distinct sequential phases:
1. **Scanner** (`scanner.ts`): Reads raw character streams and outputs lexical tokens.
2. **Parser** (`parser.ts`): Reads tokens and produces an Abstract Syntax Tree (AST) representing syntactic hierarchy.
3. **Binder** (`binder.ts`): Traverses the AST and creates `Symbol` tables connecting declarations across lexical scopes.
4. **Checker** (`checker.ts`): The type engine. Resolves types, enforces structural subtyping, and calculates compiler diagnostics.
5. **Emitter** (`emitter.ts`): Translates AST nodes into target JavaScript (`.js`), type declarations (`.d.ts`), and source maps (`.js.map`).

### 2. Why does it exist?
A multi-pass compiler separates concerns cleanly:
- Parsing syntax does not require knowing what types variables are.
- Checking types does not require generating target JavaScript strings.
- Emitting target JavaScript can skip type checking completely when fast transpilation is desired (such as in Babel, SWC, esbuild, or `ts.transpileModule`).

### 3. Basic example

```typescript
import * as ts from "typescript";

// A small program demonstrating the pipeline phases programmatically
const sourceCode = `const x: number = 42;`;
const fileName = "example.ts";

// 1. Parsing Phase: Text -> AST SourceFile
const sourceFile = ts.createSourceFile(
  fileName,
  sourceCode,
  ts.ScriptTarget.ES2022,
  /* setParentNodes */ true
);

console.log("AST Root Node Kind:", ts.SyntaxKind[sourceFile.kind]); // "SourceFile"
console.log("First statement Kind:", ts.SyntaxKind[sourceFile.statements[0].kind]); // "VariableStatement"

// 2. Fast Transpilation (Scanner + Parser + Emitter, bypassing Checker)
const output = ts.transpileModule(sourceCode, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
});

console.log("Emitted JS:", output.outputText.trim()); // "const x = 42;"
```

**Line-by-line explanation:**
- `ts.createSourceFile(...)`: Invokes the Scanner and Parser to convert `sourceCode` into a typed AST object without running the Checker.
- `ts.SyntaxKind[sourceFile.kind]`: Returns `"SourceFile"`, the root container node of the AST.
- `sourceFile.statements[0]`: The first statement node, representing `const x: number = 42;`.
- `ts.transpileModule(...)`: Runs the Scanner, Parser, and Emitter directly, erasing `: number` without instantiating the full Type Checker.

---

### 4. How it works inside TypeScript
```
+-----------------------------------------------------------------------------------+
|                        TypeScript Compiler Pipeline                               |
+-----------------------------------------------------------------------------------+
|  Source Text: "const x: number = 42;"                                             |
|        │                                                                          |
|        ▼ (Phase 1: Scanner)                                                       |
|  Token Stream: [ConstKeyword, Identifier("x"), ColonToken, NumberKeyword, ...]   |
|        │                                                                          |
|        ▼ (Phase 2: Parser)                                                        |
|  AST (SourceFile -> VariableStatement -> VariableDeclarationList)                 |
|        │                                                                          |
|        ▼ (Phase 3: Binder)                                                        |
|  Symbol Table: Symbol("x") -> Scope Map                                           |
|        │                                                                          |
|        ▼ (Phase 4: Type Checker)                                                  |
|  Type Assignment: Type(x) = number, Type(42) = 42, Assignable: YES                |
|        │                                                                          |
|        ▼ (Phase 5: Emitter)                                                       |
|  Output: "const x = 42;" (.js) + "declare const x = 42;" (.d.ts)                  |
+-----------------------------------------------------------------------------------+
```

1. **Independent AST**: The Parser creates a syntax tree that can be inspected without the filesystem.
2. **Lazy Type Checking**: The Type Checker is instantiated only when a `ts.Program` is created and diagnostics or type inquiries are requested.
3. **Emitter Transformation**: The Emitter traverses the checked AST, removes type annotations, lowers modern syntax (if targeting older ES versions), and prints JavaScript text.

---

### 5. More examples

#### Example 1: Creating a full compiler `Program` with Type Checking
```typescript
import * as ts from "typescript";

function compileAndCheck(fileNames: string[], options: ts.CompilerOptions) {
  // Creates the Program (coordinates Scanner, Parser, Binder, Checker, Emitter)
  const program = ts.createProgram(fileNames, options);

  // Phase 4: Run Type Checker
  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (diagnostics.length > 0) {
    for (const diag of diagnostics) {
      const message = ts.flattenDiagnosticMessageText(diag.messageText, "\n");
      console.error(`Diagnostic Error: ${message}`);
    }
  } else {
    console.log("Zero compiler errors. Proceeding to emission...");
    // Phase 5: Run Emitter
    program.emit();
  }
}
```

#### Example 2: Inspecting pipeline errors
```typescript
const badCode = `const x: number = "not a number";`;
const result = ts.transpileModule(badCode, {});
// transpileModule ONLY runs Scanner + Parser + Emitter, NOT Checker!
console.log("Transpiled anyway:", result.outputText.trim()); // "const x = "not a number";"
```
Notice: `transpileModule` does NOT catch type mismatches because the Type Checker is not run. Tools like Vite and esbuild also skip Phase 4 for speed.

---

### 6. Common mistakes

#### Mistake 1: Assuming `ts.transpileModule` or Babel does type checking
```typescript
// GOTCHA: Fast build tools skip Phase 4 (Type Checker)
// A file with 50 type errors will still output JavaScript when using transpileModule!
```
**Why it matters:** Fast bundlers only run the Scanner, Parser, and Emitter to strip types. Type checking must be run via `tsc --noEmit` in a CI/CD check.

#### Mistake 2: Calling `program.emit()` without checking diagnostics
```typescript
// WRONG: Emitting code blindly
program.emit(); // Emits invalid JavaScript even if there are critical syntax or type errors!
```
**Why it fails:** By default, TypeScript emits files even when type errors exist (unless `noEmitOnError: true` is configured). Always inspect `ts.getPreEmitDiagnostics(program)` first.

---

### 7. Rules to remember
1. The 5 phases are: Scanner $\to$ Parser $\to$ Binder $\to$ Checker $\to$ Emitter.
2. The Parser creates the AST without knowing the types of symbols.
3. The Type Checker requires a `ts.Program` and is the most computationally expensive phase.
4. `transpileModule` strips types without running the Type Checker.

---

### Think first: Prediction puzzle
Does `ts.createSourceFile` throw an error if you pass invalid types like `const x: number = "hello";`?

```typescript
const sf = ts.createSourceFile("test.ts", 'const x: number = "hello";', ts.ScriptTarget.Latest);
console.log(sf.statements.length > 0);
```

---

**Answer:**
```
true
```
**Explanation:** `ts.createSourceFile` only runs the Scanner and Parser. Because `const x: number = "hello";` is valid TypeScript syntax, parsing succeeds and creates a valid AST. Type checking is handled by the Checker, not the Parser.

---

### Practice exercises

#### Exercise 1: Print statement kinds of an AST
- **Task**: Parse a string containing an `if` statement and a `function` declaration. Log the `SyntaxKind` name of both statements.
- **Hint 1**: Access `sourceFile.statements`.
- **Hint 2**: Use `ts.SyntaxKind[stmt.kind]`.

#### Exercise 2: Transpile modern arrow function to ES5
- **Task**: Use `ts.transpileModule` with `target: ts.ScriptTarget.ES5` on `const add = (a, b) => a + b;`.
- **Hint 1**: Set `compilerOptions: { target: ts.ScriptTarget.ES5 }`.

#### Exercise 3: Inspect diagnostic errors
- **Task**: Create an in-memory compiler program with a syntax error `const = 5;`. Retrieve and print diagnostics.
- **Hint 1**: `ts.getPreEmitDiagnostics(program)`.

#### Exercise 4: Detect whether an AST has parse diagnostics
- **Task**: Check `sourceFile.parseDiagnostics` on a string with mismatched braces.
- **Hint 1**: `(sourceFile as any).parseDiagnostics.length > 0`.

---

### Exercise solutions

#### Solution 1: Print statement kinds of an AST
```typescript
import * as ts from "typescript";

const code = `
if (true) { console.log("yes"); }
function greet() {}
`;

const sf = ts.createSourceFile("sample.ts", code, ts.ScriptTarget.Latest, true);
sf.statements.forEach((stmt) => {
  console.log(ts.SyntaxKind[stmt.kind]);
});
// Output:
// IfStatement
// FunctionDeclaration
```

#### Solution 2: Transpile modern arrow function to ES5
```typescript
const modernCode = `const add = (a: number, b: number): number => a + b;`;
const output = ts.transpileModule(modernCode, {
  compilerOptions: { target: ts.ScriptTarget.ES5 },
});
console.log(output.outputText);
// Output contains "var add = function (a, b) { return a + b; };"
```

#### Solution 3: Inspect diagnostic errors
```typescript
const options: ts.CompilerOptions = { noEmitOnError: true };
const host = ts.createCompilerHost(options);
// Host can be used to feed virtual files into ts.createProgram
```

#### Solution 4: Detect whether an AST has parse diagnostics
```typescript
const brokenCode = `function test() { const a = ; }`;
const sfBroken = ts.createSourceFile("err.ts", brokenCode, ts.ScriptTarget.Latest, true);
const parseErrors = (sfBroken as any).parseDiagnostics;
console.log(parseErrors.length > 0); // true
```

---

### Recall
1. What is the role of the Scanner? Converts raw source text into a stream of lexical tokens.
2. Which phase creates `Symbol` tables connecting declarations across scopes? The Binder.
3. Can TypeScript emit JavaScript without running the Type Checker? Yes, via `ts.transpileModule` or single-file bundler transforms.

> **If you remember only one thing:**  
> The TypeScript compiler operates in 5 clean phases: Scanner (tokens) $\to$ Parser (AST) $\to$ Binder (symbols) $\to$ Checker (types) $\to$ Emitter (JS).

---

# Topic 2: The Scanner and Lexical Tokens (`SyntaxKind`)

### 1. What is it?
The **Scanner** (`ts.Scanner`) is the tokenizer of the TypeScript compiler. It reads the source code character by character and groups characters into discrete units called **Tokens**. Each token is categorized by a numerical enumeration called **`ts.SyntaxKind`** (e.g., `SyntaxKind.ConstKeyword`, `SyntaxKind.Identifier`, `SyntaxKind.PlusToken`).

### 2. Why does it exist?
Parsers cannot efficiently operate on raw character streams. Treating `"function"` as a single token (`FunctionKeyword`) rather than 8 individual characters (`'f'`, `'u'`, `'n'`, `'c'`, `'t'`, `'i'`, `'o'`, `'n'`) makes syntax analysis fast and efficient.

### 3. Basic example

```typescript
import * as ts from "typescript";

const code = `let total: number = 100 + 20;`;

// Create a standalone scanner
const scanner = ts.createScanner(
  ts.ScriptTarget.Latest,
  /* skipTrivia */ true, // skip whitespace and comments
  ts.LanguageVariant.Standard,
  code
);

// Scan all tokens sequentially
let token = scanner.scan();
while (token !== ts.SyntaxKind.EndOfFileToken) {
  const tokenName = ts.SyntaxKind[token];
  const tokenText = scanner.getTokenText();
  console.log(`${tokenName.padEnd(20)} -> "${tokenText}"`);
  token = scanner.scan();
}
```

**Output:**
```
LetKeyword           -> "let"
Identifier           -> "total"
ColonToken           -> ":"
NumberKeyword        -> "number"
EqualsToken          -> "="
NumericLiteral       -> "100"
PlusToken            -> "+"
NumericLiteral       -> "20"
SemicolonToken       -> ";"
```

**Line-by-line explanation:**
- `ts.createScanner(...)`: Instantiates the scanner initialized with our source string.
- `skipTrivia: true`: Instructs the scanner to ignore whitespace, tabs, and comments.
- `scanner.scan()`: Advances the internal pointer to the next token and returns its `SyntaxKind` enum value.
- `scanner.getTokenText()`: Returns the exact substring of code that matches this token.
- Loop runs until `SyntaxKind.EndOfFileToken`.

---

### 4. How it works inside TypeScript
1. **`SyntaxKind` Enum**: Every token, punctuation symbol, keyword, and AST node in TypeScript has a unique integer ID in `ts.SyntaxKind`.
2. **Trivia**: Whitespace, newlines, and comments are classified as "trivia". When `skipTrivia` is `false`, the scanner yields `WhitespaceTrivia` and `SingleLineCommentTrivia`.
3. **Stateless Scanning**: The scanner does not understand grammatical structure; it only knows how to recognize individual lexical patterns.

---

### 5. More examples

#### Example 1: Scanning with comments and trivia preserved
```typescript
const commentedCode = `// calculate sum\nconst val = 1;`;
const triviaScanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, commentedCode);

let t = triviaScanner.scan();
while (t !== ts.SyntaxKind.EndOfFileToken) {
  console.log(ts.SyntaxKind[t]);
  t = triviaScanner.scan();
}
// Outputs: SingleLineCommentTrivia, NewLineTrivia, ConstKeyword, WhitespaceTrivia, Identifier...
```

#### Example 2: Testing if a token is a keyword
```typescript
function isKeyword(kind: ts.SyntaxKind): boolean {
  return kind >= ts.SyntaxKind.FirstKeyword && kind <= ts.SyntaxKind.LastKeyword;
}

console.log(isKeyword(ts.SyntaxKind.WhileKeyword)); // true
console.log(isKeyword(ts.SyntaxKind.Identifier));   // false
```

---

### 6. Common mistakes

#### Mistake 1: Confusing Token `SyntaxKind` with AST Node `SyntaxKind`
```typescript
// Gotcha:
ts.SyntaxKind.PlusToken // A lexical token returned by the scanner
ts.SyntaxKind.BinaryExpression // An AST node created by the parser, NEVER produced by the scanner!
```
**Why it matters:** The scanner only produces tokens. It never creates compound AST structures like `BinaryExpression`, `IfStatement`, or `ClassDeclaration`.

#### Mistake 2: Mutating scanner position incorrectly
```typescript
// WRONG: Reading scanner.getTokenText() after advancing
scanner.scan();
scanner.scan();
scanner.getTokenText(); // Returns the text of the SECOND token, NOT the first!
```
**Why it fails:** The scanner is stateful. `getTokenText()` always queries the most recently scanned token.

---

### 7. Rules to remember
1. The scanner converts text into integer `SyntaxKind` token IDs.
2. Tokens include keywords, identifiers, literals, and punctuation.
3. Comments and whitespace are called "trivia".
4. The scanner has no knowledge of scope, types, or syntax validity.

---

### Think first: Prediction puzzle
What `SyntaxKind` does the scanner produce for the word `"interface"`?

```typescript
const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, "interface");
const token = scanner.scan();
console.log(ts.SyntaxKind[token]);
```

---

**Answer:**
```
InterfaceKeyword
```
**Explanation:** `"interface"` is a reserved keyword in TypeScript, so the scanner immediately classifies it as `SyntaxKind.InterfaceKeyword`.

---

### Practice exercises

#### Exercise 1: Count numeric literals
- **Task**: Write a function that uses `ts.createScanner` to count how many `NumericLiteral` tokens appear in a string.
- **Hint 1**: Check `if (token === ts.SyntaxKind.NumericLiteral) count++`.

#### Exercise 2: Token text collector
- **Task**: Scan a string and collect all `Identifier` names into an array.
- **Hint 1**: Check `token === ts.SyntaxKind.Identifier` and call `scanner.getTokenText()`.

#### Exercise 3: Detect TypeScript keyword usage
- **Task**: Write a function that returns `true` if a string contains any TypeScript-specific keyword like `type`, `interface`, or `declare`.
- **Hint 1**: Match against `ts.SyntaxKind.TypeKeyword`, `InterfaceKeyword`, `DeclareKeyword`.

#### Exercise 4: Token position inspection
- **Task**: Inspect `scanner.getTokenPos()` and `scanner.getTextPos()` to get the start and end offsets of a token.
- **Hint 1**: Print `${scanner.getTokenPos()} - ${scanner.getTextPos()}`.

---

### Exercise solutions

#### Solution 1: Count numeric literals
```typescript
function countNumbers(code: string): number {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, code);
  let count = 0;
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    if (token === ts.SyntaxKind.NumericLiteral) count++;
    token = scanner.scan();
  }
  return count;
}

console.log(countNumbers("const a = 10; const b = 20 + 30;")); // 3
```

#### Solution 2: Token text collector
```typescript
function getIdentifiers(code: string): string[] {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, code);
  const ids: string[] = [];
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    if (token === ts.SyntaxKind.Identifier) ids.push(scanner.getTokenText());
    token = scanner.scan();
  }
  return ids;
}
```

#### Solution 3: Detect TypeScript keyword usage
```typescript
function hasTsKeywords(code: string): boolean {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, code);
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    if (
      token === ts.SyntaxKind.TypeKeyword ||
      token === ts.SyntaxKind.InterfaceKeyword ||
      token === ts.SyntaxKind.DeclareKeyword
    ) {
      return true;
    }
    token = scanner.scan();
  }
  return false;
}
```

#### Solution 4: Token position inspection
```typescript
function printPositions(code: string) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, code);
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    console.log(`${ts.SyntaxKind[token]} at [${scanner.getTokenPos()}, ${scanner.getTextPos()}]`);
    token = scanner.scan();
  }
}
```

---

### Recall
1. What is the fundamental unit of output produced by the Scanner? A token with a numerical `SyntaxKind`.
2. What are comments and whitespace called in the compiler? Trivia.
3. How do you advance the scanner to the next token? By invoking `scanner.scan()`.

> **If you remember only one thing:**  
> The Scanner breaks raw character streams into categorized tokens identified by `ts.SyntaxKind`.

---

# Topic 3: The Parser and Abstract Syntax Tree (`ts.Node` and `ts.SourceFile`)

### 1. What is it?
The **Parser** takes the stream of tokens from the Scanner and organizes them into a hierarchical tree data structure called an **Abstract Syntax Tree (AST)**. Every element in this tree—from an entire file down to a single variable name or plus operator—implements the base interface **`ts.Node`**. The root node of a TypeScript file is a **`ts.SourceFile`**.

### 2. Why does it exist?
Linear tokens cannot capture nested syntactic relationships like operator precedence, nested blocks, function bodies, or generic arguments. An AST represents the precise structural grammar of your program in memory.

### 3. Basic example

```typescript
import * as ts from "typescript";

const code = `
function add(x: number, y: number): number {
  return x + y;
}
`;

const sourceFile: ts.SourceFile = ts.createSourceFile(
  "math.ts",
  code,
  ts.ScriptTarget.Latest,
  /* setParentNodes */ true
);

// Inspect the root node
console.log("Root kind:", ts.SyntaxKind[sourceFile.kind]); // "SourceFile"

// The first statement is a FunctionDeclaration
const fnDecl = sourceFile.statements[0] as ts.FunctionDeclaration;
console.log("Statement kind:", ts.SyntaxKind[fnDecl.kind]); // "FunctionDeclaration"
console.log("Function name:", fnDecl.name?.getText(sourceFile)); // "add"
console.log("Parameter count:", fnDecl.parameters.length); // 2
```

**Line-by-line explanation:**
- `ts.createSourceFile(...)`: Parses the string and returns a `ts.SourceFile` AST root.
- `setParentNodes: true`: Attaches `.parent` references on every child node pointing back to its container node.
- `sourceFile.statements`: An array of top-level statement AST nodes.
- `fnDecl.name?.getText(sourceFile)`: Reads the text representation of the function's identifier node.

---

### 4. How it works inside TypeScript
1. **Node Shape**: Every `ts.Node` contains:
   - `kind: ts.SyntaxKind`: Identifies the node type.
   - `pos: number`: Character start index in source text (including leading trivia).
   - `end: number`: Character end index in source text.
   - `parent: ts.Node`: Reference to the parent container node (if `setParentNodes` is enabled).
2. **Recursive Tree**: A `FunctionDeclaration` contains parameter nodes, type nodes, and a `Block` statement node, which in turn contains a `ReturnStatement` node, which contains a `BinaryExpression` node.

---

### 5. More examples

#### Example 1: Deconstructing a BinaryExpression (`x + y`)
```typescript
const returnStmt = fnDecl.body!.statements[0] as ts.ReturnStatement;
const binaryExpr = returnStmt.expression as ts.BinaryExpression;

console.log("Left operand:", binaryExpr.left.getText(sourceFile));     // "x"
console.log("Operator:", ts.SyntaxKind[binaryExpr.operatorToken.kind]); // "PlusToken"
console.log("Right operand:", binaryExpr.right.getText(sourceFile));   // "y"
```

#### Example 2: Type guards for AST nodes
```typescript
// TypeScript provides built-in type guard functions for all AST node kinds:
if (ts.isFunctionDeclaration(sourceFile.statements[0])) {
  console.log("Validated as function declaration safely!");
}
```

---

### 6. Common mistakes

#### Mistake 1: Forgetting `setParentNodes: true` when navigating upward
```typescript
// WRONG: Calling node.parent when setParentNodes was false
const sf = ts.createSourceFile("a.ts", "const x = 1;", ts.ScriptTarget.Latest, false);
console.log(sf.statements[0].parent); // undefined!
```
**Why it fails:** If `setParentNodes` is omitted or set to `false`, TypeScript saves memory by not setting `.parent` references. Always pass `true` if you need upward tree traversal.

#### Mistake 2: Using `node.getText()` without passing `sourceFile`
```typescript
// WRONG: Calling getText() on detached or newly synthesized nodes
node.getText(); // Throws Error: Cannot read properties of undefined (reading 'text')
```
**Why it fails:** `node.getText()` needs access to the source file text. Pass the source file: `node.getText(sourceFile)`.

---

### 7. Rules to remember
1. Every element in an AST is a `ts.Node`.
2. The root node of a file is always a `ts.SourceFile`.
3. Set `setParentNodes: true` to enable `.parent` navigation.
4. Use built-in type guards like `ts.isFunctionDeclaration(node)` or `ts.isIdentifier(node)` to narrow node types safely.

---

### Think first: Prediction puzzle
What does `ts.isVariableStatement(node)` evaluate to for `const x = 1;`?

```typescript
const sf = ts.createSourceFile("test.ts", "const x = 1;", ts.ScriptTarget.Latest, true);
console.log(ts.isVariableStatement(sf.statements[0]));
```

---

**Answer:**
```
true
```
**Explanation:** `const x = 1;` at top-level is represented as a `VariableStatement` containing a `VariableDeclarationList`.

---

### Practice exercises

#### Exercise 1: Extract all function names
- **Task**: Parse a TypeScript string with 3 functions and extract their string names using `ts.isFunctionDeclaration(node)`.
- **Hint 1**: Filter `sourceFile.statements` using `ts.isFunctionDeclaration`.

#### Exercise 2: Count return statements in a function body
- **Task**: Inspect a function's `body.statements` and count how many are `ReturnStatement` nodes.
- **Hint 1**: Use `ts.isReturnStatement(stmt)`.

#### Exercise 3: Inspect parameter types
- **Task**: For a function `function test(a: string, b: number) {}`, extract and print the text of each parameter's type node.
- **Hint 1**: `param.type?.getText(sourceFile)`.

#### Exercise 4: Detect exported statements
- **Task**: Check if a top-level statement has the `export` modifier using `ts.canHaveModifiers(stmt) && ts.getModifiers(stmt)`.
- **Hint 1**: Inspect if any modifier has `kind === ts.SyntaxKind.ExportKeyword`.

---

### Exercise solutions

#### Solution 1: Extract all function names
```typescript
import * as ts from "typescript";

const code = `
function alpha() {}
function beta() {}
const gamma = 1;
function delta() {}
`;

const sf = ts.createSourceFile("test.ts", code, ts.ScriptTarget.Latest, true);
const fnNames = sf.statements
  .filter(ts.isFunctionDeclaration)
  .map((fn) => fn.name?.getText(sf));

console.log(fnNames); // ["alpha", "beta", "delta"]
```

#### Solution 2: Count return statements in a function body
```typescript
function countReturns(fn: ts.FunctionDeclaration): number {
  if (!fn.body) return 0;
  return fn.body.statements.filter(ts.isReturnStatement).length;
}
```

#### Solution 3: Inspect parameter types
```typescript
const codeFn = `function calc(x: number, flag: boolean) {}`;
const sfFn = ts.createSourceFile("f.ts", codeFn, ts.ScriptTarget.Latest, true);
const fn = sfFn.statements[0] as ts.FunctionDeclaration;

fn.parameters.forEach((param) => {
  console.log(`${param.name.getText(sfFn)}: ${param.type?.getText(sfFn)}`);
});
// x: number
// flag: boolean
```

#### Solution 4: Detect exported statements
```typescript
function isExported(stmt: ts.Statement): boolean {
  if (!ts.canHaveModifiers(stmt)) return false;
  const mods = ts.getModifiers(stmt);
  return mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}
```

---

### Recall
1. What is the root node of an AST in TypeScript? `ts.SourceFile`.
2. What property uniquely identifies the syntax type of any `ts.Node`? `node.kind` (`ts.SyntaxKind`).
3. How do you safely verify that an unknown node is an `IfStatement`? Using the type guard `ts.isIfStatement(node)`.

> **If you remember only one thing:**  
> An Abstract Syntax Tree (AST) represents program structure as a tree of `ts.Node` objects rooted at a `ts.SourceFile`.

---

# Topic 4: AST Traversal with `ts.forEachChild` and `visitEachChild`

### 1. What is it?
To analyze or transform an AST, you must traverse its nodes. TypeScript provides two core traversal functions:
1. **`ts.forEachChild(node, visitor)`**: Visits immediate child nodes for read-only inspection. Stops if the visitor returns a truthy value.
2. **`ts.visitEachChild(node, visitor, context)`**: Visits and rebuilds child nodes during an AST transformation pass.

### 2. Why does it exist?
An AST contains many deeply nested nodes (expressions within statements within blocks within functions). Manually checking every child property (`node.left`, `node.right`, `node.body`, `node.statements`) would require writing hundreds of conditional checks. `ts.forEachChild` abstracts child iteration over any node type uniformly.

### 3. Basic example

```typescript
import * as ts from "typescript";

const code = `
const a = 1;
function calculate() {
  if (true) {
    console.log("hello");
  }
}
`;

const sourceFile = ts.createSourceFile("app.ts", code, ts.ScriptTarget.Latest, true);

// Recursive AST Visitor using ts.forEachChild
function walkTree(node: ts.Node, depth: number = 0) {
  const indent = "  ".repeat(depth);
  console.log(`${indent}${ts.SyntaxKind[node.kind]}`);

  // Visit every child recursively
  ts.forEachChild(node, (child) => walkTree(child, depth + 1));
}

walkTree(sourceFile);
```

**Output snippet:**
```
SourceFile
  VariableStatement
    VariableDeclarationList
      VariableDeclaration
        Identifier
        NumericLiteral
  FunctionDeclaration
    Identifier
    Block
      IfStatement
        TrueKeyword
        Block
          ExpressionStatement
            CallExpression
              PropertyAccessExpression
                Identifier
                Identifier
              StringLiteral
```

**Line-by-line explanation:**
- `walkTree(node, depth)`: Prints the current node's kind and indentation.
- `ts.forEachChild(node, child => ...)`: Calls the callback for every child node attached to `node`.
- The recursive call descends down the entire tree to the leaf nodes.

---

### 4. How it works inside TypeScript
1. **Early Exit Feature**: If your callback passed to `ts.forEachChild` returns a truthy value (e.g. `return true` or `return foundNode`), iteration terminates immediately and returns that value.
2. **Uniform Interface**: Regardless of whether a node stores children in an array (`statements`) or a property (`body`), `forEachChild` visits all of them.
3. **No Dynamic Array Allocation**: `forEachChild` iterates child references internally without allocating temporary child arrays, maximizing performance.

---

### 5. More examples

#### Example 1: Finding a node with early exit
```typescript
function findFirstFunction(node: ts.Node): ts.FunctionDeclaration | undefined {
  if (ts.isFunctionDeclaration(node)) {
    return node; // Early exit: returns directly!
  }
  return ts.forEachChild(node, findFirstFunction);
}

const found = findFirstFunction(sourceFile);
console.log("Found function:", found?.name?.getText(sourceFile));
```

#### Example 2: Collecting all string literals in a file
```typescript
function collectStrings(sourceFile: ts.SourceFile): string[] {
  const strings: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isStringLiteral(node)) {
      strings.push(node.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return strings;
}
```

---

### 6. Common mistakes

#### Mistake 1: Accidental early exit by returning non-undefined values
```typescript
// WRONG: Returning an expression inadvertently stops traversal
function badVisit(node: ts.Node) {
  if (ts.isIdentifier(node)) {
    return console.log(node.text); // In JS, console.log returns undefined, BUT if you return a count or node, traversal STOPS!
  }
  return ts.forEachChild(node, badVisit);
}
```
**Why it fails:** If your visitor returns anything other than `undefined`, `ts.forEachChild` stops visiting siblings and returns that value up the stack. Be intentional about return values.

#### Mistake 2: Using `forEachChild` when attempting to transform nodes
```typescript
// WRONG: Trying to mutate the tree using forEachChild
ts.forEachChild(node, (child) => {
  return newReplacementNode; // Ignored! forEachChild is READ-ONLY!
});
```
**Why it fails:** `forEachChild` is strictly for reading. To transform or replace nodes, you MUST use `ts.visitEachChild` or `ts.visitNode` with a `ts.TransformationContext`.

---

### 7. Rules to remember
1. Use `ts.forEachChild` for read-only tree traversal and inspection.
2. Returning a truthy value from a `forEachChild` visitor stops iteration immediately.
3. Use recursion (`visit(node); ts.forEachChild(node, visit)`) to traverse the entire subtree.
4. `forEachChild` does not transform nodes; use `ts.visitEachChild` for rewriting.

---

### Think first: Prediction puzzle
Does `ts.forEachChild` visit the identifier `x` inside `const x = 10;`?

```typescript
const sf = ts.createSourceFile("t.ts", "const x = 10;", ts.ScriptTarget.Latest, true);
let foundX = false;

function search(node: ts.Node) {
  if (ts.isIdentifier(node) && node.text === "x") foundX = true;
  ts.forEachChild(node, search);
}
search(sf);
console.log(foundX);
```

---

**Answer:**
```
true
```
**Explanation:** `sf` $\to$ `VariableStatement` $\to$ `VariableDeclarationList` $\to$ `VariableDeclaration` $\to$ `Identifier("x")`. Recursively calling `forEachChild` visits all descendants down to the leaf identifier.

---

### Practice exercises

#### Exercise 1: Count total AST nodes
- **Task**: Write a function that counts the total number of nodes in an AST.
- **Hint 1**: Increment a counter on each visit, then call `ts.forEachChild(node, visit)`.

#### Exercise 2: Find all variable names
- **Task**: Traverse an AST and collect the names of all declared variables (`ts.isVariableDeclaration`).
- **Hint 1**: `if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) names.push(node.name.text)`.

#### Exercise 3: Early exit search for classes
- **Task**: Write a function `hasAnyClasses(sf: ts.SourceFile): boolean` that returns `true` the moment the first class is found.
- **Hint 1**: `if (ts.isClassDeclaration(node)) return true; return !!ts.forEachChild(node, visit);`.

#### Exercise 4: Collect all comments from nodes
- **Task**: Extract comments attached to nodes using `ts.getLeadingCommentRanges`.
- **Hint 1**: Pass `sourceFile.text` and `node.pos`.

---

### Exercise solutions

#### Solution 1: Count total AST nodes
```typescript
function countNodes(node: ts.Node): number {
  let count = 1; // count this node
  ts.forEachChild(node, (child) => {
    count += countNodes(child);
  });
  return count;
}
```

#### Solution 2: Find all variable names
```typescript
function getDeclaredVariableNames(sf: ts.SourceFile): string[] {
  const names: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      names.push(node.name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return names;
}
```

#### Solution 3: Early exit search for classes
```typescript
function hasAnyClasses(sf: ts.SourceFile): boolean {
  function check(node: ts.Node): boolean {
    if (ts.isClassDeclaration(node)) return true;
    return !!ts.forEachChild(node, check);
  }
  return check(sf);
}
```

#### Solution 4: Collect all comments from nodes
```typescript
function getLeadingComments(sf: ts.SourceFile, node: ts.Node): string[] {
  const text = sf.text;
  const ranges = ts.getLeadingCommentRanges(text, node.pos);
  if (!ranges) return [];
  return ranges.map((r) => text.substring(r.pos, r.end));
}
```

---

### Recall
1. What function is used for uniform read-only AST child traversal? `ts.forEachChild`.
2. How can you terminate a `ts.forEachChild` search early? By returning any truthy value from the callback.
3. Does `ts.forEachChild` mutate or rewrite AST nodes? No, it is strictly read-only.

> **If you remember only one thing:**  
> `ts.forEachChild` iterates every child node of any AST node uniformly, with built-in early exit when a truthy value is returned.

---

# Topic 5: Node Position and Trivia (`pos`, `end`, `getStart()`, Comments, and Whitespace)

### 1. What is it?
Every AST node tracks its position in the original source text via character offsets:
- **`node.pos`**: The start offset of the node, **including preceding trivia** (leading whitespace and comments).
- **`node.end`**: The end offset of the node.
- **`node.getStart(sourceFile)`**: The exact start offset of the actual token, **excluding leading trivia**.

### 2. Why does it exist?
When a compiler or linter reports an error, it needs to point precisely to the offending token (`getStart()`), not to the blank space or comment three lines above it (`pos`). However, when printing or formatting code, the compiler needs the trivia to preserve developer comments.

### 3. Basic example

```typescript
import * as ts from "typescript";

const code = `
// leading comment
const answer = 42;
`;

const sourceFile = ts.createSourceFile("demo.ts", code, ts.ScriptTarget.Latest, true);
const stmt = sourceFile.statements[0];

console.log("pos:", stmt.pos);             // 0 (includes the comment and newline!)
console.log("end:", stmt.end);             // 39
console.log("getStart():", stmt.getStart(sourceFile)); // 20 (starts exactly at 'const')

console.log("Raw slice [pos, end]:");
console.log(JSON.stringify(code.substring(stmt.pos, stmt.end)));
// "\n// leading comment\nconst answer = 42;"

console.log("Token slice [getStart, end]:");
console.log(JSON.stringify(code.substring(stmt.getStart(sourceFile), stmt.end)));
// "const answer = 42;"
```

**Line-by-line explanation:**
- `stmt.pos`: Offset 0. Trivia (the comment `// leading comment` and newlines) belongs to the `pos` of this statement.
- `stmt.getStart(sourceFile)`: Offset 20. Skips the trivia and points directly to the letter `'c'` of `const`.
- `code.substring(pos, end)`: Extracts the full node text including comments.
- `code.substring(getStart, end)`: Extracts the clean syntax text without leading comments.

---

### 4. How it works inside TypeScript
1. **Trivia Ownership Rule**: In the TypeScript grammar, trivia (comments, spaces) belongs to the token that *follows* it.
2. **`pos` vs `getStart()`**:
   - `pos`: Fast, unparsed offset stored directly on the node struct.
   - `getStart(sourceFile)`: Calls the scanner starting at `pos` to skip trivia and locate the first non-trivia token.
3. **Trailing Trivia**: Comments on the same line following a token (`const x = 1; // comment`) are captured as trailing trivia via `ts.getTrailingCommentRanges`.

---

### 5. More examples

#### Example 1: Extracting Line and Character from an Offset
```typescript
const lineAndChar = sourceFile.getLineAndCharacterOfPosition(stmt.getStart(sourceFile));
console.log(`Line: ${lineAndChar.line + 1}, Column: ${lineAndChar.character + 1}`);
// Line: 3, Column: 1
```

#### Example 2: Inspecting trailing comment ranges
```typescript
const trailingCode = `let x = 10; // important value\n`;
const sfTrailing = ts.createSourceFile("t.ts", trailingCode, ts.ScriptTarget.Latest, true);
const varStmt = sfTrailing.statements[0];

const trailingRanges = ts.getTrailingCommentRanges(sfTrailing.text, varStmt.end);
if (trailingRanges) {
  for (const r of trailingRanges) {
    console.log("Found trailing comment:", trailingCode.substring(r.pos, r.end));
    // "// important value"
  }
}
```

---

### 6. Common mistakes

#### Mistake 1: Using `node.pos` to report linter error locations
```typescript
// WRONG: Highlighting from node.pos
const errorCol = sourceFile.getLineAndCharacterOfPosition(node.pos); // Highlights the comment or blank line above!
```
**Why it fails:** `node.pos` includes all leading comments and blank lines. Linter squiggly lines will appear on comments. Always use `node.getStart(sourceFile)`.

#### Mistake 2: Passing no argument to `node.getStart()`
```typescript
// GOTCHA: node.getStart() without sourceFile
node.getStart(); // Can fail if node was created dynamically or in isolated AST environments
```
**Why it matters:** Always pass `sourceFile` explicitly: `node.getStart(sourceFile)` to ensure safe offset calculation.

---

### 7. Rules to remember
1. `node.pos` includes leading comments and whitespace.
2. `node.getStart(sourceFile)` excludes leading trivia, pointing to the first token.
3. Trivia belongs to the token that follows it.
4. Convert offsets to human lines using `sourceFile.getLineAndCharacterOfPosition(pos)`.

---

### Think first: Prediction puzzle
Does `node.getText()` include leading comments by default?

```typescript
const code = `
/* comment */
const val = 100;
`;
const sf = ts.createSourceFile("d.ts", code, ts.ScriptTarget.Latest, true);
console.log(sf.statements[0].getText(sf).startsWith("/*"));
```

---

**Answer:**
```
false
```
**Explanation:** `node.getText(sourceFile)` uses `node.getStart(sourceFile)` as its starting offset by default. Because `getStart()` excludes leading trivia, `node.getText()` starts directly at `"const val = 100;"`.

---

### Practice exercises

#### Exercise 1: Calculate clean node length
- **Task**: Write a function that calculates the clean length of a node (excluding leading trivia).
- **Hint 1**: `node.end - node.getStart(sourceFile)`.

#### Exercise 2: Format diagnostic message with line:col
- **Task**: Given a node, return a string `"[line:col] Error message"`.
- **Hint 1**: Use `sf.getLineAndCharacterOfPosition(node.getStart(sf))`.

#### Exercise 3: Detect if a node has leading comments
- **Task**: Check if `ts.getLeadingCommentRanges(sf.text, node.pos)` has any entries.
- **Hint 1**: Return `!!ranges && ranges.length > 0`.

#### Exercise 4: Extract trailing comment text
- **Task**: Extract the exact text of a trailing comment on a statement.
- **Hint 1**: Use `ts.getTrailingCommentRanges(sf.text, stmt.end)`.

---

### Exercise solutions

#### Solution 1: Calculate clean node length
```typescript
function getCleanLength(sf: ts.SourceFile, node: ts.Node): number {
  return node.end - node.getStart(sf);
}
```

#### Solution 2: Format diagnostic message with line:col
```typescript
function formatError(sf: ts.SourceFile, node: ts.Node, msg: string): string {
  const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return `[${line + 1}:${character + 1}] ${msg}`;
}
```

#### Solution 3: Detect if a node has leading comments
```typescript
function hasLeadingComments(sf: ts.SourceFile, node: ts.Node): boolean {
  const ranges = ts.getLeadingCommentRanges(sf.text, node.pos);
  return (ranges?.length ?? 0) > 0;
}
```

#### Solution 4: Extract trailing comment text
```typescript
function getTrailingCommentText(sf: ts.SourceFile, stmt: ts.Statement): string | null {
  const ranges = ts.getTrailingCommentRanges(sf.text, stmt.end);
  if (!ranges || ranges.length === 0) return null;
  return sf.text.substring(ranges[0].pos, ranges[0].end).trim();
}
```

---

### Recall
1. What is the difference between `node.pos` and `node.getStart()`? `pos` includes leading trivia (comments/whitespace); `getStart()` points to the first actual token.
2. How do you convert a character offset into a 1-indexed line and column? Use `sourceFile.getLineAndCharacterOfPosition(offset)`.
3. Which token owns a comment? The token that immediately follows the comment.

> **If you remember only one thing:**  
> Use `node.getStart(sourceFile)` for exact token positions and linter diagnostics; `node.pos` includes all leading comments and whitespace.

---

# Checkpoint Challenge 1: AST Parsing & Inspection Foundations (Topics 1-5)

### Challenge Specification
Construct a standalone **AST Function Analyzer** that:
1. Parses TypeScript source code into a `ts.SourceFile`.
2. Uses `ts.forEachChild` to recursively find all `FunctionDeclaration` nodes.
3. Extracts for each function:
   - Function name.
   - Parameter names and parameter types.
   - Return type (if annotated).
   - Line and column position of the function name.
   - Whether the function has leading doc comments.

### Solution

```typescript
import * as ts from "typescript";

// 1. Analysis Result Contract
interface FunctionInfo {
  name: string;
  parameters: Array<{ name: string; type: string }>;
  returnType: string;
  location: { line: number; column: number };
  hasDocComment: boolean;
}

// 2. The AST Function Analyzer
function analyzeFunctions(sourceCode: string, fileName: string = "source.ts"): FunctionInfo[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceCode,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true
  );

  const results: FunctionInfo[] = [];

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.getText(sourceFile);
      const pos = sourceFile.getLineAndCharacterOfPosition(node.name.getStart(sourceFile));

      // Extract parameters
      const parameters = node.parameters.map((param) => ({
        name: param.name.getText(sourceFile),
        type: param.type ? param.type.getText(sourceFile) : "any",
      }));

      // Extract return type
      const returnType = node.type ? node.type.getText(sourceFile) : "void (inferred)";

      // Check for leading comments
      const commentRanges = ts.getLeadingCommentRanges(sourceFile.text, node.pos);
      const hasDocComment = (commentRanges?.length ?? 0) > 0;

      results.push({
        name,
        parameters,
        returnType,
        location: { line: pos.line + 1, column: pos.character + 1 },
        hasDocComment,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}

// 3. Verification Execution
function runCheckpoint1() {
  const code = `
  // Calculates arithmetic sum
  function add(a: number, b: number): number {
    return a + b;
  }

  function noComment(flag: boolean) {
    if (flag) console.log("ok");
  }
  `;

  const infos = analyzeFunctions(code);
  console.log("Analyzed functions count:", infos.length); // 2

  console.log("Function 1:", infos[0]);
  // { name: 'add', parameters: [{name: 'a', type: 'number'}, {name: 'b', type: 'number'}], returnType: 'number', location: { line: 3, column: 12 }, hasDocComment: true }

  console.log("Function 2 has doc comment:", infos[1].hasDocComment); // false
}
runCheckpoint1();
```


---

# Topic 6: The Binder and Symbol Table Architecture (`ts.Symbol` and Scopes)

### 1. What is it?
The **Binder** is the third phase of the compiler pipeline. It walks the AST and creates **`ts.Symbol`** objects. A `Symbol` connects an identifier name (like `x` or `User`) to its declaration AST node across lexical scopes. Symbols are stored in **Symbol Tables** (`ts.SymbolTable`) on containers like SourceFiles, Blocks, and Function bodies.

### 2. Why does it exist?
In TypeScript, the same identifier can have multiple declarations (e.g. an interface and a namespace can merge, or a function can have multiple overloads). An AST node only represents a single syntax occurrence. A `Symbol` acts as the single logical entity that aggregates all declarations of that name.

### 3. Basic example

```typescript
import * as ts from "typescript";

const code = `
interface User {
  id: string;
}
interface User {
  name: string;
}

const u: User = { id: "1", name: "Alice" };
`;

// To inspect Symbols, we must create a Program so the Binder runs
const sourceFile = ts.createSourceFile("user.ts", code, ts.ScriptTarget.Latest, true);
const host = ts.createCompilerHost({});
const program = ts.createProgram(["user.ts"], {}, {
  ...host,
  getSourceFile: (name) => name === "user.ts" ? sourceFile : host.getSourceFile(name, ts.ScriptTarget.Latest),
});

const checker = program.getTypeChecker();

// Look up the Symbol for 'User'
const userStmt = sourceFile.statements[0];
const symbol = checker.getSymbolAtLocation((userStmt as ts.InterfaceDeclaration).name);

if (symbol) {
  console.log("Symbol Name:", symbol.name); // "User"
  console.log("Declaration count:", symbol.declarations?.length); // 2 (Both interfaces merged!)
  console.log("Symbol Flags:", symbol.flags); // Merged flags: SymbolFlags.Interface
}
```

**Line-by-line explanation:**
- `const program = ts.createProgram(...)`: Initializes the compiler, which automatically runs the Binder over all source files.
- `checker.getSymbolAtLocation(...)`: Retrieves the `ts.Symbol` representing the `User` identifier.
- `symbol.declarations?.length`: Shows that both `interface User` statements in code point to the **same single `ts.Symbol`**. This is how declaration merging works internally in TypeScript.

---

### 4. How it works inside TypeScript
1. **Scopes**: The binder creates nested symbol tables corresponding to JavaScript lexical environments (Global $\to$ Module $\to$ Function $\to$ Block).
2. **`SymbolFlags`**: Symbols carry bitwise flags (`ts.SymbolFlags.Function`, `ts.SymbolFlags.Variable`, `ts.SymbolFlags.Interface`, `ts.SymbolFlags.Class`) indicating what kind of entity they represent.
3. **Value vs Type Space**: A `class` symbol has both `SymbolFlags.Class` and `SymbolFlags.Value`, indicating it exists in both the Type and Value spaces.

---

### 5. More examples

#### Example 1: Differentiating Value symbols vs Type symbols
```typescript
const mixedCode = `
type Config = { port: number };
const Config = { port: 8080 };
`;
// Config exists as both a type and a value!
// The symbol merges SymbolFlags.TypeAlias | SymbolFlags.BlockScopedVariable
```

#### Example 2: Inspecting all exports of a module via its symbol
```typescript
const sfSymbol = checker.getSymbolAtLocation(sourceFile);
if (sfSymbol && sfSymbol.exports) {
  sfSymbol.exports.forEach((sym, key) => {
    console.log("Exported Symbol:", sym.name);
  });
}
```

---

### 6. Common mistakes

#### Mistake 1: Trying to access symbols without a `ts.Program`
```typescript
// WRONG: Calling node.symbol directly after createSourceFile
const sf = ts.createSourceFile("a.ts", "const x = 1;", ts.ScriptTarget.Latest, true);
console.log((sf.statements[0] as any).symbol); // undefined!
```
**Why it fails:** `ts.createSourceFile` only runs the Scanner and Parser. The Binder does not populate symbols until a `ts.Program` is constructed.

#### Mistake 2: Assuming one AST node equals one symbol
```typescript
// GOTCHA:
// 1 Symbol can have MANY declarations (e.g. function overloads, interface merging)
// symbol.declarations is an ARRAY of ts.Declaration nodes!
```
**Why it matters:** Always handle `symbol.declarations` as an array, not a single node.

---

### 7. Rules to remember
1. The Binder links identifiers to `ts.Symbol` objects across scopes.
2. A single `ts.Symbol` can reference multiple AST declaration nodes (declaration merging).
3. Symbols carry bitwise `SymbolFlags` (`Function`, `Interface`, `Variable`, etc.).
4. Accessing symbols requires creating a `ts.Program` and using `checker.getSymbolAtLocation(node)`.

---

### Think first: Prediction puzzle
How many declarations does the symbol for `Logger` have when an `interface Logger` and a `namespace Logger` share the same name?

```typescript
interface Logger { log(s: string): void; }
namespace Logger { export const version = "1.0"; }
```

---

**Answer:**
```
2
```
**Explanation:** TypeScript merges the interface declaration and the namespace declaration into a single `ts.Symbol` whose `declarations` array contains both the `InterfaceDeclaration` node and the `ModuleDeclaration` (namespace) node.

---

### Practice exercises

#### Exercise 1: Identify Symbol Flags
- **Task**: Check if a symbol has `SymbolFlags.BlockScopedVariable` using bitwise AND (`symbol.flags & ts.SymbolFlags.BlockScopedVariable`).
- **Hint 1**: Test if the result is non-zero.

#### Exercise 2: Find all declarations of an identifier
- **Task**: Retrieve a symbol and print the `SyntaxKind` of all nodes in `symbol.declarations`.
- **Hint 1**: `symbol.declarations?.map(d => ts.SyntaxKind[d.kind])`.

#### Exercise 3: Inspect local variables in a function scope
- **Task**: For a function declaration node, inspect its local symbol table `(fn as any).locals`.
- **Hint 1**: `(fn as any).locals` is a `ts.SymbolTable`.

#### Exercise 4: Distinguish class static vs instance members via symbols
- **Task**: Inspect the `members` map vs `exports` map of a class symbol.
- **Hint 1**: Instance members are in `symbol.members`; static members are in `symbol.exports`.

---

### Exercise solutions

#### Solution 1: Identify Symbol Flags
```typescript
function isBlockScoped(symbol: ts.Symbol): boolean {
  return (symbol.flags & ts.SymbolFlags.BlockScopedVariable) !== 0;
}
```

#### Solution 2: Find all declarations of an identifier
```typescript
function printDeclarations(symbol: ts.Symbol) {
  symbol.declarations?.forEach((decl) => {
    console.log(`Declaration kind: ${ts.SyntaxKind[decl.kind]}`);
  });
}
```

#### Solution 3: Inspect local variables in a function scope
```typescript
function getLocalSymbols(fnNode: ts.Node): string[] {
  const locals = (fnNode as any).locals as ts.SymbolTable | undefined;
  if (!locals) return [];
  const names: string[] = [];
  locals.forEach((sym) => names.push(sym.name));
  return names;
}
```

#### Solution 4: Distinguish class static vs instance members via symbols
```typescript
function inspectClassSymbol(classSym: ts.Symbol) {
  console.log("Instance members:");
  classSym.members?.forEach((m) => console.log(` - ${m.name}`));

  console.log("Static members:");
  classSym.exports?.forEach((m) => console.log(` - ${m.name}`));
}
```

---

### Recall
1. What compiler phase creates `Symbol` tables? The Binder.
2. What is the relationship between an AST Node and a Symbol? An AST node is a single syntax occurrence; a Symbol represents the logical identifier and can point to multiple declaration nodes.
3. How are static class members represented on a class Symbol? Stored in `symbol.exports`.

> **If you remember only one thing:**  
> The Binder creates `ts.Symbol` objects that unify multiple AST declarations of the same identifier across scopes.

---

# Topic 7: The Type Checker Engine API (`checker.getTypeAtLocation` and `TypeFlags`)

### 1. What is it?
The **Type Checker** (`ts.TypeChecker`) is the core engine of TypeScript. It is responsible for semantic type analysis: computing types, validating assignments, resolving generics, and generating diagnostics. Using `checker.getTypeAtLocation(node)`, you can query the computed static type of any AST node as a **`ts.Type`** object.

### 2. Why does it exist?
The AST only stores syntax text. Looking at `const x = "hello" + " world";`, the AST node is just a `BinaryExpression`. It does not tell you that `x` is of type `string`. The Type Checker calculates the actual types of expressions, variables, and return values dynamically.

### 3. Basic example

```typescript
import * as ts from "typescript";

const code = `
const num = 42;
const str = "hello";
const result = num > 50 ? str : null;
`;

const sourceFile = ts.createSourceFile("check.ts", code, ts.ScriptTarget.Latest, true);
const host = ts.createCompilerHost({});
const program = ts.createProgram(["check.ts"], {}, {
  ...host,
  getSourceFile: (name) => name === "check.ts" ? sourceFile : host.getSourceFile(name, ts.ScriptTarget.Latest),
});

const checker = program.getTypeChecker();

// Find the declaration 'const result = ...'
const lastStmt = sourceFile.statements[2] as ts.VariableStatement;
const decl = lastStmt.declarationList.declarations[0];

// Query the Type Checker for the computed type of 'result'
const type: ts.Type = checker.getTypeAtLocation(decl.name);

// Format the type as a human-readable string
console.log("Computed Type:", checker.typeToString(type)); // '"hello" | null' (or string | null)
console.log("Is Union Type:", (type.flags & ts.TypeFlags.Union) !== 0); // true
```

**Line-by-line explanation:**
- `const checker = program.getTypeChecker()`: Instantiates the Type Checker engine from the `Program`.
- `checker.getTypeAtLocation(decl.name)`: Asks the engine: "What is the static type of this identifier node at this location in the program?"
- `checker.typeToString(type)`: Converts the internal `ts.Type` representation into the human-readable string `"string | null"`.
- `type.flags & ts.TypeFlags.Union`: Checks the bitwise type flags to verify that the type is a union.

---

### 4. How it works inside TypeScript
1. **Lazy Evaluation**: The checker evaluates types on demand. It does not check a function or expression until diagnostics or `getTypeAtLocation` requests it.
2. **`TypeFlags` Bitmask**: Every `ts.Type` has bitwise flags (`TypeFlags.String`, `TypeFlags.Number`, `TypeFlags.Boolean`, `TypeFlags.Union`, `TypeFlags.Object`, `TypeFlags.Any`).
3. **Type Relationships**: The checker exposes methods like `checker.isTypeAssignableTo(fromType, toType)` to test subtyping compatibility.

---

### 5. More examples

#### Example 1: Testing assignability between two types
```typescript
function isAssignable(fromNode: ts.Node, toNode: ts.Node, checker: ts.TypeChecker): boolean {
  const fromType = checker.getTypeAtLocation(fromNode);
  const toType = checker.getTypeAtLocation(toNode);
  return (checker as any).isTypeAssignableTo(fromType, toType);
}
```

#### Example 2: Inspecting properties of an object type
```typescript
const objCode = `const user = { id: "101", active: true };`;
// Querying userType gives an Object type.
// checker.getPropertiesOfType(userType) returns an array of ts.Symbol objects for 'id' and 'active'!
```

---

### 6. Common mistakes

#### Mistake 1: Relying on `node.type` instead of `checker.getTypeAtLocation()`
```typescript
// WRONG: Looking for syntactic type annotation on inferred variables
const stmt = sourceFile.statements[0] as ts.VariableStatement;
const decl = stmt.declarationList.declarations[0];
console.log(decl.type); // undefined! (Because 'const x = 42;' has NO type annotation!)
```
**Why it fails:** `decl.type` only exists if the developer wrote an explicit annotation (like `const x: number = 42`). For inferred variables, `decl.type` is `undefined`. You MUST use `checker.getTypeAtLocation(decl.name)` to get the inferred type!

#### Mistake 2: Creating multiple type checkers
```typescript
// GOTCHA: Calling program.getTypeChecker() repeatedly
```
**Why it matters:** `program.getTypeChecker()` is cached on the program instance, but creating multiple `ts.Program` instances unnecessarily recomputes symbol and type caches, drastically slowing down execution.

---

### 7. Rules to remember
1. `node.type` is purely the AST syntax annotation; `checker.getTypeAtLocation(node)` is the real semantic type.
2. Use `checker.typeToString(type)` to convert types to strings for diagnostics.
3. Check `type.flags & ts.TypeFlags.*` to inspect type categories (Union, Intersection, String, etc.).
4. The Type Checker requires a `ts.Program`.

---

### Think first: Prediction puzzle
What does `checker.typeToString(checker.getTypeAtLocation(x))` return for `const x = 5 + 5;`?

```typescript
// In TypeScript with full literal inference
```

---

**Answer:**
```
number
```
**Explanation:** `5 + 5` evaluates to a numeric binary expression. The Type Checker computes its resulting type as `number`.

---

### Practice exercises

#### Exercise 1: Format type of an identifier
- **Task**: Given an AST node of an identifier, retrieve its computed type and log its formatted string.
- **Hint 1**: `checker.typeToString(checker.getTypeAtLocation(node))`.

#### Exercise 2: Check if a type is `any`
- **Task**: Write a function `isAnyType(type: ts.Type): boolean` using `TypeFlags.Any`.
- **Hint 1**: `(type.flags & ts.TypeFlags.Any) !== 0`.

#### Exercise 3: Inspect union constituent types
- **Task**: If a type is a union (`type.isUnion()`), log the string of each constituent type in `type.types`.
- **Hint 1**: Cast to `ts.UnionType` and iterate `.types`.

#### Exercise 4: Query function return type
- **Task**: Given a function declaration node, obtain its signature and inspect `signature.getReturnType()`.
- **Hint 1**: `checker.getSignatureFromDeclaration(fn)?.getReturnType()`.

---

### Exercise solutions

#### Solution 1: Format type of an identifier
```typescript
function printType(node: ts.Node, checker: ts.TypeChecker): void {
  const t = checker.getTypeAtLocation(node);
  console.log("Type:", checker.typeToString(t));
}
```

#### Solution 2: Check if a type is `any`
```typescript
function isAnyType(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.Any) !== 0;
}
```

#### Solution 3: Inspect union constituent types
```typescript
function printUnionTypes(type: ts.Type, checker: ts.TypeChecker): void {
  if (type.isUnion()) {
    type.types.forEach((subType) => {
      console.log("Constituent:", checker.typeToString(subType));
    });
  }
}
```

#### Solution 4: Query function return type
```typescript
function getFnReturnType(fn: ts.FunctionDeclaration, checker: ts.TypeChecker): string {
  const sig = checker.getSignatureFromDeclaration(fn);
  if (!sig) return "unknown";
  return checker.typeToString(sig.getReturnType());
}
```

---

### Recall
1. Why is `checker.getTypeAtLocation(node)` superior to inspecting `node.type`? Because it returns the actual computed or inferred static type, even when no explicit syntax annotation was written.
2. How do you convert a `ts.Type` into a human-readable string? `checker.typeToString(type)`.
3. How do you check if a type is a string? `(type.flags & ts.TypeFlags.String) !== 0`.

> **If you remember only one thing:**  
> `checker.getTypeAtLocation(node)` queries the semantic engine for the real computed type, solving inferred types that AST annotations cannot provide.

---

# Topic 8: Creating Source Files with `ts.createSourceFile` and Isolated Transpilation (`ts.transpileModule`)

### 1. What is it?
The Compiler API provides two main entry points for processing code strings in memory:
1. **`ts.createSourceFile(fileName, sourceText, target, setParentNodes)`**: Parses text into an in-memory AST without running type checking.
2. **`ts.transpileModule(sourceText, options)`**: Transforms a single TypeScript source string into JavaScript in a single fast pass, erasing types without needing dependencies, type declarations, or a full project build.

### 2. Why does it exist?
Creating a full `ts.Program` requires scanning the disk, reading `tsconfig.json`, and resolving imported modules—which can take hundreds of milliseconds.
- For linting or AST parsing, `createSourceFile` provides an instant AST in less than 2 milliseconds.
- For build bundlers (like Vite or Jest), `transpileModule` converts `.ts` to `.js` instantaneously on a per-file basis.

### 3. Basic example

```typescript
import * as ts from "typescript";

const code = `
interface User { id: string; }
const greet = (u: User): string => {
  return "Hello " + u.id;
};
`;

// 1. In-memory AST creation
const sourceFile = ts.createSourceFile("virtual.ts", code, ts.ScriptTarget.ES2022, true);
console.log("AST Statements Count:", sourceFile.statements.length); // 2

// 2. Isolated Transpilation to ES5 JavaScript
const transpiled = ts.transpileModule(code, {
  compilerOptions: {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
  },
});

console.log("Transpiled ES5 Output:");
console.log(transpiled.outputText.trim());
```

**Line-by-line explanation:**
- `ts.createSourceFile(...)`: Parses `code` into a `ts.SourceFile` completely in memory.
- `ts.transpileModule(...)`: Transpiles the code string in isolation:
  - Completely strips `interface User`.
  - Lowers the arrow function `(u) => ...` into an ES5 `function (u) { ... }`.
  - Returns `{ outputText, diagnostics, sourceMapText }`.

---

### 4. How it works inside TypeScript
1. **Isolated Context**: `transpileModule` creates an internal, short-lived Compiler Host in memory containing only that single file.
2. **Type Erasure**: Because `transpileModule` does not have access to other files, it cannot resolve imported types. Any syntax requiring cross-file knowledge (like `const enum` without `preserveConstEnums`) will be erased or throw a warning.
3. **AST Caching**: `createSourceFile` parses the text into an immutable tree of plain JavaScript objects.

---

### 5. More examples

#### Example 1: Extracting generated source maps from `transpileModule`
```typescript
const result = ts.transpileModule(code, {
  compilerOptions: {
    target: ts.ScriptTarget.ESNext,
    sourceMap: true,
  },
  fileName: "index.ts",
});

console.log("Source Map JSON:", result.sourceMapText);
```

#### Example 2: Parsing with JSX support enabled
```typescript
const jsxCode = `const el = <div className="card">Hello</div>;`;
const jsxSourceFile = ts.createSourceFile(
  "component.tsx",
  jsxCode,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX // Important for parsing JSX syntax!
);
```

---

### 6. Common mistakes

#### Mistake 1: Expecting `transpileModule` to catch syntax or type errors
```typescript
// GOTCHA: transpileModule does not fail on type errors
const res = ts.transpileModule("const x: number = 'text';", {});
// res.outputText will be "const x = 'text';" with zero errors reported!
```
**Why it matters:** Isolated transpilation is purely syntactic code generation. It never performs type checking.

#### Mistake 2: Missing `ScriptKind.TSX` when parsing JSX files
```typescript
// WRONG: Parsing JSX in a file named "file.ts" without TSX ScriptKind
const badSf = ts.createSourceFile("file.ts", "const el = <div/>;", ts.ScriptTarget.Latest);
// Fails with syntax errors because .ts parses '<' as a less-than operator!
```
**Why it fails:** Name JSX files with `.tsx` or explicitly specify `ts.ScriptKind.TSX`.

---

### 7. Rules to remember
1. `ts.createSourceFile` creates an AST instantly in memory without filesystem access.
2. `ts.transpileModule` transforms single files to JavaScript without type checking.
3. Pass `.tsx` or `ts.ScriptKind.TSX` when working with JSX syntax.
4. Set `sourceMap: true` in `transpileModule` to generate sourcemaps.

---

### Think first: Prediction puzzle
Does `ts.transpileModule` preserve comments in the emitted JavaScript?

```typescript
const code = `
// Important developer note
const x: number = 10;
`;
const out = ts.transpileModule(code, { compilerOptions: { removeComments: false } });
console.log(out.outputText.includes("Important developer note"));
```

---

**Answer:**
```
true
```
**Explanation:** When `removeComments` is `false` (the default), comments are preserved during transpilation.

---

### Practice exercises

#### Exercise 1: Transpile with custom target
- **Task**: Transpile `async function load() {}` to ES2015.
- **Hint 1**: Set `compilerOptions: { target: ts.ScriptTarget.ES2015 }`.

#### Exercise 2: Parse virtual file without parent nodes
- **Task**: Call `ts.createSourceFile` with `setParentNodes = false` and confirm `node.parent` is undefined.
- **Hint 1**: Omit fourth argument or pass `false`.

#### Exercise 3: Remove comments during transpilation
- **Task**: Configure `transpileModule` with `removeComments: true` and verify comments are stripped.
- **Hint 1**: `compilerOptions: { removeComments: true }`.

#### Exercise 4: Transpile JSX to `React.createElement`
- **Task**: Configure `transpileModule` to compile `<h1/>` into `React.createElement("h1", null)`.
- **Hint 1**: `compilerOptions: { jsx: ts.JsxEmit.React }`.

---

### Exercise solutions

#### Solution 1: Transpile with custom target
```typescript
const asyncCode = `async function load() { return 1; }`;
const res = ts.transpileModule(asyncCode, {
  compilerOptions: { target: ts.ScriptTarget.ES2015 },
});
console.log(res.outputText);
```

#### Solution 2: Parse virtual file without parent nodes
```typescript
const sfFast = ts.createSourceFile("fast.ts", "const a = 1;", ts.ScriptTarget.Latest, false);
console.log(sfFast.statements[0].parent === undefined); // true
```

#### Solution 3: Remove comments during transpilation
```typescript
const commented = `// comment\nconst x = 1;`;
const cleanOut = ts.transpileModule(commented, {
  compilerOptions: { removeComments: true },
});
console.log(cleanOut.outputText.includes("//")); // false
```

#### Solution 4: Transpile JSX to `React.createElement`
```typescript
const jsxCode = `const el = <h1>Hello</h1>;`;
const reactOut = ts.transpileModule(jsxCode, {
  fileName: "app.tsx",
  compilerOptions: { jsx: ts.JsxEmit.React },
});
console.log(reactOut.outputText.includes("React.createElement")); // true
```

---

### Recall
1. What does `ts.createSourceFile` return? A `ts.SourceFile` root AST node.
2. Why is `ts.transpileModule` fast? Because it only runs the Scanner, Parser, and Emitter, skipping the Type Checker.
3. What happens to TypeScript interfaces during `transpileModule`? They are completely erased from the output.

> **If you remember only one thing:**  
> `ts.createSourceFile` produces fast in-memory ASTs, while `ts.transpileModule` converts single TypeScript files directly to JavaScript without type checking.

---

# Topic 9: The Node Factory API (`ts.factory.create*` and `ts.factory.update*`)

### 1. What is it?
The **Node Factory** (`ts.factory`) is the official API used to synthesize new AST nodes and clone/update existing nodes during code generation and AST transformations.
- **`ts.factory.create*`**: Synthesizes brand-new nodes (e.g., `factory.createIdentifier("x")`, `factory.createCallExpression(...)`).
- **`ts.factory.update*`**: Returns a modified shallow copy of an existing node if any children changed, or returns the original node unchanged if children were identical.

### 2. Why does it exist?
Directly mutating properties on AST nodes (e.g. `node.name = newIdentifier`) is strictly forbidden in the TypeScript compiler. Modifying existing nodes corrupts source position offsets and internal compiler caches. The Node Factory creates clean immutable synthetic nodes.

### 3. Basic example

```typescript
import * as ts from "typescript";

// Synthesize: const result = 100 + 200;
const identifier = ts.factory.createIdentifier("result");
const left = ts.factory.createNumericLiteral(100);
const right = ts.factory.createNumericLiteral(200);

const binaryExpr = ts.factory.createBinaryExpression(
  left,
  ts.SyntaxKind.PlusToken,
  right
);

const variableDecl = ts.factory.createVariableDeclaration(
  identifier,
  /* exclamationToken */ undefined,
  /* type */ undefined,
  binaryExpr
);

const varStatement = ts.factory.createVariableStatement(
  /* modifiers */ undefined,
  ts.factory.createVariableDeclarationList(
    [variableDecl],
    ts.NodeFlags.Const
  )
);

// Print the synthesized node to source text
const printer = ts.createPrinter();
const sourceFile = ts.createSourceFile("output.ts", "", ts.ScriptTarget.Latest);
const outputText = printer.printNode(ts.EmitHint.Unspecified, varStatement, sourceFile);

console.log(outputText); // "const result = 100 + 200;"
```

**Line-by-line explanation:**
- `ts.factory.createIdentifier("result")`: Synthesizes an `Identifier` node.
- `ts.factory.createNumericLiteral(100)`: Synthesizes a numeric literal node.
- `ts.factory.createBinaryExpression(...)`: Combines operands with `PlusToken`.
- `ts.factory.createVariableDeclarationList([variableDecl], ts.NodeFlags.Const)`: Marks the declaration as a `const`.
- `printer.printNode(...)`: Formats the synthetic AST into a clean JavaScript/TypeScript string.

---

### 4. How it works inside TypeScript
1. **Synthetic Nodes**: Nodes created via `ts.factory` have `pos: -1` and `end: -1` because they do not originate from an original text source file.
2. **`update*` Structural Sharing**: If you call `ts.factory.updateBinaryExpression(node, node.left, node.operatorToken, node.right)`, the factory detects that no child changed and returns the **identical `node` reference** to save memory.
3. **Compiler Context**: In AST transformers, you receive a scoped factory via `context.factory`.

---

### 5. More examples

#### Example 1: Synthesizing a function call (`console.log("hello")`)
```typescript
const callExpr = ts.factory.createCallExpression(
  ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier("console"),
    ts.factory.createIdentifier("log")
  ),
  /* typeArguments */ undefined,
  /* argumentsArray */ [ts.factory.createStringLiteral("hello")]
);

const stmt = ts.factory.createExpressionStatement(callExpr);
console.log(printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile));
// "console.log("hello");"
```

#### Example 2: Updating an existing return statement
```typescript
function wrapReturnValue(retStmt: ts.ReturnStatement): ts.ReturnStatement {
  if (!retStmt.expression) return retStmt;

  // Wrap return expression in an array: [expr]
  const newExpr = ts.factory.createArrayLiteralExpression([retStmt.expression]);
  return ts.factory.updateReturnStatement(retStmt, newExpr);
}
```

---

### 6. Common mistakes

#### Mistake 1: Directly mutating properties on existing AST nodes
```typescript
// WRONG: In-place mutation corrupts compiler internals!
(decl as any).name = ts.factory.createIdentifier("newName");
```
**Why it fails:** Mutating existing nodes causes unpredictable bugs in the emitter and type checker. Always use `ts.factory.update*` to return an updated copy.

#### Mistake 2: Using deprecated `ts.create*` functions
```typescript
// DEPRECATED in modern TypeScript:
ts.createIdentifier("x"); // TS warning: ts.createIdentifier is deprecated, use ts.factory.createIdentifier
```
**Why it matters:** TypeScript 4.0+ moved all node creation to `ts.factory`. Always use `ts.factory.create*`.

---

### 7. Rules to remember
1. Always use `ts.factory.create*` to create synthetic nodes.
2. Always use `ts.factory.update*` when modifying existing nodes.
3. Never mutate existing AST node properties in-place.
4. Synthetic nodes have `pos: -1` and `end: -1`.

---

### Think first: Prediction puzzle
What does `printer.printNode` output for `ts.factory.createIdentifier("myVar")`?

```typescript
const id = ts.factory.createIdentifier("myVar");
const p = ts.createPrinter();
console.log(p.printNode(ts.EmitHint.Unspecified, id, sourceFile));
```

---

**Answer:**
```
myVar
```
**Explanation:** The printer converts the synthetic `Identifier` node directly to its string name `"myVar"`.

---

### Practice exercises

#### Exercise 1: Synthesize a string literal
- **Task**: Synthesize a string literal `"production"` and print it.
- **Hint 1**: `ts.factory.createStringLiteral("production")`.

#### Exercise 2: Synthesize a return statement
- **Task**: Create a return statement returning the boolean literal `true`.
- **Hint 1**: `ts.factory.createReturnStatement(ts.factory.createTrue())`.

#### Exercise 3: Synthesize an arrow function
- **Task**: Create an arrow function `() => 42`.
- **Hint 1**: `ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.factory.createNumericLiteral(42))`.

#### Exercise 4: Update a block to prepend a statement
- **Task**: Use `ts.factory.updateBlock` to add a new statement to the start of a `Block` node's statements array.
- **Hint 1**: `ts.factory.updateBlock(block, [newStmt, ...block.statements])`.

---

### Exercise solutions

#### Solution 1: Synthesize a string literal
```typescript
const strNode = ts.factory.createStringLiteral("production");
console.log(printer.printNode(ts.EmitHint.Unspecified, strNode, sourceFile)); // '"production"'
```

#### Solution 2: Synthesize a return statement
```typescript
const retTrue = ts.factory.createReturnStatement(ts.factory.createTrue());
console.log(printer.printNode(ts.EmitHint.Unspecified, retTrue, sourceFile)); // "return true;"
```

#### Solution 3: Synthesize an arrow function
```typescript
const arrow = ts.factory.createArrowFunction(
  undefined,
  undefined,
  [],
  undefined,
  ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
  ts.factory.createNumericLiteral(42)
);
console.log(printer.printNode(ts.EmitHint.Unspecified, arrow, sourceFile)); // "() => 42"
```

#### Solution 4: Update a block to prepend a statement
```typescript
function prependToBlock(block: ts.Block, stmt: ts.Statement): ts.Block {
  return ts.factory.updateBlock(block, [stmt, ...block.statements]);
}
```

---

### Recall
1. Where are node creation functions located in modern TypeScript? On the `ts.factory` object.
2. Why should you never mutate AST nodes in place? Because mutating nodes corrupts internal compiler caches, source positions, and emitter state.
3. What is the value of `pos` and `end` on synthetic nodes created by `ts.factory`? `-1`.

> **If you remember only one thing:**  
> Use `ts.factory.create*` to synthesize new nodes and `ts.factory.update*` to immutably replace existing nodes.

---

# Topic 10: Writing a Custom AST Transformer (`ts.TransformerFactory`)

### 1. What is it?
A **Custom AST Transformer** (`ts.TransformerFactory`) is a function plugin that hooks into the TypeScript compiler pipeline to inspect, rewrite, or inject AST nodes before target code emission. It receives a `ts.TransformationContext` and returns a visitor function that traverses and transforms the tree.

### 2. Why does it exist?
Transformers automate code transformations across entire projects:
- Injecting telemetry and profiling timers into all functions.
- Stripping `console.log` statements in production builds.
- Generating GraphQL or JSON schemas from TypeScript type declarations.
- Replacing environment constants with literal values during compilation.

### 3. Basic example

```typescript
import * as ts from "typescript";

// A transformer that removes all console.log statements
const removeConsoleLogsTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node | undefined => {
      // Check if node is: console.log(...)
      if (
        ts.isExpressionStatement(node) &&
        ts.isCallExpression(node.expression) &&
        ts.isPropertyAccessExpression(node.expression.expression)
      ) {
        const propAccess = node.expression.expression;
        if (
          ts.isIdentifier(propAccess.expression) &&
          propAccess.expression.text === "console" &&
          propAccess.name.text === "log"
        ) {
          // Returning undefined DELETES the node from the AST!
          return undefined;
        }
      }

      // Continue visiting child nodes recursively
      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};

// Running the transformer
const originalCode = `
console.log("Debug message");
const secret = 42;
console.log("Another debug");
`;

const result = ts.transform(
  ts.createSourceFile("input.ts", originalCode, ts.ScriptTarget.Latest, true),
  [removeConsoleLogsTransformer]
);

const printer = ts.createPrinter();
const transformedSource = printer.printFile(result.transformed[0]);
console.log("Transformed Output:");
console.log(transformedSource.trim());
// Output: "const secret = 42;"
```

**Line-by-line explanation:**
- `ts.TransformerFactory<ts.SourceFile>`: The transformer contract. Accepts `context: ts.TransformationContext`.
- `return (sourceFile) => ...`: Returns a function that takes a `ts.SourceFile` and returns a transformed `ts.SourceFile`.
- `ts.visitNode(sourceFile, visitor)`: Initiates visitor traversal starting at the root.
- `ts.visitEachChild(node, visitor, context)`: Rewrites children of `node` using the visitor.
- `return undefined`: Returning `undefined` instructs TypeScript to delete this statement from the AST.

---

### 4. How it works inside TypeScript
1. **Pipeline Insertion**: Transformers run right before Phase 5 (Emitter), modifying the AST after the Type Checker has finished verifying correctness.
2. **Context Access**: `context.factory` provides the Node Factory scoped to this transformation run.
3. **Tree Rebuilding**: `ts.visitEachChild` returns a new node reference if any child was replaced or deleted, leaving unmodified subtrees structurally shared.

---

### 5. More examples

#### Example 1: Renaming identifier variables across a file
```typescript
const renameFooToBarTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isIdentifier(node) && node.text === "foo") {
        return context.factory.createIdentifier("bar");
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};
```

#### Example 2: Injecting a statement at the start of every function
```typescript
const injectEntryLogTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isFunctionDeclaration(node) && node.body) {
        const logStmt = context.factory.createExpressionStatement(
          context.factory.createCallExpression(
            context.factory.createPropertyAccessExpression(
              context.factory.createIdentifier("console"),
              context.factory.createIdentifier("log")
            ),
            undefined,
            [context.factory.createStringLiteral(`Entering: ${node.name?.text ?? "anonymous"}`)]
          )
        );

        const updatedBody = context.factory.updateBlock(node.body, [logStmt, ...node.body.statements]);
        return context.factory.updateFunctionDeclaration(
          node,
          node.modifiers,
          node.asteriskToken,
          node.name,
          node.typeParameters,
          node.parameters,
          node.type,
          updatedBody
        );
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};
```

---

### 6. Common mistakes

#### Mistake 1: Forgetting `ts.visitEachChild` on unhandled nodes
```typescript
// WRONG: Returning 'node' without visiting children
const visitor = (node: ts.Node): ts.Node => {
  if (ts.isIdentifier(node)) {
    // ...
  }
  return node; // STOPPED RECURSION! Children are NEVER visited!
};
```
**Why it fails:** If you return `node` directly without calling `ts.visitEachChild(node, visitor, context)`, the visitor will not traverse into the node's children.

#### Mistake 2: Calling `node.getText()` on synthetic nodes inside a transformer
```typescript
// WRONG: Calling getText() on factory-created node
const newId = context.factory.createIdentifier("x");
console.log(newId.getText()); // Crashes!
```
**Why it fails:** Synthetic nodes have no source text. Use `newId.text` to inspect identifier names.

---

### 7. Rules to remember
1. A transformer receives `context: ts.TransformationContext` and returns `(sf: ts.SourceFile) => ts.SourceFile`.
2. Returning `undefined` from a statement visitor deletes that statement from the AST.
3. Always call `ts.visitEachChild(node, visitor, context)` to continue recursive traversal down the tree.
4. Use `context.factory` to synthesize or update nodes inside transformers.

---

### Think first: Prediction puzzle
What happens when a visitor returns `undefined` for a `ts.isVariableStatement(node)`?

```typescript
// if (ts.isVariableStatement(node)) return undefined;
```

---

**Answer:**
```
The variable statement is deleted from the generated JavaScript.
```
**Explanation:** When transforming statement lists, returning `undefined` from the visitor informs the compiler to omit that statement from the output.

---

### Practice exercises

#### Exercise 1: Replace numeric literal
- **Task**: Write a transformer that replaces all numeric literals equal to `0` with `-1`.
- **Hint 1**: `if (ts.isNumericLiteral(node) && node.text === "0") return context.factory.createNumericLiteral(-1)`.

#### Exercise 2: Strip debugger statements
- **Task**: Write a transformer that deletes all `debugger;` statements.
- **Hint 1**: `if (ts.isDebuggerStatement(node)) return undefined`.

#### Exercise 3: Capitalize string literals
- **Task**: Write a transformer that converts all string literal values to uppercase.
- **Hint 1**: `return context.factory.createStringLiteral(node.text.toUpperCase())`.

#### Exercise 4: Convert `var` to `let`
- **Task**: Write a transformer that converts any `var` declaration list to `let`.
- **Hint 1**: Check `ts.isVariableDeclarationList` and replace flags with `ts.NodeFlags.Let`.

---

### Exercise solutions

#### Solution 1: Replace numeric literal
```typescript
const replaceZeroTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isNumericLiteral(node) && node.text === "0") {
        return context.factory.createNumericLiteral(-1);
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};
```

#### Solution 2: Strip debugger statements
```typescript
const stripDebuggerTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node | undefined => {
      if (ts.isDebuggerStatement(node)) {
        return undefined; // deletes node
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};
```

#### Solution 3: Capitalize string literals
```typescript
const upperStringTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isStringLiteral(node)) {
        return context.factory.createStringLiteral(node.text.toUpperCase());
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};
```

#### Solution 4: Convert `var` to `let`
```typescript
const varToLetTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isVariableDeclarationList(node) && !(node.flags & (ts.NodeFlags.Const | ts.NodeFlags.Let))) {
        return context.factory.updateVariableDeclarationList(node, node.declarations);
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};
```

---

### Recall
1. What function is used to continue visitor recursion inside a transformer? `ts.visitEachChild(node, visitor, context)`.
2. How do you delete a statement from an AST in a transformer? Return `undefined` from the visitor.
3. Where do transformers sit in the 5-phase compiler pipeline? Between the Checker and the Emitter.

> **If you remember only one thing:**  
> Custom AST transformers hook into the compiler to rewrite nodes recursively using `ts.visitEachChild` before final JavaScript emission.

---

# Checkpoint Challenge 2: Type Checking & AST Transformation (Topics 6-10)

### Challenge Specification
Construct a production **Auto-Profiling AST Transformer** that:
1. Identifies every `FunctionDeclaration` in a TypeScript file.
2. Synthesizes a timer entry: `const __t0 = performance.now();` at the beginning of the function body.
3. Synthesizes a timer exit: `console.log("[Profile] functionName took:", performance.now() - __t0);` before every return statement.
4. Uses `ts.transform` and `ts.createPrinter` to generate the transformed source code.

### Solution

```typescript
import * as ts from "typescript";

// 1. Production Profiling Transformer
const profilingTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  const { factory } = context;

  return (sourceFile) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isFunctionDeclaration(node) && node.body && node.name) {
        const fnName = node.name.text;

        // Statement 1: const __t0 = performance.now();
        const startTimerStmt = factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                factory.createIdentifier("__t0"),
                undefined,
                undefined,
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("performance"),
                    factory.createIdentifier("now")
                  ),
                  undefined,
                  []
                )
              ),
            ],
            ts.NodeFlags.Const
          )
        );

        // Helper to synthesize: console.log("[Profile] " + fnName + " completed in", performance.now() - __t0);
        const createLogStmt = () =>
          factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier("console"),
                factory.createIdentifier("log")
              ),
              undefined,
              [
                factory.createStringLiteral(`[Profile] ${fnName} completed in:`),
                factory.createBinaryExpression(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier("performance"),
                      factory.createIdentifier("now")
                    ),
                    undefined,
                    []
                  ),
                  ts.SyntaxKind.MinusToken,
                  factory.createIdentifier("__t0")
                ),
              ]
            )
          );

        // Visit inside function body to inject logging before return statements
        const bodyVisitor = (child: ts.Node): ts.Node => {
          if (ts.isReturnStatement(child)) {
            // Return statement: execute log right before returning
            return factory.createBlock([createLogStmt(), child], true);
          }
          return ts.visitEachChild(child, bodyVisitor, context);
        };

        const transformedStatements = node.body.statements.map((stmt) =>
          ts.visitNode(stmt, bodyVisitor) as ts.Statement
        );

        const newBody = factory.updateBlock(node.body, [startTimerStmt, ...transformedStatements]);

        return factory.updateFunctionDeclaration(
          node,
          node.modifiers,
          node.asteriskToken,
          node.name,
          node.typeParameters,
          node.parameters,
          node.type,
          newBody
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
};

// 2. Verification Execution
function runCheckpoint2() {
  const code = `
  function computeTask(limit: number): number {
    let sum = 0;
    for (let i = 0; i < limit; i++) {
      sum += i;
    }
    return sum;
  }
  `;

  const sf = ts.createSourceFile("math.ts", code, ts.ScriptTarget.Latest, true);
  const result = ts.transform(sf, [profilingTransformer]);

  const printer = ts.createPrinter();
  const transformedCode = printer.printFile(result.transformed[0]);

  console.log("Transformed Output with Injected Telemetry:");
  console.log(transformedCode);
}
runCheckpoint2();
```


---

# Topic 11: Programmatic Code Generation with `ts.Printer`

### 1. What is it?
The **Printer** (`ts.Printer`) is the code serializer of the TypeScript Compiler API. It takes an AST node or an entire `ts.SourceFile` and formats it into clean, valid TypeScript or JavaScript text according to configurable formatting options (`newLine`, `removeComments`).

### 2. Why does it exist?
While `node.getText()` works for existing nodes read from a file on disk, `node.getText()` fails on synthetic nodes created with `ts.factory` because synthetic nodes do not have original text offsets. `ts.Printer` walks the AST tree and writes the corresponding code string from scratch.

### 3. Basic example

```typescript
import * as ts from "typescript";

// 1. Create a Printer with options
const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
});

// 2. Synthesize an interface:
// interface UserDTO { id: string; active: boolean; }
const idMember = ts.factory.createPropertySignature(
  /* modifiers */ undefined,
  ts.factory.createIdentifier("id"),
  /* questionToken */ undefined,
  ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
);

const activeMember = ts.factory.createPropertySignature(
  undefined,
  ts.factory.createIdentifier("active"),
  undefined,
  ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
);

const interfaceDecl = ts.factory.createInterfaceDeclaration(
  [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
  ts.factory.createIdentifier("UserDTO"),
  /* typeParameters */ undefined,
  /* heritageClauses */ undefined,
  [idMember, activeMember]
);

// 3. Print the node
const dummySourceFile = ts.createSourceFile("temp.ts", "", ts.ScriptTarget.Latest);
const printedCode = printer.printNode(ts.EmitHint.Unspecified, interfaceDecl, dummySourceFile);

console.log(printedCode);
```

**Output:**
```typescript
export interface UserDTO {
    id: string;
    active: boolean;
}
```

**Line-by-line explanation:**
- `ts.createPrinter(...)`: Instantiates the printer.
- `ts.factory.createPropertySignature(...)`: Synthesizes type properties.
- `ts.factory.createInterfaceDeclaration(...)`: Combines properties into an `export interface UserDTO`.
- `printer.printNode(...)`: Takes an `EmitHint`, the node to print, and a reference `SourceFile` (used for indentation and line terminator configuration).

---

### 4. How it works inside TypeScript
1. **`EmitHint`**: Tells the printer how to format the node:
   - `ts.EmitHint.SourceFile`: Prints an entire source file with module headers.
   - `ts.EmitHint.Expression`: Formats a single expression without a trailing semicolon.
   - `ts.EmitHint.Unspecified`: General formatting for statements or declarations.
2. **Indentation Tracking**: The printer maintains internal indentation column state, indenting nested blocks and object literals automatically.
3. **Comment Preservation**: If `removeComments: false`, comments attached via `ts.addSyntheticLeadingComment` will be printed alongside the nodes.

---

### 5. More examples

#### Example 1: Printing an entire synthesized SourceFile with `printFile`
```typescript
const syntheticSourceFile = ts.factory.createSourceFile(
  [interfaceDecl],
  ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
  ts.NodeFlags.None
);

const fullFileText = printer.printFile(syntheticSourceFile);
console.log(fullFileText);
```

#### Example 2: Attaching synthetic comments to generated code
```typescript
const commentNode = ts.addSyntheticLeadingComment(
  interfaceDecl,
  ts.SyntaxKind.SingleLineCommentTrivia,
  " Auto-generated by TypeScript Code Generator. Do not edit manually.",
  /* hasTrailingNewLine */ true
);

console.log(printer.printNode(ts.EmitHint.Unspecified, commentNode, dummySourceFile));
```

---

### 6. Common mistakes

#### Mistake 1: Passing `undefined` as the third argument to `printNode`
```typescript
// WRONG: Omitting the sourceFile argument
printer.printNode(ts.EmitHint.Unspecified, node); // TypeError: Cannot read properties of undefined!
```
**Why it fails:** `printNode` requires a reference `ts.SourceFile` to resolve formatting preferences and line feeds. Pass a dummy source file (`ts.createSourceFile("dummy.ts", "", ts.ScriptTarget.Latest)`).

#### Mistake 2: Using `printFile` on a node that is not a `SourceFile`
```typescript
// WRONG: Calling printFile on an InterfaceDeclaration
printer.printFile(interfaceDecl as any); // Throws runtime exception!
```
**Why it fails:** `printFile` expects a `ts.SourceFile`. For individual statements or expressions, use `printNode(ts.EmitHint.Unspecified, node, dummySourceFile)`.

---

### 7. Rules to remember
1. Always pass a `SourceFile` reference to `printer.printNode`.
2. Use `ts.createPrinter({ removeComments: false })` to keep comments in output.
3. Use `ts.addSyntheticLeadingComment` to add comments to factory-created nodes.
4. Use `ts.EmitHint.Expression` when printing isolated expressions without semicolons.

---

### Think first: Prediction puzzle
What does `printNode` output when using `ts.EmitHint.Expression` on `ts.factory.createNumericLiteral(42)`?

```typescript
const num = ts.factory.createNumericLiteral(42);
const dummy = ts.createSourceFile("d.ts", "", ts.ScriptTarget.Latest);
console.log(printer.printNode(ts.EmitHint.Expression, num, dummy));
```

---

**Answer:**
```
42
```
**Explanation:** `EmitHint.Expression` prints the raw expression without statement wrappers or trailing semicolons.

---

### Practice exercises

#### Exercise 1: Generate a typed constant statement
- **Task**: Use `ts.factory` and `ts.Printer` to generate `export const API_VERSION: string = "2.0";`.
- **Hint 1**: `ts.factory.createVariableStatement([ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)], ...)`.

#### Exercise 2: Generate an enum declaration
- **Task**: Synthesize an enum `Direction` with members `Up = 1`, `Down = 2`.
- **Hint 1**: `ts.factory.createEnumDeclaration(undefined, "Direction", [enumMemberUp, enumMemberDown])`.

#### Exercise 3: Add doc comments to generated function
- **Task**: Add a multiline JSDoc comment `/** Calculates tax */` to a synthesized function declaration.
- **Hint 1**: `ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, "* Calculates tax ", true)`.

#### Exercise 4: Print formatted JSON object AST
- **Task**: Create an `ObjectLiteralExpression` with two properties and print it.
- **Hint 1**: `ts.factory.createObjectLiteralExpression([prop1, prop2], true)`.

---

### Exercise solutions

#### Solution 1: Generate a typed constant statement
```typescript
const constDecl = ts.factory.createVariableStatement(
  [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
  ts.factory.createVariableDeclarationList(
    [
      ts.factory.createVariableDeclaration(
        ts.factory.createIdentifier("API_VERSION"),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        ts.factory.createStringLiteral("2.0")
      ),
    ],
    ts.NodeFlags.Const
  )
);
console.log(printer.printNode(ts.EmitHint.Unspecified, constDecl, dummySourceFile));
```

#### Solution 2: Generate an enum declaration
```typescript
const enumDecl = ts.factory.createEnumDeclaration(
  undefined,
  ts.factory.createIdentifier("Direction"),
  [
    ts.factory.createEnumMember("Up", ts.factory.createNumericLiteral(1)),
    ts.factory.createEnumMember("Down", ts.factory.createNumericLiteral(2)),
  ]
);
console.log(printer.printNode(ts.EmitHint.Unspecified, enumDecl, dummySourceFile));
```

#### Solution 3: Add doc comments to generated function
```typescript
const fnDecl = ts.factory.createFunctionDeclaration(
  undefined,
  undefined,
  ts.factory.createIdentifier("calcTax"),
  undefined,
  [],
  undefined,
  ts.factory.createBlock([])
);

ts.addSyntheticLeadingComment(
  fnDecl,
  ts.SyntaxKind.MultiLineCommentTrivia,
  "*\n * Calculates tax\n ",
  true
);

console.log(printer.printNode(ts.EmitHint.Unspecified, fnDecl, dummySourceFile));
```

#### Solution 4: Print formatted JSON object AST
```typescript
const obj = ts.factory.createObjectLiteralExpression(
  [
    ts.factory.createPropertyAssignment("env", ts.factory.createStringLiteral("prod")),
    ts.factory.createPropertyAssignment("port", ts.factory.createNumericLiteral(8080)),
  ],
  true
);
console.log(printer.printNode(ts.EmitHint.Expression, obj, dummySourceFile));
```

---

### Recall
1. Why does `node.getText()` fail on synthetic nodes? Synthetic nodes do not have source text offsets (`pos: -1`).
2. What tool converts synthetic AST nodes into code text? `ts.Printer`.
3. How do you attach a comment to a generated node? Using `ts.addSyntheticLeadingComment(node, ...)`.

> **If you remember only one thing:**  
> Use `ts.createPrinter().printNode(...)` to serialize AST structures into clean formatted TypeScript code text.

---

# Topic 12: Source Code Modification & Synthetic Node Insertion

### 1. What is it?
**Synthetic Node Insertion** is the process of generating new code constructs programmatically and inserting them into an existing AST. Unlike simple string concatenation, inserting synthetic AST nodes guarantees syntactic correctness and preserves valid parent-child relationships.

### 2. Why does it exist?
Using regular expressions or string replacements to insert code (`code.replace("class User {", "class User {\n id = 1;")`) is brittle. It breaks on formatting differences, comments, or nested blocks. AST-based insertion understands the syntax tree and inserts statements precisely where intended.

### 3. Basic example

```typescript
import * as ts from "typescript";

// Original source
const sourceCode = `
class TaskRunner {
  execute() {
    return 100;
  }
}
`;

const sourceFile = ts.createSourceFile("task.ts", sourceCode, ts.ScriptTarget.Latest, true);

// Transformer that inserts a synthetic property into every class:
// readonly instanceId = Math.random().toString();
const insertPropertyTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  const { factory } = context;

  return (sf) => {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isClassDeclaration(node)) {
        // Synthesize new member: readonly instanceId: string = "id_101";
        const syntheticMember = factory.createPropertyDeclaration(
          [factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
          factory.createIdentifier("instanceId"),
          undefined,
          factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          factory.createStringLiteral("id_101")
        );

        // Prepend synthetic member to existing class members
        return factory.updateClassDeclaration(
          node,
          node.modifiers,
          node.name,
          node.typeParameters,
          node.heritageClauses,
          [syntheticMember, ...node.members]
        );
      }
      return ts.visitEachChild(node, visitor, context);
    };

    return ts.visitNode(sf, visitor) as ts.SourceFile;
  };
};

const result = ts.transform(sourceFile, [insertPropertyTransformer]);
const printer = ts.createPrinter();
console.log(printer.printFile(result.transformed[0]));
```

**Output:**
```typescript
class TaskRunner {
    readonly instanceId: string = "id_101";
    execute() {
        return 100;
    }
}
```

**Line-by-line explanation:**
- `factory.createPropertyDeclaration(...)`: Synthesizes a new class field with a `readonly` modifier, type annotation, and initial value.
- `[syntheticMember, ...node.members]`: Combines the new synthetic member with existing class members.
- `factory.updateClassDeclaration(...)`: Creates an updated copy of the class declaration holding the new member list.

---

### 4. How it works inside TypeScript
1. **Immutability Principle**: The original `ClassDeclaration` node is not modified. `factory.updateClassDeclaration` returns a fresh node with the new member array.
2. **Automatic Indentation**: The printer inspects the indentation level of the class body and indents the newly synthesized property automatically.
3. **Type Annotation Lowering**: If emitting to JavaScript, the emitter automatically erases `: string` and `readonly`, outputting clean `instanceId = "id_101";`.

---

### 5. More examples

#### Example 1: Inserting an import declaration at the top of a file
```typescript
function insertImportTransformer(moduleSpecifier: string, namedImport: string): ts.TransformerFactory<ts.SourceFile> {
  return (context) => (sf) => {
    const importStmt = context.factory.createImportDeclaration(
      undefined,
      context.factory.createImportClause(
        false,
        undefined,
        context.factory.createNamedImports([
          context.factory.createImportSpecifier(false, undefined, context.factory.createIdentifier(namedImport)),
        ])
      ),
      context.factory.createStringLiteral(moduleSpecifier)
    );

    return context.factory.updateSourceFile(sf, [importStmt, ...sf.statements]);
  };
}
```

---

### 6. Common mistakes

#### Mistake 1: Pushing into `node.members` directly
```typescript
// WRONG: In-place mutation of readonly AST array
(node.members as any).push(syntheticMember); // Corrupts AST caches!
```
**Why it fails:** AST arrays are immutable. Mutating them causes silent printer corruption. Always pass a new array to `factory.updateClassDeclaration(..., [synthetic, ...members])`.

#### Mistake 2: Missing string literal quotes on import specifiers
```typescript
// WRONG: Creating an identifier for module specifier instead of a string literal
factory.createImportDeclaration(..., factory.createIdentifier("lodash")); // Syntax error: import { x } from lodash;
```
**Why it fails:** In JavaScript grammar, module specifiers in `import` statements must be string literals (`factory.createStringLiteral("lodash")`), not bare identifiers.

---

### 7. Rules to remember
1. Always create new arrays when inserting nodes (`[newNode, ...existingNodes]`).
2. Pass updated arrays to `factory.update*` methods.
3. Module specifiers in imports/exports must be `StringLiteral` nodes.
4. The Printer formats synthetic nodes with proper indentation automatically.

---

### Think first: Prediction puzzle
Where is `import { log } from "logger";` inserted if you return `factory.updateSourceFile(sf, [importStmt, ...sf.statements])`?

---

**Answer:**
```
At the very top of the file before all other statements.
```
**Explanation:** Placing `importStmt` as the first element of the new statements array makes it the first statement in the file.

---

### Practice exercises

#### Exercise 1: Insert header comment at file top
- **Task**: Add a synthetic leading comment `// AUTO-GENERATED FILE` to the first statement of a source file.
- **Hint 1**: `ts.addSyntheticLeadingComment(sf.statements[0], ts.SyntaxKind.SingleLineCommentTrivia, " AUTO-GENERATED FILE", true)`.

#### Exercise 2: Append export statement to file
- **Task**: Append `export default TaskRunner;` to the end of a source file using `factory.createExportAssignment`.
- **Hint 1**: `factory.updateSourceFile(sf, [...sf.statements, exportAssignment])`.

#### Exercise 3: Prepend parameter to function
- **Task**: Update a function declaration to add a first parameter `context: ExecutionContext`.
- **Hint 1**: `factory.updateFunctionDeclaration(fn, ..., [newParam, ...fn.parameters], ...)`.

#### Exercise 4: Inject `use strict` directive
- **Task**: Inject an expression statement with `"use strict"` at the beginning of a source file if not present.
- **Hint 1**: `factory.createExpressionStatement(factory.createStringLiteral("use strict"))`.

---

### Exercise solutions

#### Solution 1: Insert header comment at file top
```typescript
function addHeaderComment(sf: ts.SourceFile): ts.SourceFile {
  if (sf.statements.length > 0) {
    ts.addSyntheticLeadingComment(
      sf.statements[0],
      ts.SyntaxKind.SingleLineCommentTrivia,
      " AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY",
      true
    );
  }
  return sf;
}
```

#### Solution 2: Append export statement to file
```typescript
function appendDefaultExport(sf: ts.SourceFile, name: string): ts.SourceFile {
  const exportStmt = ts.factory.createExportAssignment(
    undefined,
    undefined,
    ts.factory.createIdentifier(name)
  );
  return ts.factory.updateSourceFile(sf, [...sf.statements, exportStmt]);
}
```

#### Solution 3: Prepend parameter to function
```typescript
function prependParam(fn: ts.FunctionDeclaration, name: string, typeName: string): ts.FunctionDeclaration {
  const newParam = ts.factory.createParameterDeclaration(
    undefined,
    undefined,
    ts.factory.createIdentifier(name),
    undefined,
    ts.factory.createTypeReferenceNode(typeName)
  );
  return ts.factory.updateFunctionDeclaration(
    fn,
    fn.modifiers,
    fn.asteriskToken,
    fn.name,
    fn.typeParameters,
    [newParam, ...fn.parameters],
    fn.type,
    fn.body
  );
}
```

#### Solution 4: Inject `use strict` directive
```typescript
function injectUseStrict(sf: ts.SourceFile): ts.SourceFile {
  const directive = ts.factory.createExpressionStatement(
    ts.factory.createStringLiteral("use strict")
  );
  return ts.factory.updateSourceFile(sf, [directive, ...sf.statements]);
}
```

---

### Recall
1. Why is AST-based code insertion safer than regex replacement? It understands grammatical structure, avoiding syntax corruption from comments and formatting.
2. How do you add an import statement to a file AST? Prepend a synthetic `ImportDeclaration` to `sf.statements` via `factory.updateSourceFile`.
3. How do you ensure synthetic nodes match the formatting of existing code? The `ts.Printer` handles indentation and spacing automatically.

> **If you remember only one thing:**  
> Insert synthetic nodes immutably by prepending or appending to node arrays and updating the parent with `ts.factory.update*`.

---

# Topic 13: Building a Static Architecture Linter (Custom AST Rules)

### 1. What is it?
A **Static Architecture Linter** is an AST-based analysis tool that enforces architectural boundaries, naming conventions, or banned API usage across a codebase. Instead of using text grep, the linter inspects nodes, import paths, and syntax kinds to flag violations with exact file line numbers.

### 2. Why does it exist?
In large enterprise systems, architectural rules like:
- "Domain models must never import from database or HTTP controller layers."
- "All React hooks must start with `use`."
- "Raw `eval()` or `localStorage` calls are forbidden."
cannot be verified by standard type checking. An AST linter enforces these rules automatically in CI pipelines.

### 3. Basic example

```typescript
import * as ts from "typescript";

// Architectural rule: Files in 'domain/' must NOT import from 'infra/' or 'controllers/'
interface LintViolation {
  file: string;
  line: number;
  column: number;
  message: string;
}

function lintArchitecture(sourceFile: ts.SourceFile): LintViolation[] {
  const violations: LintViolation[] = [];

  function visit(node: ts.Node) {
    // Check all import declarations
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;

        if (importPath.includes("/infra/") || importPath.includes("/controllers/")) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          violations.push({
            file: sourceFile.fileName,
            line: line + 1,
            column: character + 1,
            message: `Architectural violation: Forbidden import of layer "${importPath}"`,
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

// Verification
const domainCode = `
import { Database } from "../infra/database"; // VIOLATION!
import { UserEntity } from "./user";          // OK

export class OrderService {}
`;

const sf = ts.createSourceFile("src/domain/order.ts", domainCode, ts.ScriptTarget.Latest, true);
const errors = lintArchitecture(sf);

errors.forEach((err) => {
  console.error(`[LINT ERROR] ${err.file}:${err.line}:${err.column} -> ${err.message}`);
});
```

**Line-by-line explanation:**
- `ts.isImportDeclaration(node)`: Narrow down to `import` statements.
- `ts.isStringLiteral(node.moduleSpecifier)`: Extracts the module path string.
- `importPath.includes("/infra/")`: Detects architectural boundary violation.
- `sourceFile.getLineAndCharacterOfPosition(...)`: Translates the node offset into line and column for IDE/CI reporting.

---

### 4. How it works inside TypeScript
1. **Non-Destructive Traversal**: The linter uses `ts.forEachChild` to inspect nodes without allocating or rewriting trees.
2. **Syntactic Matching**: The linter pattern-matches on syntax structures (e.g. `CallExpression` where `expression` is `eval`).
3. **CI Pipeline Exit Code**: Linters return non-zero exit codes if `violations.length > 0`, preventing bad code from merging.

---

### 5. More examples

#### Example 1: Banning `eval()` and `new Function()`
```typescript
function banEval(sf: ts.SourceFile): LintViolation[] {
  const violations: LintViolation[] = [];

  function check(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === "eval") {
        const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        violations.push({
          file: sf.fileName,
          line: line + 1,
          column: character + 1,
          message: "Security violation: 'eval()' is forbidden",
        });
      }
    }
    ts.forEachChild(node, check);
  }

  check(sf);
  return violations;
}
```

#### Example 2: Enforcing Interface Naming Convention (`I` Prefix Banned)
```typescript
function banIPrefix(sf: ts.SourceFile): LintViolation[] {
  const violations: LintViolation[] = [];

  sf.statements.forEach((stmt) => {
    if (ts.isInterfaceDeclaration(stmt)) {
      const name = stmt.name.text;
      if (/^I[A-Z]/.test(name)) {
        const { line, character } = sf.getLineAndCharacterOfPosition(stmt.name.getStart(sf));
        violations.push({
          file: sf.fileName,
          line: line + 1,
          column: character + 1,
          message: `Style violation: Interface name "${name}" should not start with 'I'`,
        });
      }
    }
  });

  return violations;
}
```

---

### 6. Common mistakes

#### Mistake 1: Relying on string regex instead of AST inspection
```typescript
// WRONG: Regex check matches comments and strings!
if (fileText.includes("eval(")) { ... } // Flags 'console.log("eval() is cool")' as an error!
```
**Why it fails:** Regex search has no grammar awareness. It triggers false alarms on comments, string literals, and documentation. AST inspection targets only true `CallExpression` nodes.

#### Mistake 2: Missing dynamic imports (`import("...")`)
```typescript
// GOTCHA: Checking only ImportDeclaration misses dynamic imports
import("./module"); // This is a CallExpression with SyntaxKind.ImportKeyword, NOT an ImportDeclaration!
```
**Why it matters:** Comprehensive import rules must check both `ImportDeclaration` and dynamic `CallExpression` nodes where `node.expression.kind === ts.SyntaxKind.ImportKeyword`.

---

### 7. Rules to remember
1. Always inspect AST nodes (`ts.isCallExpression`, `ts.isImportDeclaration`), never raw text.
2. Use `sf.getLineAndCharacterOfPosition(node.getStart(sf))` to report exact diagnostic locations.
3. Check both static imports and dynamic imports if restricting module access.
4. Integrate AST rules into CI to enforce architectural boundaries automatically.

---

### Think first: Prediction puzzle
Does `ts.isImportDeclaration` match `const x = require("module");`?

```typescript
// In CommonJS code
```

---

**Answer:**
```
false
```
**Explanation:** `require("module")` is a `CallExpression` calling identifier `require`. Only ES module `import ... from ...` statements are `ImportDeclaration` nodes.

---

### Practice exercises

#### Exercise 1: Ban `any` type annotations
- **Task**: Write a rule that flags any explicit `: any` type annotation (`ts.SyntaxKind.AnyKeyword`).
- **Hint 1**: `if (node.kind === ts.SyntaxKind.AnyKeyword) flagViolation()`.

#### Exercise 2: Enforce class PascalCase naming
- **Task**: Ensure all class declaration names start with an uppercase letter.
- **Hint 1**: Check `!/^[A-Z]/.test(node.name.text)`.

#### Exercise 3: Ban empty catch blocks
- **Task**: Flag `catch (e) {}` blocks whose `block.statements.length === 0`.
- **Hint 1**: `if (ts.isCatchClause(node) && node.block.statements.length === 0)`.

#### Exercise 4: Enforce max function parameter count
- **Task**: Flag any function declaration with more than 3 parameters.
- **Hint 1**: `if (fn.parameters.length > 3)`.

---

### Exercise solutions

#### Solution 1: Ban `any` type annotations
```typescript
function banExplicitAny(sf: ts.SourceFile): LintViolation[] {
  const violations: LintViolation[] = [];
  function visit(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      violations.push({
        file: sf.fileName,
        line: pos.line + 1,
        column: pos.character + 1,
        message: "Explicit 'any' is forbidden",
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return violations;
}
```

#### Solution 2: Enforce class PascalCase naming
```typescript
function enforcePascalCaseClasses(sf: ts.SourceFile): LintViolation[] {
  const violations: LintViolation[] = [];
  sf.statements.filter(ts.isClassDeclaration).forEach((cls) => {
    if (cls.name && !/^[A-Z]/.test(cls.name.text)) {
      const pos = sf.getLineAndCharacterOfPosition(cls.name.getStart(sf));
      violations.push({
        file: sf.fileName,
        line: pos.line + 1,
        column: pos.character + 1,
        message: `Class name '${cls.name.text}' must be PascalCase`,
      });
    }
  });
  return violations;
}
```

#### Solution 3: Ban empty catch blocks
```typescript
function banEmptyCatch(sf: ts.SourceFile): LintViolation[] {
  const violations: LintViolation[] = [];
  function visit(node: ts.Node) {
    if (ts.isCatchClause(node) && node.block.statements.length === 0) {
      const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      violations.push({
        file: sf.fileName,
        line: pos.line + 1,
        column: pos.character + 1,
        message: "Empty catch block is forbidden",
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return violations;
}
```

#### Solution 4: Enforce max function parameter count
```typescript
function enforceMaxParams(sf: ts.SourceFile, max: number = 3): LintViolation[] {
  const violations: LintViolation[] = [];
  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.parameters.length > max) {
      const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      violations.push({
        file: sf.fileName,
        line: pos.line + 1,
        column: pos.character + 1,
        message: `Function '${node.name?.text}' has ${node.parameters.length} params (max: ${max})`,
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return violations;
}
```

---

### Recall
1. Why is AST linting more accurate than regular expressions? AST linting parses grammar, ignoring false positives in comments and strings.
2. How do you get line and column numbers for lint violations? `sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))`.
3. Which function iterates through AST nodes without modifying them? `ts.forEachChild`.

> **If you remember only one thing:**  
> Static architecture linters use AST traversal to enforce boundary rules, naming conventions, and security constraints with zero false positives.

---

# Topic 14: Automated Dead Code & Unused Export Detection via AST Analysis

### 1. What is it?
**Dead Code & Unused Export Detection** is a whole-program static analysis technique that scans all files in a project, builds an export-import dependency graph, and identifies functions, classes, or variables that are declared and exported but never imported or referenced anywhere in the codebase.

### 2. Why does it exist?
As codebases evolve over years of development, features get refactored or deleted, but obsolete utility functions and unused exports remain in the repository. Unused exports inflate bundle sizes, clutter documentation, and waste maintenance time. An AST analyzer discovers dead exports automatically.

### 3. Basic example

```typescript
import * as ts from "typescript";

// Simulated project files
const files: Record<string, string> = {
  "math.ts": `
    export function add(a: number, b: number) { return a + b; }
    export function unusedMultiply(a: number, b: number) { return a * b; } // DEAD EXPORT!
  `,
  "main.ts": `
    import { add } from "./math";
    console.log(add(1, 2));
  `,
};

function findUnusedExports(fileMap: Record<string, string>): string[] {
  const declaredExports = new Set<string>();
  const importedIdentifiers = new Set<string>();

  // Pass 1: Parse all files
  for (const [fileName, code] of Object.entries(fileMap)) {
    const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true);

    function visit(node: ts.Node) {
      // Find exports
      if (ts.isFunctionDeclaration(node) && node.name) {
        const isExported = ts.canHaveModifiers(node) &&
          ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        if (isExported) {
          declaredExports.add(node.name.text);
        }
      }

      // Find imports
      if (ts.isImportSpecifier(node)) {
        importedIdentifiers.add(node.name.text);
      }

      ts.forEachChild(node, visit);
    }

    visit(sf);
  }

  // Pass 2: Calculate difference
  const unused: string[] = [];
  for (const exp of declaredExports) {
    if (!importedIdentifiers.has(exp)) {
      unused.push(exp);
    }
  }

  return unused;
}

const deadExports = findUnusedExports(files);
console.log("Unused Exports Detected:", deadExports); // ["unusedMultiply"]
```

**Line-by-line explanation:**
- `declaredExports`: A `Set` tracking all identifiers exported across all files.
- `importedIdentifiers`: A `Set` tracking all identifiers referenced in `import` statements.
- `ts.isImportSpecifier(node)`: Matches named imports like `import { add }`.
- `declaredExports.difference(importedIdentifiers)`: Any export not found in the import set is flagged as dead code.

---

### 4. How it works inside TypeScript
1. **Graph Construction**: The analyzer collects all export vertices and import edges across all `SourceFile` nodes in a project.
2. **Entry Point Whitelist**: Public library exports or main application entry points (`index.ts`, `main.ts`) are excluded from dead export flagging.
3. **Type Checker Integration**: In full tools (like `ts-prune` or `knip`), the Type Checker traces references across re-exports (`export * from ...`) and dynamic imports.

---

### 5. More examples

#### Example 1: Detecting unused local variables within a single function
```typescript
function findUnusedLocals(fn: ts.FunctionDeclaration, sf: ts.SourceFile): string[] {
  const declared = new Set<string>();
  const used = new Set<string>();

  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      declared.add(node.name.text);
    } else if (ts.isIdentifier(node)) {
      used.add(node.text);
    }
    ts.forEachChild(node, visit);
  }

  if (fn.body) visit(fn.body);

  const unused: string[] = [];
  for (const name of declared) {
    // If it was declared but only referenced once (the declaration itself)
    if (!used.has(name)) unused.push(name);
  }
  return unused;
}
```

#### Example 2: Handling re-exports (`export { x } from "./y"`)
```typescript
if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
  node.exportClause.elements.forEach((elem) => {
    declaredExports.add(elem.name.text);
  });
}
```

---

### 6. Common mistakes

#### Mistake 1: Flagging entry-point exports as unused
```typescript
// GOTCHA: Flagging exports in index.ts
// index.ts exports functions for external consumers! They won't be imported internally in the same package!
```
**Why it matters:** Entry points must be whitelisted. Only flag exports from internal modules that are never imported anywhere.

#### Mistake 2: Missing wildcard imports (`import * as math from "./math"`)
```typescript
// GOTCHA: Wildcard import
import * as math from "./math";
math.add(1, 2);
```
**Why it matters:** If code imports `* as math`, checking only `ImportSpecifier` will miss `add`. You must also inspect property accesses on namespace imports (`math.add`).

---

### 7. Rules to remember
1. Collect all declared exports across files into an export set.
2. Collect all import specifiers and namespace accesses into an import set.
3. Whitelist entry point files (e.g. `index.ts`) to avoid false positives on public APIs.
4. Integrate unused export detection into CI to prevent codebase bloat.

---

### Think first: Prediction puzzle
Does `ts.isImportSpecifier` match default imports like `import React from "react"`?

---

**Answer:**
```
false
```
**Explanation:** `import React from "react"` is an `ImportClause` with property `name: Identifier("React")`. `ImportSpecifier` only represents named imports inside `{ ... }`.

---

### Practice exercises

#### Exercise 1: Extract all export names from a file
- **Task**: Write a function that returns an array of all exported identifiers in a `SourceFile`.
- **Hint 1**: Inspect `ExportKeyword` on modifiers and `ExportDeclaration` statements.

#### Exercise 2: Identify default export identifier
- **Task**: Find the identifier exported as `export default function run() {}`.
- **Hint 1**: Check `modifiers` for `SyntaxKind.DefaultKeyword`.

#### Exercise 3: Filter out whitelisted files
- **Task**: Given a list of unused export paths, filter out any files ending in `index.ts`.
- **Hint 1**: `!file.endsWith("index.ts")`.

#### Exercise 4: Count import usages of a module
- **Task**: Count how many different files import from `"lodash"`.
- **Hint 1**: Check `importDecl.moduleSpecifier.text === "lodash"`.

---

### Exercise solutions

#### Solution 1: Extract all export names from a file
```typescript
function getExportedNames(sf: ts.SourceFile): string[] {
  const exports: string[] = [];
  sf.statements.forEach((stmt) => {
    if (ts.canHaveModifiers(stmt)) {
      const isExp = ts.getModifiers(stmt)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (isExp) {
        if (ts.isFunctionDeclaration(stmt) && stmt.name) exports.push(stmt.name.text);
        if (ts.isClassDeclaration(stmt) && stmt.name) exports.push(stmt.name.text);
      }
    }
  });
  return exports;
}
```

#### Solution 2: Identify default export identifier
```typescript
function getDefaultExportName(sf: ts.SourceFile): string | null {
  for (const stmt of sf.statements) {
    if (ts.canHaveModifiers(stmt)) {
      const mods = ts.getModifiers(stmt);
      const isDefault = mods?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
      if (isDefault) {
        if (ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) {
          return stmt.name?.text ?? "anonymous";
        }
      }
    }
  }
  return null;
}
```

#### Solution 3: Filter out whitelisted files
```typescript
function filterDeadExports(items: Array<{ file: string; name: string }>) {
  return items.filter((item) => !item.file.endsWith("index.ts"));
}
```

#### Solution 4: Count import usages of a module
```typescript
function countModuleImports(sourceFiles: ts.SourceFile[], moduleName: string): number {
  let count = 0;
  for (const sf of sourceFiles) {
    let hasImport = false;
    sf.statements.forEach((stmt) => {
      if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
        if (stmt.moduleSpecifier.text === moduleName) hasImport = true;
      }
    });
    if (hasImport) count++;
  }
  return count;
}
```

---

### Recall
1. How does static dead code detection work across modules? Compares the set of declared exports against the set of imported identifiers.
2. Why must entry points be whitelisted? Because root files export APIs for external consumers that are not imported internally.
3. What is the difference between an `ImportClause` and an `ImportSpecifier`? `ImportClause` contains the whole import structure (default, namespace, or named); `ImportSpecifier` is an individual item inside `{ name }`.

> **If you remember only one thing:**  
> Static AST analysis can detect unused exports by comparing declared exports against imports across all project source files.

---

# Checkpoint Challenge 3: Compiler Tooling & Production Transformer Synthesis (Topics 11-14)

### Challenge Specification
Construct a production **Architecture Enforcer and Code Sanitizer** that:
1. Implements a **Static Linter Rule** that disallows importing forbidden modules (e.g. `"crypto"`, `"fs"`).
2. Implements an **AST Transformer** that automatically injects an audit banner comment at the top of every transformed file.
3. Uses `ts.Printer` to output the sanitized, checked file.
4. Detects and reports if any declared function is never called in the file.

### Solution

```typescript
import * as ts from "typescript";

// 1. Architecture Linter Rule
interface LintError {
  line: number;
  message: string;
}

function lintForbiddenImports(sf: ts.SourceFile, bannedModules: string[]): LintError[] {
  const errors: LintError[] = [];

  sf.statements.forEach((stmt) => {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      if (bannedModules.includes(stmt.moduleSpecifier.text)) {
        const { line } = sf.getLineAndCharacterOfPosition(stmt.getStart(sf));
        errors.push({
          line: line + 1,
          message: `Security Rule Violation: Forbidden module "${stmt.moduleSpecifier.text}" imported`,
        });
      }
    }
  });

  return errors;
}

// 2. Dead Function Detection within file
function findDeadFunctions(sf: ts.SourceFile): string[] {
  const declaredFns = new Set<string>();
  const calledFns = new Set<string>();

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      declaredFns.add(node.name.text);
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      calledFns.add(node.expression.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);

  const dead: string[] = [];
  declaredFns.forEach((fn) => {
    if (!calledFns.has(fn)) dead.push(fn);
  });
  return dead;
}

// 3. AST Transformer: Injects banner comment on first statement
const injectBannerTransformer: ts.TransformerFactory<ts.SourceFile> = () => {
  return (sourceFile) => {
    if (sourceFile.statements.length > 0) {
      ts.addSyntheticLeadingComment(
        sourceFile.statements[0],
        ts.SyntaxKind.SingleLineCommentTrivia,
        " [AUDIT PASSED] Verified by Enterprise AST Pipeline",
        true
      );
    }
    return sourceFile;
  };
};

// 4. Verification Execution
function runCheckpoint3() {
  const sampleCode = `
  import { readFileSync } from "fs"; // Banned!
  import { useState } from "react";

  function activeTask() {
    return 42;
  }

  function unusedHelper() { // Dead function!
    return "dead";
  }

  console.log(activeTask());
  `;

  const sf = ts.createSourceFile("app.ts", sampleCode, ts.ScriptTarget.Latest, true);

  console.log("--- 1. Lint Verification ---");
  const lintErrors = lintForbiddenImports(sf, ["fs", "crypto"]);
  lintErrors.forEach((e) => console.log(`Line ${e.line}: ${e.message}`));

  console.log("\n--- 2. Dead Code Verification ---");
  const deadFns = findDeadFunctions(sf);
  console.log("Dead Functions:", deadFns); // ["unusedHelper"]

  console.log("\n--- 3. Transformation & Code Generation ---");
  const transformResult = ts.transform(sf, [injectBannerTransformer]);
  const printer = ts.createPrinter();
  const output = printer.printFile(transformResult.transformed[0]);
  console.log(output);
}
runCheckpoint3();
```
