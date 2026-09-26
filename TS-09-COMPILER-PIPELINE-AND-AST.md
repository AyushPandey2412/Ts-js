# Module TS-09: Compiler Pipeline, AST Manipulation, & Custom Transformers

> **Track**: TypeScript Production Engineering Masterclass (TS 5.x)  
> **Prerequisites**: [TS-00](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-00-QUEUE-AND-INDEX.md), [TS-01](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-01-TYPE-ARCHITECTURE-AND-STRUCTURAL-SUBTYPING.md), [TS-02](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-02-GENERICS-AND-TYPE-OPERATORS.md), [TS-03](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-03-CONDITIONAL-TYPES-AND-INFERENCE.md), [TS-04](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-04-MAPPED-TYPES-AND-METAPROGRAMMING.md), [TS-05](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-05-TEMPLATE-LITERAL-TYPES-AND-PARSERS.md), [TS-06](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-06-OOP-CLASS-INTERNALS-AND-SOLID.md), [TS-07](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-07-ENTERPRISE-DESIGN-PATTERNS-AND-BUILDERS.md), [TS-08](file:///C:/Users/ayush/OneDrive/Desktop/js-learning/TS-08-DECORATORS-METADATA-AND-IOC.md)  
> **Target Audience**: Compiler Engineers, Tooling Authors, Principal Infrastructure Architects  
> **Universal Specification**: Complete Technical Treatise, 90 Real-World Interview Q&As with Runnable Code, 15 Prediction Puzzles with Step-by-Step Traces, 4 Complete Runnable Production Projects with Test Assertions, 20 DOs & DON'Ts, Real-World Enterprise Case Study, 75 Practice Drills (5 Tiers).

---

# Module TS-09: Compiler Pipeline, AST Manipulation, & Custom Transformers

## 1. Architectural Deep-Dive & Specification Foundations

### 1.1 The 5-Phase TypeScript Compiler Architecture

The TypeScript compiler (`tsc`, housed in `src/compiler` of the TypeScript repository) is a multi-phase compiler pipeline designed for incremental compilation, language service performance, and strict static verification:

```
+-------------------------------------------------------------------------+
|                  The 5-Phase TypeScript Compiler Pipeline               |
+-------------------------------------------------------------------------+
|  [Source Code (.ts)]                                                    |
|         │                                                               |
|         ▼ (1)                                                           |
|  [Scanner] ──► Token Stream (Tokens, Trivia, Identifiers, Keywords)     |
|         │                                                               |
|         ▼ (2)                                                           |
|  [Parser]  ──► AST (Abstract Syntax Tree, ts.SourceFile, Grammar Nodes) |
|         │                                                               |
|         ▼ (3)                                                           |
|  [Binder]  ──► Symbol Tables (Scopes, ts.Symbol, CFA FlowNodes)         |
|         │                                                               |
|         ▼ (4)                                                           |
|  [Checker] ──► Type Inference, Constraint Checking, Diagnostics         |
|         │                                                               |
|         ▼ (5)                                                           |
|  [Emitter] ──► JavaScript Output (.js), Declarations (.d.ts), Maps (.map)|
+-------------------------------------------------------------------------+
```

#### Detailed Phase Breakdown:
1. **The Scanner (`src/compiler/scanner.ts`)**:
   - Converts raw UTF-16 character streams into discrete lexical tokens (`ts.SyntaxKind`).
   - Handles trivia (comments, spaces, newlines). Trivia is NOT part of the formal AST grammar nodes, but is preserved for formatter tools.
2. **The Parser (`src/compiler/parser.ts`)**:
   - Recursive descent parser with backtracking.
   - Converts the token stream into a hierarchical Abstract Syntax Tree (`ts.SourceFile`).
   - Validates syntactic grammar (e.g. malformed statements, missing closing braces).
3. **The Binder (`src/compiler/binder.ts`)**:
   - Performs a fast traversal across the AST to create semantic **Symbols** (`ts.Symbol`).
   - Builds scope tables: declarations with the same name in overlapping scopes are merged (e.g. namespace + class merging, interface merging).
   - Generates the Control Flow Analysis graph (`ts.FlowNode`) tracking variable mutation and branch narrowing.
4. **The Type Checker (`src/compiler/checker.ts`)**:
   - The largest single file in the TypeScript compiler (~50,000+ lines of code).
   - Performs semantic type inference, structural subtyping checks, generic constraint satisfaction, and variance analysis.
   - Emits compile-time diagnostics (`ts.Diagnostic`, errors with codes `TSxxxx`).
5. **The Emitter (`src/compiler/emitter.ts`)**:
   - Transforms the AST into JavaScript target syntax (ES5, ES2022, ESNext).
   - Erases type annotations, interfaces, and type aliases.
   - Generates `.d.ts` declaration files and source map `.map` files.

---

### 1.2 Anatomy of an AST Node (`ts.Node`)

Every node in the TypeScript AST extends `ts.Node`:

```typescript
export interface Node {
  kind: SyntaxKind;        // Numeric enum indicating the node type (e.g. Identifier, CallExpression)
  flags: NodeFlags;        // Bitwise flags (e.g. Let, Const, NestedNamespace)
  pos: number;             // Start index in source text (including leading trivia)
  end: number;             // End index in source text
  parent: Node;            // Pointer to enclosing parent node (assigned during binding)
}
```

```
+-------------------------------------------------------------------------+
|                  AST Node Text Spans: pos vs getStart()                 |
+-------------------------------------------------------------------------+
|  /* leading comment */ const x = 42;                                    |
|  │                     │           │                                    |
|  ▼ (pos)               ▼ (getStart)▼ (end)                              |
+-------------------------------------------------------------------------+
```

#### Key API Methods on `ts.Node`:
- `node.getStart(sourceFile)`: Returns the start character index **excluding** leading comments and whitespace.
- `node.getText(sourceFile)`: Returns the raw source text corresponding to this AST node.
- `node.getChildren(sourceFile)`: Traverses child tokens and trivia.
- `node.forEachChild(visitor)`: Fast traversal visiting only structural AST child nodes (ignoring trivia).

---

### 1.3 The Binder & Symbol Table Architecture

A **Symbol** (`ts.Symbol`) represents a named entity declared in code (variable, function, class, interface, type alias). While a single entity might have multiple AST declarations (e.g. multiple `interface User` declarations across files), it resolves to **one single Symbol** holding all its declaration pointers:

```typescript
export interface Symbol {
  flags: SymbolFlags;               // Function, BlockScopedVariable, Interface, Class...
  escapedName: __String;            // Identifier name
  declarations?: Declaration[];     // Array of AST nodes declaring this symbol
  valueDeclaration?: Declaration;   // Primary runtime value declaration
  members?: SymbolTable;            // Properties of this symbol (e.g. methods on an interface)
  exports?: SymbolTable;            // Exported symbols of a module/namespace
}
```

---

### 1.4 The Type Checker Engine API

The `ts.TypeChecker` provides high-level queries to inspect types and verify relationships:

```typescript
import ts from "typescript";

// 1. Create a virtual program
const program = ts.createProgram(["src/index.ts"], { strict: true });
const checker = program.getTypeChecker();
const sourceFile = program.getSourceFile("src/index.ts")!;

// 2. Query AST node types
ts.forEachChild(sourceFile, (node) => {
  if (ts.isVariableStatement(node)) {
    for (const decl of node.declarationList.declarations) {
      // Resolve inferred type:
      const type = checker.getTypeAtLocation(decl);
      console.log(`Variable: ${decl.name.getText()}, Type: ${checker.typeToString(type)}`);

      // Resolve declared symbol:
      const symbol = checker.getSymbolAtLocation(decl.name);
      console.log(`Symbol flags: ${symbol?.flags}`);
    }
  }
});
```


---

## 2. AST Transformers, Code Generation, & The Node Factory API

### 2.1 The AST Transformer Architecture

An AST Transformer allows you to rewrite, augment, or strip TypeScript AST nodes during the emission phase before JavaScript output is generated.

```
+-------------------------------------------------------------------------+
|                  AST Transformer Lifecycle in TypeScript                |
+-------------------------------------------------------------------------+
|  Input SourceFile AST                                                   |
|         │                                                               |
|         ▼                                                               |
|  [TransformerFactory(context)] ──► Closure receiving TransformationContext|
|         │                                                               |
|         ▼                                                               |
|  [Visitor Function: ts.visitNode / ts.visitEachChild]                   |
|    ├── Matches target nodes (e.g. ts.isFunctionDeclaration(node))       |
|    ├── Rewrites AST subtree using ts.factory API                        |
|    └── Returns updated node, replacement node, or undefined (to delete) |
|         │                                                               |
|         ▼                                                               |
|  Transformed SourceFile AST ──► [Printer] ──► Target JavaScript Code    |
+-------------------------------------------------------------------------+
```

---

### 2.2 The Node Factory API (`ts.factory`)

Starting in TypeScript 4.0, node construction functions on the `ts` root namespace (`ts.createIdentifier`, `ts.createCall`) were deprecated in favor of `context.factory` (or `ts.factory`). The factory guarantees that synthesized AST nodes maintain hygienic scope and lexical context:

```typescript
import ts from "typescript";

// Creating: console.log("Hello from AST!");
const statement = ts.factory.createExpressionStatement(
  ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier("console"),
      ts.factory.createIdentifier("log")
    ),
    undefined,
    [ts.factory.createStringLiteral("Hello from AST!")]
  )
);
```

---

### 2.3 Writing a Production AST Transformer

Below is a complete, working transformer that intercepts all functions and injects an automated `console.log("[ENTER] functionName")` statement at the top of their function bodies:

```typescript
import ts from "typescript";

export function createTraceTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const { factory } = context;

    return (sourceFile: ts.SourceFile) => {
      function visitor(node: ts.Node): ts.Node {
        // Intercept standard function declarations with bodies
        if (ts.isFunctionDeclaration(node) && node.body && node.name) {
          const fnName = node.name.text;

          // Create: console.log("[ENTER] " + fnName);
          const traceStatement = factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier("console"),
                factory.createIdentifier("log")
              ),
              undefined,
              [factory.createStringLiteral(`[ENTER] ${fnName}`)]
            )
          );

          // Update function body with injected statement at index 0:
          const updatedBody = factory.updateBlock(node.body, [
            traceStatement,
            ...node.body.statements,
          ]);

          return factory.updateFunctionDeclaration(
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
      }

      return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    };
  };
}
```

---

### 2.4 Programmatic AST Transformation & Printing

Executing transformers directly using `ts.transform` and printing the output using `ts.createPrinter`:

```typescript
import ts from "typescript";

export function transformCode(sourceCode: string): string {
  const sourceFile = ts.createSourceFile(
    "input.ts",
    sourceCode,
    ts.ScriptTarget.ES2022,
    true
  );

  const transformationResult = ts.transform(sourceFile, [createTraceTransformer()]);
  const transformedSourceFile = transformationResult.transformed[0];

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const outputCode = printer.printFile(transformedSourceFile);

  transformationResult.dispose();
  return outputCode;
}

// Verification:
const input = `function calculateTotal(subtotal: number) { return subtotal * 1.1; }`;
console.log(transformCode(input));
// Output:
// function calculateTotal(subtotal: number) {
//     console.log("[ENTER] calculateTotal");
//     return subtotal * 1.1;
// }
```


---

## 3. 90 Real-World Technical Interview Q&As (Part 1: Q1–Q45)

---

#### Q1: What are the 5 core phases of the TypeScript compiler pipeline?
**Answer:**
1. **Scanner**: Lexical analysis; converts source text into tokens and trivia.
2. **Parser**: Syntactic analysis; converts tokens into the Abstract Syntax Tree (`ts.SourceFile`).
3. **Binder**: Semantic analysis; creates `ts.Symbol` objects and builds the Control Flow Analysis graph.
4. **Checker**: Type verification, inference, constraint evaluation, and diagnostics generation.
5. **Emitter**: Code generation; outputs `.js`, `.d.ts`, and `.map` files.

---

#### Q2: What is "Trivia" in the TypeScript AST?
**Answer:**
Trivia refers to non-code syntactic elements such as whitespace, tab characters, newlines, and comments. Trivia is not represented as independent nodes in the formal AST grammar, but its position spans are tracked so formatters and language services can preserve comments and code layout.

---

#### Q3: What is the difference between `node.pos` and `node.getStart()`?
**Answer:**
- `node.pos`: The character position where the node begins **including** preceding leading trivia (comments and whitespace).
- `node.getStart(sourceFile)`: The character position where the actual code token begins, **excluding** leading trivia.

```typescript
// /* comment */ const x = 1;
// ^(pos)         ^(getStart)
```

---

#### Q4: How does the Parser handle syntax errors without crashing?
**Answer:**
The parser implements error recovery: when an unexpected token is encountered, it logs a syntax diagnostic, creates an error node or skips to the next recognizable statement boundary (e.g. semicolon or closing brace), and continues parsing the remainder of the file.

---

#### Q5: What is the difference between an AST `Node` and a `Symbol`?
**Answer:**
- **`ts.Node`**: A concrete syntactic element in the AST representing a grammatical construct in source text (e.g. an `InterfaceDeclaration` node).
- **`ts.Symbol`**: A logical semantic entity created by the Binder. A single Symbol can link multiple AST declarations together (e.g. two declarations of `interface User` across different files point to the same `User` Symbol).

---

#### Q6: How does the Binder model Control Flow Analysis (CFA)?
**Answer:**
The Binder creates `ts.FlowNode` objects representing branch points (if statements, switch cases, loops, returns). The Type Checker later traverses this flow graph to narrow types based on conditional branches and type guards.

---

#### Q7: What is the difference between `ts.Node` and `ts.Type`?
**Answer:**
- `ts.Node`: The syntax representation on the page (`const x = 5`).
- `ts.Type`: The semantic type computed by the Type Checker for that node (the literal type `5` or `number`).

---

#### Q8: How do you get the computed type of an AST node using the Type Checker?
**Answer:**
Using `checker.getTypeAtLocation(node)`:

```typescript
import ts from "typescript";

function printType(node: ts.Node, checker: ts.TypeChecker) {
  const type = checker.getTypeAtLocation(node);
  console.log(checker.typeToString(type));
}
```

---

#### Q9: How do you create an in-memory `ts.SourceFile` directly from a string?
**Answer:**
```typescript
import ts from "typescript";

const sourceFile = ts.createSourceFile(
  "virtual.ts",
  "const total = 100;",
  ts.ScriptTarget.ES2022,
  true // setParentNodes = true
);
```

---

#### Q10: What does the `setParentNodes: true` argument in `ts.createSourceFile` do?
**Answer:**
It instructs the parser to populate the `.parent` pointer on every AST node, allowing child nodes to navigate up to their enclosing statements and declarations.

---

#### Q11: How do you traverse an AST using `ts.forEachChild()`?
**Answer:**
`ts.forEachChild` visits only immediate structural child nodes of a given node:

```typescript
function traverse(node: ts.Node) {
  console.log(`Visited: ${ts.SyntaxKind[node.kind]}`);
  ts.forEachChild(node, traverse);
}
```

---

#### Q12: What is the difference between `ts.forEachChild` and `ts.visitEachChild`?
**Answer:**
- `ts.forEachChild(node, cb)`: Read-only traversal for analysis. Stops early if the callback returns a truthy value. Does not clone or mutate nodes.
- `ts.visitEachChild(node, visitor, context)`: Used in **AST Transformers** to reconstruct and replace child nodes immutably.

---

#### Q13: What is a `TransformerFactory` in TypeScript?
**Answer:**
A higher-order function receiving `ts.TransformationContext` that returns a transformer function mapping an input `SourceFile` (or `Bundle`) to a transformed `SourceFile`:

```typescript
type TransformerFactory<T extends ts.Node> = (
  context: ts.TransformationContext
) => (node: T) => T;
```

---

#### Q14: Why was `ts.createIdentifier` deprecated in favor of `ts.factory.createIdentifier` in TS 4.0?
**Answer:**
`ts.factory` attaches the active `TransformationContext` to newly synthesized nodes, ensuring that lexical scopes, hygienic variable identifiers, and downleveling flags are managed consistently.

---

#### Q15: How do you delete an AST node inside a transformer visitor?
**Answer:**
Return `undefined` from the visitor function:

```typescript
function visitor(node: ts.Node): ts.Node | undefined {
  if (ts.isDebuggerStatement(node)) {
    return undefined; // Strips the debugger statement from the output AST!
  }
  return ts.visitEachChild(node, visitor, context);
}
```

---

#### Q16: How do you replace an existing AST node with an updated version without losing source map links?
**Answer:**
Use the corresponding `ts.factory.updateX` method (e.g. `factory.updateFunctionDeclaration`), which preserves source positions and node flags from the original node.

---

#### Q17: How do you print an AST back to TypeScript or JavaScript source code?
**Answer:**
Using `ts.createPrinter`:

```typescript
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const code = printer.printFile(sourceFile);
```

---

#### Q18: What is the difference between `ts.EmitHint.SourceFile` and `ts.EmitHint.Unspecified`?
**Answer:**
- `EmitHint.SourceFile`: Prints an entire `ts.SourceFile` root node.
- `EmitHint.Unspecified`: Prints an arbitrary isolated AST node (e.g. a single `BinaryExpression` or `Statement`).

---

#### Q19: How do you determine line and column numbers of an AST node?
**Answer:**
Using `sourceFile.getLineAndCharacterOfPosition(pos)`:

```typescript
const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
console.log(`Line: ${line + 1}, Column: ${character + 1}`);
```

---

#### Q20: How do you inspect node types safely using TypeScript's built-in type guards?
**Answer:**
Use the `ts.isX` functions (e.g. `ts.isIdentifier`, `ts.isClassDeclaration`, `ts.isPropertyAccessExpression`):

```typescript
if (ts.isCallExpression(node)) {
  console.log(`Call target: ${node.expression.getText()}`);
}
```

---

#### Q21: How do you write an AST visitor that finds all exported declarations in a file?
**Answer:**
Check `ts.canHaveModifiers(node)` and verify if `ts.getModifiers(node)` contains `ts.SyntaxKind.ExportKeyword`:

```typescript
function isExported(node: ts.Node): boolean {
  if (ts.canHaveModifiers(node)) {
    const modifiers = ts.getModifiers(node);
    return modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
  }
  return false;
}
```

---

#### Q22: What are `customTransformers` in `ts.Program.emit`?
**Answer:**
An object passed to `program.emit` containing arrays of transformer factories to execute during emission:
- `before`: Runs on TypeScript ASTs before type erasure and downleveling.
- `after`: Runs on JavaScript ASTs after type erasure.
- `afterDeclarations`: Runs on `.d.ts` declaration ASTs.

---

#### Q23: Why do most custom transformers belong in the `before` hook rather than `after`?
**Answer:**
Because `before` transformers execute while TypeScript type annotations, interfaces, and generic arguments are still present in the AST, allowing you to read or transform types before the emitter erases them.

---

#### Q24: How do you write an AST transformer that strips all `console.log` statements?
**Answer:**
```typescript
function stripConsoleLog(context: ts.TransformationContext) {
  return (sourceFile: ts.SourceFile) => {
    function visitor(node: ts.Node): ts.Node | undefined {
      if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
        const text = node.expression.expression.getText();
        if (text === "console.log") return undefined; // Strip
      }
      return ts.visitEachChild(node, visitor, context);
    }
    return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
}
```

---

#### Q25: How do you attach a synthetic leading comment to an AST node?
**Answer:**
Using `ts.addSyntheticLeadingComment`:

```typescript
ts.addSyntheticLeadingComment(
  node,
  ts.SyntaxKind.SingleLineCommentTrivia,
  " Generated by Antigravity Compiler Plugin",
  true
);
```

---

#### Q26: What is a `ts.CompilerHost` and why would you customize it?
**Answer:**
`ts.CompilerHost` is the abstraction layer through which the compiler interacts with the filesystem (`readFile`, `writeFile`, `fileExists`, `getCurrentDirectory`). Customizing it allows you to compile files entirely in-memory without touching disk.

---

#### Q27: How do you extract all methods from an interface AST node?
**Answer:**
Filter `interfaceNode.members` using `ts.isMethodSignature`:

```typescript
function getInterfaceMethods(node: ts.InterfaceDeclaration): ts.MethodSignature[] {
  return node.members.filter(ts.isMethodSignature);
}
```

---

#### Q28: How do you find all occurrences of a variable identifier in an AST?
**Answer:**
Traverse with `ts.forEachChild` and match `ts.isIdentifier(node)` where `node.text === targetName`.

---

#### Q29: What is `ts.ScriptTarget`?
**Answer:**
An enum specifying the ECMAScript language version for emitted JavaScript (`ES5`, `ES2015`, `ES2020`, `ES2022`, `ESNext`).

---

#### Q30: What is `ts.ModuleKind`?
**Answer:**
An enum specifying the emitted module format (`CommonJS`, `ESNext`, `Node16`, `NodeNext`, `Preserve`).

---

#### Q31: How do you extract diagnostics from a TypeScript Program programmatically?
**Answer:**
```typescript
const syntactic = program.getSyntacticDiagnostics();
const semantic = program.getSemanticDiagnostics();
const allDiagnostics = [...syntactic, ...semantic];

for (const d of allDiagnostics) {
  console.log(`TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
}
```

---

#### Q32: What is the purpose of `ts.flattenDiagnosticMessageText`?
**Answer:**
Diagnostic message chains in TypeScript can be nested trees of sub-messages. `flattenDiagnosticMessageText` recursively flattens the message tree into a single readable string with newlines.

---

#### Q33: How do you create a synthetic AST node for `const x = 10;`?
**Answer:**
```typescript
const varStatement = ts.factory.createVariableStatement(
  undefined,
  ts.factory.createVariableDeclarationList(
    [
      ts.factory.createVariableDeclaration(
        ts.factory.createIdentifier("x"),
        undefined,
        undefined,
        ts.factory.createNumericLiteral(10)
      )
    ],
    ts.NodeFlags.Const
  )
);
```

---

#### Q34: What is the difference between `ts.isPropertyAccessExpression` and `ts.isElementAccessExpression`?
**Answer:**
- `PropertyAccessExpression`: Dot notation (`obj.prop`).
- `ElementAccessExpression`: Bracket notation (`obj["prop"]` or `arr[0]`).

---

#### Q35: How do you extract the arguments of a function call in the AST?
**Answer:**
Read `callNode.arguments` which is a `ts.NodeArray<ts.Expression>`:

```typescript
if (ts.isCallExpression(node)) {
  for (const arg of node.arguments) {
    console.log(arg.getText());
  }
}
```

---

#### Q36: What is a `ts.NodeArray`?
**Answer:**
A read-only array of AST nodes that additionally carries source text position flags (`pos`, `end`, `hasTrailingComma`).

---

#### Q37: How do you create an empty block `{}` using `ts.factory`?
**Answer:**
`ts.factory.createBlock([], false)`.

---

#### Q38: How do you create an `import` statement AST node?
**Answer:**
```typescript
// import { sum } from "./math";
const importDecl = ts.factory.createImportDeclaration(
  undefined,
  ts.factory.createImportClause(
    false,
    undefined,
    ts.factory.createNamedImports([
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("sum"))
    ])
  ),
  ts.factory.createStringLiteral("./math")
);
```

---

#### Q39: What is `ts.transform`?
**Answer:**
A standalone API function that takes one or more `ts.SourceFile` ASTs and an array of `TransformerFactory` instances and executes the transformers without requiring a full compiler `Program`.

---

#### Q40: What is the difference between `ts.transform` and `program.emit`?
**Answer:**
- `ts.transform`: Lightweight; operates purely on syntactic AST nodes; does NOT have access to the Type Checker.
- `program.emit`: Full compiler emission; can pass custom transformers that access the `TypeChecker`.

---

#### Q41: How do you pass the `TypeChecker` to a custom transformer?
**Answer:**
Accept `program` or `checker` in a wrapper function that returns the `TransformerFactory`:

```typescript
function createCheckerTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  const checker = program.getTypeChecker();
  return (context) => (sourceFile) => {
    // Transformer can query 'checker.getTypeAtLocation(node)'!
    return sourceFile;
  };
}
```

---

#### Q42: What is `ts-patch` and why is it used?
**Answer:**
`ts-patch` patches the installed `typescript` package in `node_modules` so that standard `tsc` CLI commands execute custom transformers defined in `tsconfig.json` plugins.

---

#### Q43: How do you format a TypeScript type to string using `checker.typeToString`?
**Answer:**
```typescript
const str = checker.typeToString(
  type,
  undefined,
  ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias
);
```

---

#### Q44: What does `ts.TypeFormatFlags.NoTruncation` do?
**Answer:**
Prevents the Type Checker from abbreviating complex union or object types with `...` when stringifying them.

---

#### Q45: How do you find the declaration file (`.d.ts`) corresponding to a standard library node?
**Answer:**
Call `sourceFile.fileName`; standard library definitions will have file names like `lib.es5.d.ts` or `lib.es2022.full.d.ts`.


---

## 3. 90 Real-World Technical Interview Q&As (Part 2: Q46–Q90)

---

#### Q46: How do you build a static architectural linter using the TypeScript Compiler API?
**Answer:**
Traverse all `ts.ImportDeclaration` nodes across source files, extract the module specifier string, and verify that disallowed cross-layer dependencies (e.g. `domain/` importing from `infrastructure/`) trigger diagnostics:

```typescript
import ts from "typescript";

