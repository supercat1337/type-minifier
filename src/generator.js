// @ts-check
// @ts-check
import fs from 'node:fs';

/**
 * JS Reserved Keywords (ESNext)
 */
const JS_RESERVED_WORDS = new Set([
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

// Common Global Objects to avoid as property names
const GLOBAL_OBJECTS = new Set([
    'window',
    'document',
    'location',
    'top',
    'parent',
    'globalThis',
    'console',
    'Object',
    'Array',
    'String',
    'Number',
    'Boolean',
    'Function',
    'Symbol',
]);

export class NameGenerator {
    /**
     * @param {string[]} reservedNames
     * @param {string|null} dictionaryPath
     */
    constructor(reservedNames = [], dictionaryPath = null) {
        this.alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.reserved = new Set(reservedNames);
        this.usedInSession = new Set();

        this.dictionary = [];
        this.dictIndex = 0;
        this.cycleCount = 0; // Tracks how many times we've restarted the dictionary
        this.fallbackIndex = 0;

        if (dictionaryPath && fs.existsSync(dictionaryPath)) {
            const content = fs.readFileSync(dictionaryPath, 'utf-8');
            const words = content.split(/\s+/).filter(word => word.length > 0);
            this.dictionary = [...new Set(words)];
            console.log(`📖 Loaded ${this.dictionary.length} unique words from dictionary.`);
        }
    }

    /**
     * @param {string} originalName
     * @param {boolean} keepUnderscore
     * @returns {string}
     */
    generate(originalName, keepUnderscore) {
        let base = '';

        // 1. DICTIONARY LOGIC
        if (this.dictionary.length > 0) {
            // Get current word from the dictionary
            const word = this.dictionary[this.dictIndex];

            if (this.cycleCount === 0) {
                // First pass: use pure words
                base = word;
            } else {
                // Subsequent passes: use word + cycle suffix
                base = `${word}${this.cycleCount}`;
            }

            // Move to next word for the next call
            this.dictIndex++;

            // If we reached the end of the dictionary, reset index and increment cycle
            if (this.dictIndex >= this.dictionary.length) {
                this.dictIndex = 0;
                this.cycleCount++;
            }
        }
        // 2. FALLBACK (No dictionary provided)
        else {
            let i = this.fallbackIndex++;
            let tempBase = '';
            do {
                tempBase = this.alphabet[i % this.alphabet.length] + tempBase;
                i = Math.floor(i / this.alphabet.length) - 1;
            } while (i >= 0);
            base = tempBase;
        }

        let prefix = '';
        if (originalName.startsWith('#')) prefix = '#';
        else if (keepUnderscore && originalName.startsWith('_')) prefix = '_';

        const result = prefix + base;

        // VALIDATION
        const isInvalid =
            JS_RESERVED_WORDS.has(base) ||
            GLOBAL_OBJECTS.has(base) ||
            this.reserved.has(result) ||
            this.usedInSession.has(result);

        if (isInvalid) {
            // If the dictionary word is invalid, skip to the next one automatically
            return this.generate(originalName, keepUnderscore);
        }

        this.usedInSession.add(result);
        return result;
    }
}
