// @ts-check

/**
 * Prints the CLI usage guide to the console.
 * @returns {void}
 */
export const showHelp = () => {
  const helpText = `
Type-Minifier CLI 🚀
-------------------
A semantic, JSDoc-powered property minifier for Vanilla JavaScript.

Usage:
  js-type-minifier <input_globs...> [options]

Arguments:
  <input_globs...>     One or more patterns of files to minify (e.g., "src/**/*.js").

Options:
  --project, -p <path>  Link to a jsconfig.json or tsconfig.json.
                        Inherits all includes, excludes, and path mappings.
                        Example: type-minifier -p ./jsconfig.json

  --exclude <glob>      File pattern to ignore (can be used multiple times).
                        Example: --exclude "**/vendor/**" --exclude "**/*.test.js"

  --dict, -d <path>     Path to a text file with custom words for renaming.
                        If the dictionary is exhausted, it cycles back with numeric suffixes.
                        Example: --dict ./words.txt

  --ignore-names <path> Path to a JSON file (array) of property/method names to NEVER rename.
                        Example: --ignore-names ./skipped-names.json

  --input-map <path>    Load an existing rename map (JSON) to maintain name consistency.
  --output-map <path>   Save the current session's rename map (JSON) with auto-cleanup.

  --outDir <path>       Directory to save minified files.
  --write               Overwrite source files in place (DANGER: No undo!).
  --dts                 Generate .d.ts declaration files in the output directory.
  --keep-underscore     Preserve the "_" prefix for shortened names (e.g., _myProp -> _a).

  --help, -h            Show this help message.

Notes:
  - By default, the tool runs in DRY-RUN mode (no files are modified).
  - Use --outDir or --write to apply changes.
  - Native private fields (#) are always safely renamed using class-scope heuristics.
  - Dictionary words are checked against JS keywords and global browser objects.

Example:
  js-type-minifier "src/**/*.js" --dict ./words.txt --outDir ./dist --dts
  `;

  console.log(helpText);
};