export function lintArchitecturalBoundaries(sourceFile: ts.SourceFile): string[] {
  const violations: string[] = [];
  const isDomainFile = sourceFile.fileName.includes("/domain/");

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      const modulePath = (node.moduleSpecifier as ts.StringLiteral).text;
      if (isDomainFile && modulePath.includes("/infrastructure/")) {
        violations.push(
          `Architectural Boundary Violation: Domain file '${sourceFile.fileName}' cannot import infrastructure module '${modulePath}'.`
        );
      }
    }
  });

  return violations;
}
```

---

#### Q47: How do you synthesize a runtime Zod schema from an interface AST node?
**Answer:**
Iterate over `interfaceNode.members`, inspect each property type, and construct corresponding `z.string()`, `z.number()`, or `z.boolean()` AST call expressions using `ts.factory`.

---

#### Q48: How do you detect dead code and unused exports across a program?
**Answer:**
Create a `ts.Program`, extract all exported symbols from all files, and query `ts.FindAllReferences` or check symbol reference counts. If an export has zero external references, flag it as dead code.

---

#### Q49: How do you generate unique, non-colliding variable names inside an AST transformer?
**Answer:**
Use `context.factory.createUniqueName(prefix)`:

```typescript
// Generates: _temp_1, _temp_2, guaranteed not to collide with user variables
const tempId = context.factory.createUniqueName("temp");
```

---

#### Q50: How do you hoist a variable declaration to the top of an enclosing scope in a transformer?
**Answer:**
Use `context.hoistVariableDeclaration(identifier)`:

```typescript
context.hoistVariableDeclaration(tempIdentifier);
```

---

#### Q51: How do you wrap a function body in a `try...catch` block at the AST level?
**Answer:**
```typescript
const tryBlock = node.body;
const catchClause = factory.createCatchClause(
  factory.createVariableDeclaration("error"),
  factory.createBlock([
    // catch statements
  ])
);
const newBody = factory.createBlock([
  factory.createTryStatement(tryBlock, catchClause, undefined)
]);
```

---

#### Q52: How do you replace `enum` declarations with `as const` object literals using an AST transformer?
**Answer:**
Replace `ts.EnumDeclaration` with a `ts.VariableStatement` where members become object literal properties and an `as const` assertion is appended.

---

#### Q53: How do you read and parse a `tsconfig.json` file programmatically?
**Answer:**
Use `ts.readConfigFile` followed by `ts.parseJsonConfigFileContent`:

```typescript
const configFile = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  process.cwd()
);
```

---

#### Q54: What is `ts.transpileModule` and how does it differ from `ts.createProgram`?
**Answer:**
- `ts.transpileModule(code, options)`: Fast, isolated single-file transpilation (like Babel or esbuild). Erases types and compiles syntax, but does NOT perform type checking or cross-file resolution.
- `ts.createProgram()`: Full multi-file type checker, dependency graph resolver, and diagnostic generator.

---

#### Q55: Why can `ts.transpileModule` not execute type-directed transformations?
**Answer:**
Because it operates purely on a single file's syntax tree without access to `ts.TypeChecker`. It cannot know whether an identifier is an interface, a type alias, or a class.

---

#### Q56: How do you create an incremental compilation watch program?
**Answer:**
Using `ts.createWatchProgram`:

```typescript
const host = ts.createWatchCompilerHost(
  "tsconfig.json",
  {},
  ts.sys,
  ts.createSemanticDiagnosticsBuilderProgram
);
const watchProgram = ts.createWatchProgram(host);
```

---

#### Q57: What is the Language Service API (`ts.createLanguageService`)?
**Answer:**
The editor-facing compiler API powering VS Code, Neovim, and IDEs. It provides `getCompletionsAtPosition`, `getQuickInfoAtPosition` (hover tooltips), `getDefinitionAtPosition`, and rename refactoring.

---

#### Q58: How do you extract JSDoc documentation tags from an AST node?
**Answer:**
Using `ts.getJSDocTags(node)`:

```typescript
const tags = ts.getJSDocTags(node);
for (const tag of tags) {
  console.log(`Tag: @${tag.tagName.text}, Comment: ${tag.comment}`);
}
```

---

#### Q59: How do you write a linter rule prohibiting non-null assertions (`!`)?
**Answer:**
Search the AST for `ts.SyntaxKind.NonNullExpression`:

```typescript
function checkNoNonNull(node: ts.Node) {
  if (ts.isNonNullExpression(node)) {
    console.error(`Forbidden non-null assertion (!) at position ${node.pos}`);
  }
  ts.forEachChild(node, checkNoNonNull);
}
```

---

#### Q60: How do you write a linter rule prohibiting explicit `any` keywords?
**Answer:**
Search the AST for `node.kind === ts.SyntaxKind.AnyKeyword`:

```typescript
function checkNoAny(node: ts.Node) {
  if (node.kind === ts.SyntaxKind.AnyKeyword) {
    console.error("Prohibited 'any' type keyword detected.");
  }
  ts.forEachChild(node, checkNoAny);
}
```

---

#### Q61: How does downleveling compile ES6 classes to ES5 prototypes?
**Answer:**
The emitter rewrites `class` declarations into constructor functions (`function ClassName() {}`), assigns methods to `ClassName.prototype`, and generates `__extends` helper calls to set up the prototype chain.

---

#### Q62: How does downleveling compile `async`/`await` to ES5?
**Answer:**
The emitter wraps the function in a `__awaiter` helper and converts the execution flow into an internal state-machine generator (`__generator`).

---

#### Q63: How does `isolatedDeclarations` (TS 5.5+) affect declaration generation?
**Answer:**
It forces all exported functions and classes to have explicit return types, allowing declaration generators (like `oxc` or `swc`) to generate `.d.ts` files in parallel across single files without needing the type checker.

---

#### Q64: How do you extract all imported module names from a file?
**Answer:**
Filter child nodes for `ts.isImportDeclaration` and read `node.moduleSpecifier.text`:

```typescript
function getImports(sourceFile: ts.SourceFile): string[] {
  const imports: string[] = [];
  ts.forEachChild(sourceFile, (n) => {
    if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
      imports.push(n.moduleSpecifier.text);
    }
  });
  return imports;
}
```

---

#### Q65: How do you transform a dynamic `require()` into an ESM `import`?
**Answer:**
Match `ts.isCallExpression` where expression is `require`, extract the string argument, and synthesize an `ImportDeclaration` or dynamic `import()` expression.

---

#### Q66: How do you measure TypeScript compiler memory usage during builds?
**Answer:**
Run `tsc --extendedDiagnostics` to see:
- `Files` count
- `Lines of Library / Program code`
- `Memory used`
- `Check time` / `Emit time`

---

#### Q67: How do you generate an AST for a binary expression `a + b`?
**Answer:**
```typescript
ts.factory.createBinaryExpression(
  ts.factory.createIdentifier("a"),
  ts.SyntaxKind.PlusToken,
  ts.factory.createIdentifier("b")
);
```

---

#### Q68: How do you generate an AST for an arrow function `(x) => x * 2`?
**Answer:**
```typescript
ts.factory.createArrowFunction(
  undefined,
  undefined,
  [ts.factory.createParameterDeclaration(undefined, undefined, "x")],
  undefined,
  undefined,
  ts.factory.createBinaryExpression(
    ts.factory.createIdentifier("x"),
    ts.SyntaxKind.AsteriskToken,
    ts.factory.createNumericLiteral(2)
  )
);
```

---

#### Q69: What is `ts.EmitFlags.NoComments`?
**Answer:**
A node flag that instructs the emitter to suppress all comments on that specific AST node.

---

#### Q70: How do you detect whether an AST node has a specific modifier (e.g. `async`)?
**Answer:**
```typescript
function isAsync(node: ts.Node): boolean {
  if (ts.canHaveModifiers(node)) {
    return ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
  }
  return false;
}
```

---

#### Q71: How do you inspect a class's heritage clauses (extends and implements)?
**Answer:**
Read `classNode.heritageClauses`:
- `clause.token === ts.SyntaxKind.ExtendsKeyword`: Base class.
- `clause.token === ts.SyntaxKind.ImplementsKeyword`: Interfaces.

---

#### Q72: How do you find the root directory of a TypeScript project programmatically?
**Answer:**
Use `ts.findConfigFile(searchPath, ts.sys.fileExists, "tsconfig.json")`.

---

#### Q73: What is the purpose of `ts.getDefaultLibFilePath`?
**Answer:**
Returns the absolute file path to the default TypeScript standard library definition file (e.g. `lib.d.ts` or `lib.es2022.full.d.ts`).

---

#### Q74: How do you create an in-memory Virtual File System for the Compiler Host?
**Answer:**
Implement `getSourceFile`, `readFile`, and `writeFile` backed by an in-memory `Map<string, string>`.

---

#### Q75: How do you inspect all files included in a `ts.Program`?
**Answer:**
Call `program.getSourceFiles()`, which returns an array of all `ts.SourceFile` objects including standard library declarations.

---

#### Q76: How do you filter out standard library files from `program.getSourceFiles()`?
**Answer:**
Check `!sourceFile.isDeclarationFile` or `!program.isSourceFileDefaultLibrary(sourceFile)`.

---

#### Q77: What is the difference between `ts.SyntaxKind.TrueKeyword` and `ts.SyntaxKind.FalseKeyword`?
**Answer:**
They represent boolean literal tokens `true` and `false` respectively in the AST.

---

#### Q78: How do you create a synthetic template literal expression in the AST?
**Answer:**
Using `ts.factory.createTemplateExpression` and `ts.factory.createTemplateHead`.

---

#### Q79: What is `ts.ScriptSnapshot`?
**Answer:**
An abstraction over source text used by the Language Service to perform fast incremental text updates when files are edited character by character in an IDE.

---

#### Q80: How do you find the line number of a syntax error?
**Answer:**
Call `d.file.getLineAndCharacterOfPosition(d.start)` on the `ts.Diagnostic` object.

---

#### Q81: What is a Source Map generator in the TypeScript compiler?
**Answer:**
`ts.SourceMapGenerator` maps positions in emitted JavaScript code back to their exact character positions in original TypeScript source code.

---

#### Q82: How do you strip all type annotations from an AST without running the full compiler?
**Answer:**
Use `ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ESNext } })`.

---

#### Q83: How do you construct a conditional expression `a ? b : c` in the AST?
**Answer:**
Using `ts.factory.createConditionalExpression(condition, questionToken, whenTrue, colonToken, whenFalse)`.

---

#### Q84: How do you construct a `throw new Error(...)` statement in the AST?
**Answer:**
```typescript
ts.factory.createThrowStatement(
  ts.factory.createNewExpression(
    ts.factory.createIdentifier("Error"),
    undefined,
    [ts.factory.createStringLiteral("Error message")]
  )
);
```

---

#### Q85: What is `unplugin` and how does it integrate with TypeScript AST transformers?
**Answer:**
`unplugin` is a universal build plugin framework allowing custom AST transformers to run seamlessly across Vite, Rollup, Webpack, and esbuild without tool-specific glue code.

---

#### Q86: How do you convert an AST back to formatted code with customized indentation?
**Answer:**
Configure `ts.createPrinter({ newLine: ts.NewLineKind.LineFeed, removeComments: false })`.

---

#### Q87: How do you detect if a file is a TypeScript file vs a JavaScript file?
**Answer:**
Inspect `sourceFile.scriptKind` (`ts.ScriptKind.TS`, `TSX`, `JS`, `JSX`, `JSON`).

---

#### Q88: How do you check if an identifier is a reserved keyword in TypeScript?
**Answer:**
Check `ts.isKeyword(node.kind)`.

---

#### Q89: Why should you avoid mutating AST nodes directly instead of using `factory.updateX`?
**Answer:**
Direct mutation corrupts the compiler's internal caches, breaks parent node pointers, and causes crashes in incremental compilation.

---

#### Q90: What makes mastery of the TypeScript Compiler API an elite engineering skill?
**Answer:**
It allows you to build custom framework tooling, automated code refactoring engines, compile-time schema generators, and architectural boundary linters that eliminate entire classes of bugs before code ever reaches production.


---

## 4. Output Prediction Puzzles (15 Puzzles with Step-by-Step Traces)

Test your mental model of the TypeScript Compiler API, AST token positions, node factory operations, and transformer visitor mechanics.

---

### Puzzle 1: AST Node `pos` vs `getStart()` with Leading Comments

```typescript
import ts from "typescript";

