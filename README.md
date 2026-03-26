Here's the completed README with the new sections integrated:

# JS Type-Minifier 🚀

[![GitHub](https://img.shields.io/badge/GitHub-supercat1337%2Ftype--minifier-blue?logo=github)](https://github.com/supercat1337/js-type-minifier)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A semantic, JSDoc-powered property minifier for Vanilla JavaScript.**  
Unlike traditional minifiers, JS Type-Minifier uses the TypeScript AST and JSDoc metadata to safely rename class properties and methods (including private `#fields`) across your entire project.

---

## Why JS Type-Minifier? 🤔

Standard minifiers (like Terser or esbuild) usually **avoid renaming object properties** because they can't be sure if a property is part of a public API or accessed dynamically.  
Type-Minifier solves this by:

- **📝 JSDoc Awareness** – It uses your `@type` and `@param` tags to track property usage.
- **🛡️ Safety First** – Automatically skips properties used with dynamic bracket notation (`obj['prop']`) or those with ambiguous types (`any`).
- **🌍 Global Protection** – Protects built-in Web APIs and Global objects from being renamed.
- **🔒 Native Private Support** – Safely renames ECMAScript private fields (`#field`) even when JSDoc is missing.

---

## Installation 📦

Install directly from GitHub:

```bash
npm install https://github.com/supercat1337/js-type-minifier
```

To use the `js-type-minifier` command globally in your terminal:

```bash
cd node_modules/@supercat1337/js-type-minifier
npm link
```

---

## Usage ⚙️

Run the utility by providing a glob pattern for your source files:

```bash
type-minifier "src/**/*.js" [options]
```

---

## Options ⚡

| Option              | Alias | Description                                                  |
| ------------------- | ----- | ------------------------------------------------------------ |
| `--project`         | -p    | Path to jsconfig.json or tsconfig.json.                      |
| `--dict`            | -d    | Path to a text file with custom words for renaming.          |
| `--exclude`         |       | File patterns to ignore (can be used multiple times).        |
| `--ignore-names`    |       | Path to a JSON file (array) of property names to skip.       |
| `--outDir`          |       | Directory to save minified files (creates a selective copy). |
| `--write`           |       | Overwrite source files in place (DANGER: No undo).           |
| `--output-map`      |       | Save the session's rename map to a JSON file.                |
| `--input-map`       |       | Load an existing rename map to keep names consistent.        |
| `--dts`             |       | Generate .d.ts declaration files.                            |
| `--keep-underscore` |       | Preserve the `_` prefix in shortened names.                  |

---

## Examples 🧪

### 1. Safe Production Build

Minify all JS files, save them to a `dist` folder, and generate a mapping file for future builds:

```bash
js-type-minifier "src/**/*.js" --outDir ./dist --output-map ./rename-map.json --dts
```

### 2. In-place Minification

Update your source files directly using a previously generated map:

```bash
js-type-minifier "src/**/*.js" --write --input-map ./rename-map.json
```

### 3. Production Build with Custom Dictionary

Rename properties using words from `words.txt`, save to `dist`, and generate types:

```bash
js-type-minifier "src/**/*.js" --dict ./words.txt --outDir ./dist --dts
```

### 4. Project-Wide Analysis

Use your `jsconfig.json` for perfect type resolution across complex architectures:

```bash
js-type-minifier -p ./jsconfig.json --outDir ./build --output-map ./map.json
```

---

## How It Works 🔧

1. **Discovery Phase** – The tool parses your code into an Abstract Syntax Tree (AST). It identifies all class members (properties, methods, getters, setters).
2. **Semantic Analysis** – It checks if a property is safe to rename. If it finds a reference with an `any` type or dynamic access, it skips that property to prevent breaking your code.
3. **Smart Mapping** – It assigns the shortest possible name (`a`, `b`, `c`...). If a property starts with `#`, the hash is preserved (e.g., `#a`).
4. **Transformation** – It applies text replacements in reverse order per file to maintain valid character offsets.

---

## 📝 Writing Class Properties for Optimal Minification

To ensure Type-Minifier can safely rename your class properties, **avoid defining properties inside the constructor using `this` without JSDoc annotations**. Such properties are not statically analyzable and will be ignored (or marked as unsafe).

### ✅ Do This (Class Fields – Recommended)

Use the modern class fields syntax (supported in Node.js 12+ and modern browsers):

```js
class User {
    name = 'Anonymous'; // will be renamed
    age = 0; // will be renamed

    greet() {
        return `Hello, ${this.name}`;
    }
}
```

### ✅ Also Acceptable (JSDoc‑annotated Constructor Properties)

If you must support older environments, add a JSDoc comment directly above the `this` assignment:

```js
class User {
    constructor() {
        /** @type {string} */
        this.name = 'Anonymous'; // now tracked and can be renamed

        /** @type {number} */
        this.age = 0; // tracked
    }
}
```

### ❌ Avoid This (Untracked Properties)

Properties assigned to `this` without any type information will be considered **untracked** and will **not be minified**:

```js
class User {
    constructor() {
        this.name = 'Anonymous'; // ⚠️ NOT tracked – will stay as "name"
        this.age = 0; // ⚠️ NOT tracked
    }
}
```

By following these patterns, you give Type-Minifier the static information it needs to safely shorten your property names while keeping your code fully functional.

---

## Debugging Ambiguity 🔍

If a property isn't being renamed as expected, check the generated `js-type-minifier-debug.json` file. It identifies "weak" types (like `any` or `unknown`) where the minifier had to use the heuristic engine to bridge the gap.

**Example Debug Log:**

```json
{
    "file": "Component.js",
    "line": 42,
    "property": "$internals",
    "context": "comp.$internals.sid = sid [HEURISTIC]"
}
```

To fix these "weak links" for the strict compiler, add a JSDoc hint:

```js
this.items.forEach(
    /** @param {Component} comp */ comp => {
        comp.$internals.sid = 'root';
    }
);
```

---

## Troubleshooting 🛠️

If the minifier skips a property you expected to be renamed, it's often because the type could not be determined. You can help the tool by adding explicit JSDoc type casts:

```js
/** @type {MyClass} */
const obj = someFunction(); // without a cast, `obj` is `any`

// Add a cast to help the analyzer:
const obj = /** @type {MyClass} */ (someFunction());
```

Using `@type` on variables and `@param` on function parameters gives the minifier the confidence it needs to rename safely.

---

## Requirements 📋

- **Node.js** >= 18.0.0
- A project using **JSDoc** for type definitions (or modern class fields) to achieve optimal minification.

---

## License 📄

**MIT** © supercat1337 (Albert Bazaleev)

---

> _Made with ❤️ for cleaner and smaller JavaScript._
