// @ts-check
import { Node } from 'ts-morph';

/**
 * @typedef {Object} SafetyCheckResult
 * @property {boolean} safe - True if the property is safe to rename.
 * @property {string} [error] - Error message if the property is unsafe.
 */

/**
 * Union of nodes that can be members of a class.
 * @typedef {import('ts-morph').PropertyDeclaration | import('ts-morph').MethodDeclaration | import('ts-morph').GetAccessorDeclaration | import('ts-morph').SetAccessorDeclaration} RenameableMember
 */

export class SafetyAnalyzer {
    /**
     * Performs semantic safety analysis on a class member.
     * @param {RenameableMember} prop - The member node to analyze.
     * @returns {SafetyCheckResult}
     */
    static check(prop) {
        const name = prop.getName();

        // Native private fields are syntactically safe (cannot be accessed via brackets)
        if (name.startsWith('#')) {
            return { safe: true };
        }

        const refs = prop.findReferences();
        for (const refSymbol of refs) {
            for (const ref of refSymbol.getReferences()) {
                const node = ref.getNode();
                const parent = node.getParent();

                if (!parent) continue;

                // 1. Check for bracket notation: obj["propName"]
                if (Node.isElementAccessExpression(parent)) {
                    return { safe: false, error: `[DYNAMIC-ACCESS] at ${this.getLoc(ref)}` };
                }

                // 2. Check for property access: obj.propName
                if (Node.isPropertyAccessExpression(parent)) {
                    const expression = parent.getExpression();
                    const type = expression.getType();

                    // If the compiler cannot resolve the type, it's unsafe to rename
                    if (type.isAny() || type.isUnknown()) {
                        return { safe: false, error: `[AMBIGUOUS-TYPE] at ${this.getLoc(ref)}` };
                    }
                }
            }
        }
        return { safe: true };
    }

    /**
     * Helper to get a human-readable line number from a reference entry.
     * @param {import('ts-morph').ReferenceEntry} ref
     * @returns {number}
     */
    static getLineNumber(ref) {
        const pos = ref.getTextSpan().getStart();
        return ref.getSourceFile().getLineAndColumnAtPos(pos).line;
    }

    /**
     * Formats the location of a reference for error reporting.
     * @param {import('ts-morph').ReferenceEntry} ref
     * @returns {string}
     */
    static getLoc(ref) {
        return `${ref.getSourceFile().getBaseName()}:${this.getLineNumber(ref)}`;
    }
}