const sourceText = "/* banner */ const score = 100;";
const sourceFile = ts.createSourceFile("test.ts", sourceText, ts.ScriptTarget.ES2022, true);

let capturedPos = -1;
let capturedStart = -1;

ts.forEachChild(sourceFile, (node) => {
  if (ts.isVariableStatement(node)) {
    capturedPos = node.pos;
    capturedStart = node.getStart(sourceFile);
  }
});

// Question: What are capturedPos and capturedStart?
```

**Step-by-Step Evaluation Trace:**
1. `node.pos` marks the beginning of the node including preceding leading trivia (the `/* banner */ ` comment). The comment starts at index `0`. Thus `capturedPos = 0`.
2. `node.getStart(sourceFile)` computes the start of the first actual code token (`const`).
3. The comment `"/* banner */ "` has length 13.
4. The token `"const"` begins at index 13.
5. **Output Values:** `capturedPos = 0`, `capturedStart = 13`.

---

### Puzzle 2: `ts.forEachChild` Early Exit on Truthy Return

```typescript
import ts from "typescript";

const code = "const a = 1; const b = 2; const c = 3;";
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

let visitedCount = 0;

const result = ts.forEachChild(sourceFile, (node) => {
  visitedCount++;
  if (visitedCount === 2) {
    return "STOP_EARLY";
  }
});
```

**Step-by-Step Evaluation Trace:**
1. `sourceFile` has 3 top-level `VariableStatement` nodes: `const a = 1`, `const b = 2`, `const c = 3`.
2. Visitor iteration 1: `visitedCount` becomes 1. Returns `undefined` (traversal continues).
3. Visitor iteration 2: `visitedCount` becomes 2. Returns `"STOP_EARLY"`.
4. `ts.forEachChild` detects a truthy return value from the callback and immediately aborts traversal, returning `"STOP_EARLY"`.
5. The third statement (`const c = 3`) is never visited!
6. **Output Values:** `visitedCount = 2`, `result = "STOP_EARLY"`.

---

### Puzzle 3: Node Deletion via Returning `undefined`

```typescript
import ts from "typescript";

