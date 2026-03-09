// @ts-check
import { SyntaxKind, Node } from 'ts-morph';

export class SafetyAnalyzer {
    /**
     * @param {any} prop - Using any here to avoid the Type Alias export issue
     */
    static check(prop) {
        const name = prop.getName();
        if (name.startsWith('#')) return { safe: true };

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
                // We use Node.isPropertyAccessExpression to "narrow" the type safely
                if (Node.isPropertyAccessExpression(parent)) {
                    const expression = parent.getExpression();
                    const type = expression.getType();

                    if (type.isAny() || type.isUnknown()) {
                        return { safe: false, error: `[AMBIGUOUS-TYPE] at ${this.getLoc(ref)}` };
                    }
                }
            }
        }
        return { safe: true };
    }

    static getLoc(ref) {
        return `${ref.getSourceFile().getBaseName()}:${ref.getLineNumber()}`;
    }
}
