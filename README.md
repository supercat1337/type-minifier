# Type-Minifier 🚀

[![GitHub](https://img.shields.io/badge/GitHub-supercat1337%2Ftype--minifier-blue?logo=github)](https://github.com/supercat1337/type-minifier)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A semantic, JSDoc-powered property minifier for Vanilla JavaScript.**  
Unlike traditional minifiers, Type-Minifier uses the TypeScript AST and JSDoc metadata to safely rename class properties and methods (including private `#fields`) across your entire project.

---

## 📖 Table of Contents

- [Why Type-Minifier?](#why-type-minifier)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Examples](#examples)
- [How It Works](#how-it-works)
- [Writing Class Properties for Optimal Minification](#writing-class-properties-for-optimal-minification)
- [Requirements](#requirements)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Why Type-Minifier? 🤔

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
npm install https://github.com/supercat1337/type-minifier
```

To use the `type-minifier` command globally in your terminal:

```bash
cd node_modules/@supercat1337/type-minifier
npm link
```

---

## Usage ⚙️

Run the utility by providing a glob pattern for your source files:

```bash
type-minifier "src/**/*.js" [options]
```

> **Important: Dry-Run by Default**  
> By default, the tool runs in **Dry-Run** mode. It will analyze your code and print a report but **will not modify any files** until you provide `--write` or `--outDir`.

---

## Options ⚡

| Option                | Description                                                                         |
| --------------------- | ----------------------------------------------------------------------------------- |
| `--outDir <path>`     | Save minified files to a specific directory (e.g., `./dist`).                       |
| `--write`             | Overwrite source files in place **(DANGER: No undo, use with Git)**.                |
| `--input-map <path>`  | Load an existing JSON rename map to keep names consistent.                          |
| `--output-map <path>` | Save the current session's rename map to a JSON file (with auto-cleanup).           |
| `--exclude <path>`    | Path to a JSON file (array) of property names to **never** rename.                  |
| `--dts`               | Generate `.d.ts` declaration files in the output directory.                         |
| `--keep-underscore`   | Preserve the `_` prefix for shortened internal properties (e.g., `_myProp` → `_a`). |
| `--help`, `-h`        | Show the help message.                                                              |

---

## Examples 🧪

### 1. Safe Production Build

Minify all JS files, save them to a `dist` folder, and generate a mapping file for future builds:

```bash
type-minifier "src/**/*.js" --outDir ./dist --output-map ./rename-map.json --dts
```

### 2. In-place Minification

Update your source files directly using a previously generated map:

```bash
type-minifier "src/**/*.js" --write --input-map ./rename-map.json
```

### 3. Using Exclusions

Prevent specific properties from being renamed:

```bash
# exclude.json: ["init", "onMessage", "render"]
type-minifier "src/**/*.js" --exclude ./exclude.json --write
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

## Requirements 📋

- **Node.js** >= 18.0.0
- Code should be written in **Vanilla JS with JSDoc** for best results.

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

## License 📄

**MIT** © supercat1337 (Albert Bazaleev)

---

> _Made with ❤️ for cleaner and smaller JavaScript._