const code = "console.log(1); debugger; console.log(2);";
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  return (sf) => {
    function visitor(node: ts.Node): ts.Node | undefined {
      if (ts.isDebuggerStatement(node)) {
        return undefined; // Delete node
      }
      return ts.visitEachChild(node, visitor, context);
    }
    return ts.visitNode(sf, visitor) as ts.SourceFile;
  };
};

const transformed = ts.transform(sourceFile, [transformer]).transformed[0];
const output = ts.createPrinter().printFile(transformed);
// Question: What statements remain in output?
```

**Step-by-Step Evaluation Trace:**
1. The transformer encounters three statements: `ExpressionStatement (console.log(1))`, `DebuggerStatement`, `ExpressionStatement (console.log(2))`.
2. When the visitor hits `DebuggerStatement`, it returns `undefined`.
3. `ts.visitEachChild` strips `undefined` elements when reconstructing statement arrays.
4. The output contains only `console.log(1);` and `console.log(2);`.
5. **Output Code:**
   ```javascript
   console.log(1);
   console.log(2);
   ```

---

### Puzzle 4: Statement Prepending in Block via `factory.updateBlock`

```typescript
import ts from "typescript";

const code = "function run() { return 42; }";
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  const { factory } = context;
  return (sf) => {
    function visitor(node: ts.Node): ts.Node {
      if (ts.isFunctionDeclaration(node) && node.body) {
        const injected = factory.createExpressionStatement(
          factory.createStringLiteral("PROCESSED")
        );
        const newBlock = factory.updateBlock(node.body, [
          injected,
          ...node.body.statements,
        ]);
        return factory.updateFunctionDeclaration(
          node, node.modifiers, node.asteriskToken, node.name,
          node.typeParameters, node.parameters, node.type, newBlock
        );
      }
      return ts.visitEachChild(node, visitor, context);
    }
    return ts.visitNode(sf, visitor) as ts.SourceFile;
  };
};

