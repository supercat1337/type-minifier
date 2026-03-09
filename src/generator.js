// @ts-check

/**
 * JS Reserved Keywords (ESNext)
 */
const JS_KEYWORDS = new Set([
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'null',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'await',
    'let',
    'static',
    'public',
    'private',
    'protected',
    'interface',
]);

export class NameGenerator {
    constructor(reservedNames = []) {
        this.alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.index = 0;
        this.reserved = new Set(reservedNames);
    }

    /**
     * Generates a short name, preserving # or _ prefixes.
     * @param {string} originalName
     * @param {boolean} keepUnderscore
     */
    generate(originalName, keepUnderscore) {
        let base = '';
        let i = this.index++;

        do {
            base = this.alphabet[i % this.alphabet.length] + base;
            i = Math.floor(i / this.alphabet.length) - 1;
        } while (i >= 0);

        let prefix = '';
        if (originalName.startsWith('#')) prefix = '#';
        else if (keepUnderscore && originalName.startsWith('_')) prefix = '_';

        const result = prefix + base;

        // Check against JS keywords (stripping the # if present)
        const wordToCheck = originalName.startsWith('#') ? base : result;

        if (JS_KEYWORDS.has(wordToCheck) || this.reserved.has(result)) {
            return this.generate(originalName, keepUnderscore);
        }

        return result;
    }
}
