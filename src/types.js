// @ts-check

/**
 * @typedef {Object} MinifierOptions
 * @property {string[]} inputGlobs - Array of glob patterns for input files.
 * @property {string[]} excludeGlobs - Array of glob patterns to exclude from processing.
 * @property {string[]} ignoreNames - Array of property names that should never be renamed.
 * @property {string|null} projectPath - Path to the jsconfig.json or tsconfig.json file.
 * @property {boolean} underscore - Whether to preserve the "_" prefix in shortened names.
 * @property {boolean} dts - Whether to generate .d.ts files.
 * @property {boolean} writeInPlace - If true, overwrites the source files directly.
 * @property {boolean} dryRun - If true, only reports changes without writing to disk.
 * @property {string|null} outputMapPath - Path where the resulting rename map JSON will be saved.
 * @property {Object<string, string>} inputMap - Existing rename map to maintain consistency across builds.
 * @property {string} outDir - Directory where minified files will be saved.
 * @property {string|null} dictionaryPath - Path to a text file with words for renaming.
 */

/**
 * @typedef {Object} MinifierStats
 * @property {number} classes - Total number of classes found.
 * @property {number} total - Total number of properties/methods analyzed.
 * @property {number} renamed - Number of successfully renamed entities.
 * @property {number} skipped - Number of skipped entities (unsafe or ignored).
 */

/**
 * @typedef {Object} DebugEntry
 * @property {string} file
 * @property {number} line
 * @property {string} property
 * @property {string} context
 */

export {};