const transformed = ts.transform(sourceFile, [transformer]).transformed[0];
const output = ts.createPrinter().printFile(transformed);
```

**Step-by-Step Evaluation Trace:**
1. The transformer matches `FunctionDeclaration (run)`.
2. `injected` statement is synthesized: `"PROCESSED";`.
3. `factory.updateBlock` places `injected` before `...node.body.statements` (`return 42;`).
4. **Output Code:**
   ```javascript
   function run() {
       "PROCESSED";
       return 42;
   }
   ```

---

### Puzzle 5: Module Specifier Extraction from Import Declarations

```typescript
import ts from "typescript";

const code = 'import { Auth } from "@app/auth"; import "./styles.css";';
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

const modules: string[] = [];

ts.forEachChild(sourceFile, (node) => {
  if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
    modules.push(node.moduleSpecifier.text);
  }
});
```

**Step-by-Step Evaluation Trace:**
1. The file has 2 `ImportDeclaration` nodes.
2. In the first import, `moduleSpecifier` is `"@app/auth"`.
3. In the second import (side-effect import), `moduleSpecifier` is `"./styles.css"`.
4. `node.moduleSpecifier.text` strips quotes and returns raw string value.
5. **Output Array:** `["@app/auth", "./styles.css"]`.

---

### Puzzle 6: Node Flag Inspection: `const` vs `let`

```typescript
import ts from "typescript";

const code = "const a = 1; let b = 2; var c = 3;";
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

const results: string[] = [];

ts.forEachChild(sourceFile, (node) => {
  if (ts.isVariableStatement(node)) {
    const flags = node.declarationList.flags;
    if (flags & ts.NodeFlags.Const) results.push("CONST");
    else if (flags & ts.NodeFlags.Let) results.push("LET");
    else results.push("VAR");
  }
});
```

**Step-by-Step Evaluation Trace:**
1. Statement 1: `const a = 1`. `flags & ts.NodeFlags.Const` is truthy -> pushes `"CONST"`.
2. Statement 2: `let b = 2`. `flags & ts.NodeFlags.Let` is truthy -> pushes `"LET"`.
3. Statement 3: `var c = 3`. Neither flag is set -> pushes `"VAR"`.
4. **Output Array:** `["CONST", "LET", "VAR"]`.

---

### Puzzle 7: `ts.transpileModule` Type Erasure Behavior

```typescript
import ts from "typescript";

const code = `
interface User { id: string; }
const u: User = { id: "1" };
`;

const res = ts.transpileModule(code, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
});
```

**Step-by-Step Evaluation Trace:**
1. `ts.transpileModule` performs syntactic type erasure.
2. `interface User { id: string; }` produces zero JavaScript runtime code (erased).
3. `const u: User = ...` strips the `: User` type annotation.
4. Output becomes: `const u = { id: "1" };`.
5. **Output Code:**
   ```javascript
   const u = { id: "1" };
   ```

---

### Puzzle 8: Extracting Function Parameter Names

```typescript
import ts from "typescript";

const code = "function compute(a: number, b: number = 0, ...rest: string[]) {}";
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

let paramNames: string[] = [];

ts.forEachChild(sourceFile, (node) => {
  if (ts.isFunctionDeclaration(node)) {
    paramNames = node.parameters.map((p) => p.name.getText(sourceFile));
  }
});
```

**Step-by-Step Evaluation Trace:**
1. Parameter 1: `name` is identifier `a`.
2. Parameter 2: `name` is identifier `b`.
3. Parameter 3: `name` is identifier `rest`.
4. **Output Array:** `["a", "b", "rest"]`.

---

### Puzzle 9: Inspecting `SyntaxKind` of Literals

```typescript
import ts from "typescript";

const code = "true; 42; 'hello'; 100n;";
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

const kinds: string[] = [];

ts.forEachChild(sourceFile, (node) => {
  if (ts.isExpressionStatement(node)) {
    kinds.push(ts.SyntaxKind[node.expression.kind]);
  }
});
```

**Step-by-Step Evaluation Trace:**
1. `true` -> `TrueKeyword`.
2. `42` -> `NumericLiteral`.
3. `'hello'` -> `StringLiteral`.
4. `100n` -> `BigIntLiteral`.
5. **Output Array:** `["TrueKeyword", "NumericLiteral", "StringLiteral", "BigIntLiteral"]`.

---

### Puzzle 10: Transforming Function Identifier Names

```typescript
import ts from "typescript";

const code = "function oldApi() {}";
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  const { factory } = context;
  return (sf) => {
    function visitor(node: ts.Node): ts.Node {
      if (ts.isFunctionDeclaration(node) && node.name?.text === "oldApi") {
        return factory.updateFunctionDeclaration(
          node, node.modifiers, node.asteriskToken,
          factory.createIdentifier("newApi"),
          node.typeParameters, node.parameters, node.type, node.body
        );
      }
      return ts.visitEachChild(node, visitor, context);
    }
    return ts.visitNode(sf, visitor) as ts.SourceFile;
  };
};

const transformed = ts.transform(sourceFile, [transformer]).transformed[0];
const output = ts.createPrinter().printFile(transformed);
```

**Step-by-Step Evaluation Trace:**
1. Matches `FunctionDeclaration` named `"oldApi"`.
2. `factory.updateFunctionDeclaration` substitutes `factory.createIdentifier("newApi")`.
3. **Output Code:** `function newApi() { }`.

---

### Puzzle 11: Binary Expression Operator Replacement

```typescript
import ts from "typescript";

const code = "const res = a + b;";
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  const { factory } = context;
  return (sf) => {
    function visitor(node: ts.Node): ts.Node {
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        return factory.updateBinaryExpression(
          node, node.left,
          factory.createToken(ts.SyntaxKind.MinusToken),
          node.right
        );
      }
      return ts.visitEachChild(node, visitor, context);
    }
    return ts.visitNode(sf, visitor) as ts.SourceFile;
  };
};

const transformed = ts.transform(sourceFile, [transformer]).transformed[0];
const output = ts.createPrinter().printFile(transformed);
```

**Step-by-Step Evaluation Trace:**
1. Traverses inside variable initializer to `BinaryExpression (a + b)`.
2. Matches `PlusToken`. Replaces operator with `MinusToken`.
3. **Output Code:** `const res = a - b;`.

---

### Puzzle 12: Detecting Arrow Functions vs Function Expressions

```typescript
import ts from "typescript";

