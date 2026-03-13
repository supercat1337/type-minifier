// @ts-check
import { ts, Node } from 'ts-morph';

const PROTECTED_PROPS = new Set([
    'constructor',
    'prototype',
    'name',
    'length',
    'call',
    'apply',
    'bind',
    'toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'constructor',
    'toJSON',
]);

export class ReferenceFinder {
    /**
     * @param {import('ts-morph').Project} project
     * @param {import('ts-morph').Node} memberNode - The node to find references for
     * @param {import('ts-morph').ClassDeclaration} targetClass - The class we are currently processing
     * @param {function} isTargetFile
     * @param {Map<string, import('ts-morph').Node[]>} [nodeMap]
     */
    static find(project, memberNode, targetClass, isTargetFile, nodeMap) {
        const originalName = memberNode instanceof Node ? memberNode.getName() : memberNode;

        // 0. GLOBAL SAFETY SHIELD
        // If the property name is a built-in JS property, we NEVER use heuristics.
        const isProtected = PROTECTED_PROPS.has(originalName);

        const className =
            typeof targetClass.getName === 'function' ? targetClass.getName() : 'Anonymous';
        const classSymbol = targetClass.getSymbol();

        /** @type {Array<import('ts-morph').RenameLocation | import('ts-morph').Node>} */
        const locations = [];
        const debugLogs = [];

        try {
            // 1. Try standard Language Service (Strict)
            // We only do this if it's an actual member node, not just a string name
            if (memberNode instanceof Node && typeof memberNode.getNameNode === 'function') {
                const nameNode = memberNode.getNameNode();
                const refs = project.getLanguageService().findRenameLocations(nameNode);
                if (refs && refs.length > 0) {
                    refs.forEach(loc => {
                        if (isTargetFile(loc.getSourceFile())) locations.push(loc);
                    });
                }
            }

            // 2. HEURISTIC FALLBACK (Using the pre-built nodeMap for speed)
            // If it's a protected property (like 'name'), we SKIP the heuristic to avoid breaking native JS
            if (!isProtected && nodeMap && nodeMap.has(originalName)) {
                const potentialNodes = nodeMap.get(originalName) || [];

                potentialNodes.forEach(paNameNode => {
                    const pa = paNameNode.getParent();
                    if (!Node.isPropertyAccessExpression(pa)) return;

                    const expression = pa.getExpression();
                    const type = expression.getType();
                    const symbol = type.getSymbol();
                    const typeText = type.getText();

                    const isWeak =
                        type.isAny() ||
                        type.isUnknown() ||
                        typeText === 'any' ||
                        typeText === 'unknown' ||
                        !symbol;
                    const isMatch =
                        isWeak ||
                        typeText.includes(className) ||
                        (symbol && symbol === classSymbol);

                    if (isMatch) {
                        const targetFile = paNameNode.getSourceFile();
                        if (!isTargetFile(targetFile)) return;

                        if (isWeak) {
                            debugLogs.push({
                                type: typeText,
                                file: targetFile.getBaseName(),
                                line: targetFile.getLineAndColumnAtPos(paNameNode.getStart()).line,
                                property: originalName,
                                context:
                                    pa.getText().slice(0, 60).replace(/\s+/g, ' ') + ' [HEURISTIC]',
                            });
                        }
                        locations.push(paNameNode);
                    }
                });
            }
        } catch (e) {}

        return { locations, debugLogs };
    }
}