const code = "const f1 = () => 1; const f2 = function() { return 2; };";
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

const detected: string[] = [];

ts.forEachChild(sourceFile, (node) => {
  if (ts.isVariableStatement(node)) {
    for (const d of node.declarationList.declarations) {
      if (d.initializer && ts.isArrowFunction(d.initializer)) detected.push("ARROW");
      if (d.initializer && ts.isFunctionExpression(d.initializer)) detected.push("FUNCTION_EXPR");
    }
  }
});
```

**Step-by-Step Evaluation Trace:**
1. `f1` initializer is `() => 1` -> matches `isArrowFunction` -> pushes `"ARROW"`.
2. `f2` initializer is `function() { ... }` -> matches `isFunctionExpression` -> pushes `"FUNCTION_EXPR"`.
3. **Output Array:** `["ARROW", "FUNCTION_EXPR"]`.

---

### Puzzle 13: Extracting Class Members by Type

```typescript
import ts from "typescript";

const code = `
class Service {
  public id: string = "1";
  public start(): void {}
  get status(): string { return "ok"; }
}
`;
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

const memberKinds: string[] = [];

ts.forEachChild(sourceFile, (node) => {
  if (ts.isClassDeclaration(node)) {
    for (const m of node.members) {
      if (ts.isPropertyDeclaration(m)) memberKinds.push("PROPERTY");
      if (ts.isMethodDeclaration(m)) memberKinds.push("METHOD");
      if (ts.isGetAccessor(m)) memberKinds.push("GETTER");
    }
  }
});
```

**Step-by-Step Evaluation Trace:**
1. Member 1: `id` is `PropertyDeclaration`.
2. Member 2: `start()` is `MethodDeclaration`.
3. Member 3: `get status()` is `GetAccessorDeclaration`.
4. **Output Array:** `["PROPERTY", "METHOD", "GETTER"]`.

---

### Puzzle 14: Checking for `export default`

```typescript
import ts from "typescript";

const code = "export default function main() {}";
const sourceFile = ts.createSourceFile("test.ts", code, ts.ScriptTarget.ES2022);

let hasDefaultExport = false;

ts.forEachChild(sourceFile, (node) => {
  if (ts.canHaveModifiers(node)) {
    const mods = ts.getModifiers(node);
    if (mods?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
      hasDefaultExport = true;
    }
  }
});
```

**Step-by-Step Evaluation Trace:**
1. `main` function declaration has two modifiers: `export` and `default`.
2. `mods` contains `SyntaxKind.DefaultKeyword`.
3. `hasDefaultExport` is assigned `true`.
4. **Output Value:** `true`.

---

### Puzzle 15: Printing Isolated Expressions with `EmitHint.Unspecified`

```typescript
import ts from "typescript";

const factory = ts.factory;
const binaryNode = factory.createBinaryExpression(
  factory.createIdentifier("x"),
  ts.SyntaxKind.AsteriskToken,
  factory.createNumericLiteral(10)
);

const printer = ts.createPrinter();
const text = printer.printNode(
  ts.EmitHint.Unspecified,
  binaryNode,
  ts.createSourceFile("temp.ts", "", ts.ScriptTarget.ES2022)
);
```

**Step-by-Step Evaluation Trace:**
1. `binaryNode` is an isolated AST expression `x * 10`.
2. `printer.printNode` with `EmitHint.Unspecified` prints the isolated node without requiring an enclosing `SourceFile` wrapper.
3. **Output Text:** `"x * 10"`.


---

## 5. Four Complete Runnable Production Projects with Test Assertions

Every project below is a fully functional, self-contained TypeScript engine demonstrating production Compiler API usage, AST transformers, and static code generation. All class properties are explicitly declared for strict Node.js compatibility (`--experimental-strip-types`).

---

### Project 1: Production Custom AST Transformer: Auto-Telemetry & Trace Injector

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Auto-Telemetry AST Transformer Pipeline                |
+-------------------------------------------------------------------------+
|  Input AST: function compute(x) { return x * 2; }                       |
|         │                                                               |
|  [TelemetryTransformer]                                                 |
|    ├── Matches FunctionDeclaration & MethodDeclaration nodes            |
|    ├── Generates: const __start = performance.now();                    |
|    ├── Injects trace log on function entry                              |
|    └── Returns synthesized Block with injected statements               |
|         │                                                               |
|  Transformed Code Output with zero manual developer instrumentation     |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";
import ts from "typescript";

export function createTelemetryTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const { factory } = context;

    return (sourceFile: ts.SourceFile) => {
      function visitor(node: ts.Node): ts.Node {
        if (ts.isFunctionDeclaration(node) && node.body && node.name) {
          const fnName = node.name.text;

          // Injected: console.log(`[TRACE:ENTRY] ${fnName}`);
          const entryLog = factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier("console"),
                factory.createIdentifier("log")
              ),
              undefined,
              [factory.createStringLiteral(`[TRACE:ENTRY] ${fnName}`)]
            )
          );

          const updatedBody = factory.updateBlock(node.body, [
            entryLog,
            ...node.body.statements,
          ]);

          return factory.updateFunctionDeclaration(
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
      }

      return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    };
  };
}

export class TelemetryCompiler {
  public static instrument(sourceCode: string): string {
    const sourceFile = ts.createSourceFile(
      "source.ts",
      sourceCode,
      ts.ScriptTarget.ES2022,
      true
    );

    const result = ts.transform(sourceFile, [createTelemetryTransformer()]);
    const transformed = result.transformed[0];

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const output = printer.printFile(transformed);
    result.dispose();
    return output;
  }
}

// Verification Assertions
const originalCode = `function calculateTax(amount: number) {
    return amount * 0.15;
}`;

const instrumentedCode = TelemetryCompiler.instrument(originalCode);

assert.ok(instrumentedCode.includes('[TRACE:ENTRY] calculateTax'));
assert.ok(instrumentedCode.includes('return amount * 0.15;'));

console.log("Project 1 (Telemetry AST Transformer) passed all assertions.");
```

---

### Project 2: Static Architecture Linter & Layer Boundary Enforcer

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Clean Architecture Boundary Enforcer                   |
+-------------------------------------------------------------------------+
|  Layer Rules:                                                           |
|    - 'domain' cannot import 'infrastructure' or 'controllers'           |
|    - 'application' cannot import 'controllers'                          |
|         │                                                               |
|  [ArchitectureLinter]                                                   |
|    ├── Scans all ImportDeclaration nodes across project                 |
|    ├── Extracts moduleSpecifier strings                                 |
|    └── Emits diagnostic boundary violations                             |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";
import ts from "typescript";

export interface BoundaryRule {
  fromLayer: string;
  disallowedImports: string[];
}

export interface BoundaryViolation {
  file: string;
  importedModule: string;
  ruleViolation: string;
  line: number;
}

export class ArchitectureLinter {
  private rules: BoundaryRule[];

  constructor(rules: BoundaryRule[]) {
    this.rules = rules;
  }

  public lintFiles(files: Record<string, string>): BoundaryViolation[] {
    const violations: BoundaryViolation[] = [];

    for (const [filePath, content] of Object.entries(files)) {
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.ES2022,
        true
      );

      const activeRules = this.rules.filter((r) => filePath.includes(`/${r.fromLayer}/`));
      if (activeRules.length === 0) continue;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
          const importPath = node.moduleSpecifier.text;

          for (const rule of activeRules) {
            for (const disallowed of rule.disallowedImports) {
              if (importPath.includes(`/${disallowed}/`)) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
                violations.push({
                  file: filePath,
                  importedModule: importPath,
                  ruleViolation: `Layer '${rule.fromLayer}' is forbidden from importing layer '${disallowed}'`,
                  line: line + 1,
                });
              }
            }
          }
        }
      });
    }

    return violations;
  }
}

// Verification Assertions
const rules: BoundaryRule[] = [
  { fromLayer: "domain", disallowedImports: ["infrastructure", "controllers"] },
  { fromLayer: "application", disallowedImports: ["controllers"] },
];

const linter = new ArchitectureLinter(rules);

const mockProjectFiles: Record<string, string> = {
  "/src/domain/entities/user.ts": `
    import { PostgresConnection } from "../../infrastructure/db";
    export class User { id: string = "1"; }
  `,
  "/src/application/services/user-service.ts": `
    import { User } from "../../domain/entities/user";
    export class UserService {}
  `,
  "/src/infrastructure/db.ts": `
    export class PostgresConnection {}
  `,
};

const violations = linter.lintFiles(mockProjectFiles);

assert.strictEqual(violations.length, 1);
assert.strictEqual(violations[0].file, "/src/domain/entities/user.ts");
assert.strictEqual(violations[0].importedModule, "../../infrastructure/db");
assert.ok(violations[0].ruleViolation.includes("Layer 'domain' is forbidden from importing layer 'infrastructure'"));

console.log("Project 2 (Architecture Boundary Linter) passed all assertions.");
```

---

### Project 3: In-Memory Schema-to-DTO Code Generator

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Schema-to-DTO AST Code Generator                       |
+-------------------------------------------------------------------------+
|  Input Interface: interface UserProfile { id: string; age: number; }    |
|         │                                                               |
|  [DtoGenerator]                                                         |
|    ├── Parses InterfaceDeclaration members                              |
|    ├── Synthesizes DTO Class with explicit properties & constructor     |
|    └── Generates static fromJSON(raw) validation method                 |
|         │                                                               |
|  Output: Production-Ready TypeScript DTO Class Code                     |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";
import ts from "typescript";

export interface PropertyField {
  name: string;
  typeText: string;
}

export class DtoGenerator {
  public static generateDtoFromInterface(interfaceCode: string): string {
    const sourceFile = ts.createSourceFile(
      "schema.ts",
      interfaceCode,
      ts.ScriptTarget.ES2022,
      true
    );

    let interfaceName = "Generated";
    const fields: PropertyField[] = [];

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isInterfaceDeclaration(node)) {
        interfaceName = node.name.text;
        for (const member of node.members) {
          if (ts.isPropertySignature(member) && ts.isIdentifier(member.name)) {
            fields.push({
              name: member.name.text,
              typeText: member.type ? member.type.getText(sourceFile) : "any",
            });
          }
        }
      }
    });

    const factory = ts.factory;

    // 1. Class property declarations
    const classMembers: ts.ClassElement[] = [];

    for (const f of fields) {
      classMembers.push(
        factory.createPropertyDeclaration(
          [factory.createModifier(ts.SyntaxKind.PublicKeyword)],
          f.name,
          undefined,
          f.typeText === "number"
            ? factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
            : f.typeText === "boolean"
            ? factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
            : factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          undefined
        )
      );
    }

    // 2. Explicit constructor
    const ctorParams = fields.map((f) =>
      factory.createParameterDeclaration(
        undefined,
        undefined,
        f.name,
        undefined,
        f.typeText === "number"
          ? factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
          : f.typeText === "boolean"
          ? factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
          : factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
        undefined
      )
    );

    const ctorAssignments = fields.map((f) =>
      factory.createExpressionStatement(
        factory.createBinaryExpression(
          factory.createPropertyAccessExpression(factory.createThis(), f.name),
          ts.SyntaxKind.EqualsToken,
          factory.createIdentifier(f.name)
        )
      )
    );

    classMembers.push(
      factory.createConstructorDeclaration(
        undefined,
        ctorParams,
        factory.createBlock(ctorAssignments, true)
      )
    );

    // 3. Synthesize class declaration
    const classDecl = factory.createClassDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      `${interfaceName}Dto`,
      undefined,
      undefined,
      classMembers
    );

    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    return printer.printNode(
      ts.EmitHint.Unspecified,
      classDecl,
      sourceFile
    );
  }
}

// Verification Assertions
const inputInterface = `
interface CustomerOrder {
  orderId: string;
  amount: number;
  isShipped: boolean;
}
`;

const generatedCode = DtoGenerator.generateDtoFromInterface(inputInterface);

assert.ok(generatedCode.includes("export class CustomerOrderDto"));
assert.ok(generatedCode.includes("public orderId: string;"));
assert.ok(generatedCode.includes("public amount: number;"));
assert.ok(generatedCode.includes("public isShipped: boolean;"));
assert.ok(generatedCode.includes("this.orderId = orderId;"));

console.log("Project 3 (Schema-to-DTO Code Generator) passed all assertions.");
```

---

### Project 4: Dead Code & Unused Export Eliminator (Tree Shaker Analyzer)

#### Architectural Overview
```
+-------------------------------------------------------------------------+
|                  Dead Code & Export Reference Analyzer                  |
+-------------------------------------------------------------------------+
|  [Project Files]: index.ts, utils.ts, math.ts                           |
|         │                                                               |
|  [ExportAnalyzer]                                                       |
|    ├── Collects all declared exports from each file                     |
|    ├── Collects all imported symbol identifiers across all files        |
|    └── Computes set difference: UnusedExports = Declared - Imported     |
+-------------------------------------------------------------------------+
```

#### Complete Implementation & Verification Suite
```typescript
import assert from "node:assert";
import ts from "typescript";

export interface UnusedExport {
  file: string;
  symbolName: string;
}

export class ExportTreeShakerAnalyzer {
  public static analyze(files: Record<string, string>): UnusedExport[] {
    const exportedSymbols = new Map<string, Set<string>>();
    const referencedImportSymbols = new Set<string>();

    // Phase 1: Collect exports and imports
    for (const [filePath, code] of Object.entries(files)) {
      const sourceFile = ts.createSourceFile(
        filePath,
        code,
        ts.ScriptTarget.ES2022,
        true
      );

      const fileExports = new Set<string>();

      ts.forEachChild(sourceFile, (node) => {
        // Collect explicit function/class exports: export function foo()
        if (ts.canHaveModifiers(node)) {
          const mods = ts.getModifiers(node);
          const isExport = mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
          if (isExport) {
            if (ts.isFunctionDeclaration(node) && node.name) {
              fileExports.add(node.name.text);
            } else if (ts.isClassDeclaration(node) && node.name) {
              fileExports.add(node.name.text);
            }
          }
        }

        // Collect named exports: export { a, b }
        if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const spec of node.exportClause.elements) {
            fileExports.add(spec.name.text);
          }
        }

        // Collect named imports: import { a, b } from "./foo"
        if (ts.isImportDeclaration(node) && node.importClause && node.importClause.namedBindings) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            for (const spec of node.importClause.namedBindings.elements) {
              referencedImportSymbols.add(spec.propertyName ? spec.propertyName.text : spec.name.text);
            }
          }
        }
      });

      if (fileExports.size > 0) {
        exportedSymbols.set(filePath, fileExports);
      }
    }

    // Phase 2: Compute unused exports (ignoring application entry point index.ts)
    const unused: UnusedExport[] = [];

    for (const [file, exportsSet] of exportedSymbols.entries()) {
      if (file.endsWith("index.ts")) continue; // Entrypoint exports are public API

      for (const sym of exportsSet) {
        if (!referencedImportSymbols.has(sym)) {
          unused.push({ file, symbolName: sym });
        }
      }
    }

    return unused;
  }
}

// Verification Assertions
const testProject: Record<string, string> = {
  "/src/index.ts": `
    import { usedUtil } from "./utils";
    usedUtil();
  `,
  "/src/utils.ts": `
    export function usedUtil() { return "I am used"; }
    export function unusedDeadFunction() { return "I am dead code"; }
    export class UnusedHelperClass {}
  `,
};

const deadExports = ExportTreeShakerAnalyzer.analyze(testProject);

assert.strictEqual(deadExports.length, 2);
assert.deepStrictEqual(deadExports, [
  { file: "/src/utils.ts", symbolName: "unusedDeadFunction" },
  { file: "/src/utils.ts", symbolName: "UnusedHelperClass" },
]);

console.log("Project 4 (Dead Code & Tree Shaker Analyzer) passed all assertions.");
```


---

## 6. Enterprise Best Practices: 20 DOs and DON'Ts

| # | Rule | Bad Practice (DON'T) | Best Practice (DO) | Architectural Impact |
|---|------|----------------------|--------------------|----------------------|
| 1 | **Modern Node Factory** | Using deprecated root functions `ts.createIdentifier()` | Use `context.factory.createIdentifier()` or `ts.factory` | Guarantees proper lexical scoping, node flags, and downleveling hygiene. |
| 2 | **Immutable AST Updates** | Mutating AST node properties directly (`node.name = newName`) | Use `factory.updateX` methods (e.g. `factory.updateFunctionDeclaration`) | Preserves source map coordinate links and prevents internal compiler cache corruption. |
| 3 | **Node Deletion** | Returning an empty statement or comment node to delete | Return `undefined` from the transformer visitor | `ts.visitEachChild` cleanly removes `undefined` nodes from the parent array. |
| 4 | **Type-Directed Transformers Hook** | Placing type-directed transformers in `after` or `afterDeclarations` | Place them in the `before` transformation hook | In `before`, TypeScript types and interfaces are still present before type erasure. |
| 5 | **Avoid Text Parsing in Visitors** | Matching nodes by regex testing raw text `node.getText().startsWith(...)` | Match using built-in type guards: `ts.isFunctionDeclaration(node)` | AST syntax checks are $100\times$ faster and immune to whitespace/comment variations. |
| 6 | **Explicit Node Flags** | Creating variables without flags (`factory.createVariableDeclarationList([...])`) | Explicitly specify `ts.NodeFlags.Const` or `ts.NodeFlags.Let` | Prevents variables from defaulting to legacy hoisted `var` semantics. |
| 7 | **Hygienic Variable Synthesis** | Synthesizing hardcoded variable names (`const temp = ...`) | Use `context.factory.createUniqueName("temp")` | Prevents variable shadowing and accidental collisions with user code. |
| 8 | **Dispose Transformation Results** | Forgetting to call `result.dispose()` on `ts.TransformationResult` | Wrap in `try...finally` and call `result.dispose()` | Prevents memory leaks by releasing internal compiler nodes and diagnostic caches. |
| 9 | **Printer Configuration** | Printing ASTs with default settings ignoring line feeds | Configure `ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })` | Guarantees deterministic, platform-independent code generation across Linux and Windows. |
| 10 | **Trivia Preservation Awareness** | Expecting newly synthesized AST nodes to contain comments | Explicitly attach comments using `ts.addSyntheticLeadingComment` | Synthesized factory nodes have no source text span and do not inherit original trivia. |
| 11 | **Parent Node Initialization** | Forgetting `setParentNodes = true` in `ts.createSourceFile` | Always pass `true` as the 4th argument to `ts.createSourceFile` | Enables navigating upwards via `node.parent` in AST analyzers. |
| 12 | **Early Traversal Termination** | Continuing to traverse 10,000 nodes after finding a target | Return a truthy value from `ts.forEachChild` to halt traversal | Dramatically reduces CPU overhead in large monorepo AST linters. |
| 13 | **In-Memory Compilation** | Writing intermediate AST files to disk during unit tests | Use custom in-memory `ts.CompilerHost` or `ts.transpileModule` | Speeds up test suites by avoiding disk I/O bottlenecks. |
| 14 | **Type Formatting Truncation** | Calling `checker.typeToString(type)` without format flags | Pass `ts.TypeFormatFlags.NoTruncation` | Prevents complex union or object types from being abbreviated to `...` in tools. |
| 15 | **Check Modifiers Safely** | Directly inspecting `node.modifiers` on arbitrary nodes | Guard with `ts.canHaveModifiers(node)` before calling `ts.getModifiers` | Prevents runtime crashes on nodes that do not support modifiers in the AST grammar. |
| 16 | **Avoid Heavy Program Creation** | Creating a full `ts.createProgram` just to lint syntax | Use lightweight `ts.createSourceFile` and `ts.forEachChild` | Avoids expensive standard library loading and semantic binding overhead. |
| 17 | **Safe Identifier Extraction** | Assuming `node.name` is always an identifier | Guard `ts.isIdentifier(node.name)` | Handles computed property names, object destructuring patterns, and private identifiers. |
| 18 | **Flatten Diagnostic Trees** | Printing `d.messageText` directly as a string | Use `ts.flattenDiagnosticMessageText(d.messageText, "\n")` | Accurately renders multi-level nested diagnostic error chains. |
| 19 | **Source Map Emission** | Emitting generated code without source maps in production build pipelines | Enable `sourceMap: true` in compiler options | Ensures browser and Node stack traces point to original source line numbers. |
| 20 | **Avoid Custom Dialects** | Inventing non-standard syntax in custom transformers | Restrict transformers to transformations that emit valid standard JavaScript | Prevents vendor lock-in and maintains compatibility with standard IDE tooling. |

---

## 7. Real-World Case Study: Enterprise Compiler Plugin for Automated Zero-Runtime PII Data Masking

### Problem Context
In enterprise healthcare and fintech platforms, accidentally logging Personally Identifiable Information (PII) like Social Security Numbers, Credit Card Numbers, and Medical IDs violates strict compliance regulations (GDPR, HIPAA, PCI-DSS). Relying on developers to manually call `.mask()` before logging is error-prone.

### Architectural Solution
We construct an automated **TypeScript Compiler Transformer Plugin**:
1. It analyzes AST function calls during compilation.
2. If the call target is `console.log`, `logger.info`, or an HTTP audit logger, it inspects argument expressions.
3. If an argument references a property tagged with JSDoc `@pii` or named `ssn`, `creditCard`, or `password`, the transformer rewrites the AST to wrap the argument in a compile-time masking helper `__maskPII(arg)`.
4. Developers write clean, readable code; the compiler guarantees that sensitive data is masked in the emitted JavaScript with zero runtime overhead.

```typescript
// Architectural Sketch of PII Masking Transformer
import ts from "typescript";

export function createPiiMaskingTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    const { factory } = context;

    return (sourceFile: ts.SourceFile) => {
      function visitor(node: ts.Node): ts.Node {
        // Intercept: logger.info(user.creditCard) or console.log(user.ssn)
        if (ts.isCallExpression(node)) {
          const callText = node.expression.getText();
          if (callText.startsWith("console.log") || callText.startsWith("logger.")) {
            const transformedArgs = node.arguments.map((arg) => {
              const argText = arg.getText().toLowerCase();
              if (argText.includes("ssn") || argText.includes("creditcard") || argText.includes("password")) {
                // Synthesize: __maskPII(arg)
                return factory.createCallExpression(
                  factory.createIdentifier("__maskPII"),
                  undefined,
                  [arg]
                );
              }
              return arg;
            });

            return factory.updateCallExpression(
              node,
              node.expression,
              node.typeArguments,
              transformedArgs
            );
          }
        }

        return ts.visitEachChild(node, visitor, context);
      }

      return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    };
  };
}
```

---

## 8. Practice Drills (75 Drills across 5 Progression Tiers)

### Tier 1: AST Node Inspection & Syntax Kinds (Drills 1–15)
1. Parse a string of TypeScript code into a `ts.SourceFile` using `ts.createSourceFile`.
2. Inspect the `kind` of a variable statement and verify it equals `ts.SyntaxKind.VariableStatement`.
3. Print the source code text range using `node.pos` and `node.end`.
4. Inspect leading trivia on a variable declaration preceded by a block comment.
5. Extract the start position of an identifier excluding comments using `node.getStart()`.
6. Traverse a source file and print the `SyntaxKind` string of every top-level statement.
7. Identify whether a statement is a `FunctionDeclaration`, `ClassDeclaration`, or `InterfaceDeclaration`.
8. Check if a variable declaration is `const`, `let`, or `var` using `declarationList.flags`.
9. Inspect whether a class member is a `PropertyDeclaration` or `MethodDeclaration`.
10. Check if a method is static by inspecting its modifiers.
11. Determine the number of parameters declared on a function AST node.
12. Inspect whether a parameter is optional (`parameter.questionToken`).
13. Inspect whether a parameter is a rest parameter (`parameter.dotDotDotToken`).
14. Extract the declared return type annotation of a function AST node.
15. Check if an expression is a `BinaryExpression` and print its operator token.

### Tier 2: AST Traversal & Symbol Resolution (Drills 16–30)
16. Traverse an AST recursively using `ts.forEachChild`.
17. Halt an AST traversal early as soon as a target identifier is found.
18. Traverse an AST and collect all `StringLiteral` nodes in an array.
19. Traverse an AST and count all function declarations in the file.
20. Create a `ts.Program` in memory and get its `ts.TypeChecker`.
21. Query `checker.getTypeAtLocation(node)` on a variable declaration and print the type string.
22. Query `checker.getSymbolAtLocation(node)` on an identifier and inspect its symbol flags.
23. Format a complex object type using `ts.TypeFormatFlags.NoTruncation`.
24. Extract all exported declarations from a file by checking for `SyntaxKind.ExportKeyword`.
25. Extract all `ImportDeclaration` nodes and collect their module specifier paths.
26. Extract all named import specifiers (`import { a, b } from "mod"`).
27. Check if an import is a default import (`import a from "mod"`).
28. Check if an import is a namespace import (`import * as a from "mod"`).
29. Find line and column numbers of a node using `sourceFile.getLineAndCharacterOfPosition`.
30. Inspect the JSDoc tags of a function declaration using `ts.getJSDocTags`.

### Tier 3: Node Factory & Code Generation (Drills 31–45)
31. Synthesize an identifier `userCount` using `ts.factory.createIdentifier`.
32. Synthesize a numeric literal `42` using `ts.factory.createNumericLiteral`.
33. Synthesize a string literal `"production"` using `ts.factory.createStringLiteral`.
34. Synthesize a binary expression `x + 1` using `ts.factory.createBinaryExpression`.
35. Synthesize a function call `calculate(10, 20)` using `ts.factory.createCallExpression`.
36. Synthesize a property access `console.log` using `ts.factory.createPropertyAccessExpression`.
37. Synthesize an expression statement wrapping a function call.
38. Synthesize an `if` statement with a condition and a then-block.
39. Synthesize a `return` statement returning a boolean literal `true`.
40. Synthesize a `const` variable statement assigning an object literal.
41. Synthesize an empty block `{}` using `ts.factory.createBlock`.
42. Synthesize a class declaration with an explicit constructor.
43. Attach a synthetic single-line comment to an AST node.
44. Print a synthesized AST node to a formatted string using `ts.createPrinter`.
45. Print an isolated statement using `ts.EmitHint.Unspecified`.

### Tier 4: AST Transformers & Lifecycle Hooks (Drills 46–60)
46. Write an AST Transformer that deletes all `debugger` statements.
47. Write an AST Transformer that deletes all `console.log` calls.
48. Write an AST Transformer that renames a function from `oldFn` to `newFn`.
49. Write an AST Transformer that replaces all `==` operators with `===`.
50. Write an AST Transformer that prepends a statement at the beginning of every function body.
51. Write an AST Transformer that wraps function bodies in a `try...catch` block.
52. Write an AST Transformer that replaces `const` with `let` across all variable statements.
53. Write an AST Transformer that injects a synthetic import statement at the top of a file.
54. Execute a transformer on an in-memory SourceFile using `ts.transform`.
55. Dispose of `ts.TransformationResult` cleanly in a `try...finally` block.
56. Hoist a variable declaration inside a transformer using `context.hoistVariableDeclaration`.
57. Generate a unique variable name using `context.factory.createUniqueName`.
58. Write a transformer that converts all snake_case variable names to camelCase.
59. Write a transformer that strips all JSDoc comments from a file.
60. Write a transformer that injects execution timing spans around async methods.

### Tier 5: Enterprise Compiler Tooling & Static Analysis (Drills 61–75)
61. Build an architectural boundary linter verifying that domain files never import infrastructure.
62. Build a dead-code detector finding exported symbols with zero imports across a project.
63. Build a Schema-to-DTO generator synthesizing TypeScript class code from interface ASTs.
64. Build a PII masking compiler plugin wrapping sensitive logging arguments in `__maskPII()`.
65. Build an in-memory compiler host executing full TypeScript type checks without touching disk.
66. Extract syntactic and semantic diagnostics from a `ts.Program` and format error messages.
67. Parse a `tsconfig.json` file using `ts.readConfigFile` and `ts.parseJsonConfigFileContent`.
68. Build a custom Language Service plugin providing custom autocomplete suggestions.
69. Build a circular dependency analyzer detecting import loops between project files.
70. Build an AST transformer replacing `enum` declarations with `as const` object literals.
71. Build an automated code migration script refactoring deprecated API calls.
72. Construct an incremental compilation watch program using `ts.createWatchProgram`.
73. Build a tree-shaking analyzer that removes unused imports from source files.
74. Transpile code in memory using `ts.transpileModule` and measure execution speed.
75. Design a complete, production-ready compiler plugin integrated with `unplugin` for Vite and Webpack.


---

