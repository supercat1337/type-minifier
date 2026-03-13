// @ts-check
import { ts, Node } from 'ts-morph';

/**
 * @typedef {Object} PropertyUsage
 * @property {string} file - Filename
 * @property {number} line - Line number
 * @property {string} object - The object part (e.g., 'this', 'component')
 * @property {string} type - What the compiler thinks the type is
 * @property {string} context - The full line of code
 */

export class ProjectMapper {
    /**
     * @param {import('ts-morph').Project} project
     * @param {Function} isTargetFile
     */
    static buildMap(project, isTargetFile) {
        /** @type {Object<string, Array<any>>} */
        const jsonMap = Object.create(null); // Serialized for file
        /** @type {Map<string, Array<import('ts-morph').Node>>} */
        const nodeMap = new Map(); // Real nodes for logic

        project.getSourceFiles().forEach(sf => {
            if (!isTargetFile(sf)) return;

            sf.getDescendantsOfKind(ts.SyntaxKind.PropertyAccessExpression).forEach(pa => {
                const name = pa.getName();
                const expression = pa.getExpression();
                const type = expression.getType();
                const nameNode = pa.getNameNode();

                // 1. Data for JSON (Circular-safe)
                if (!jsonMap[name]) jsonMap[name] = [];
                jsonMap[name].push({
                    typeName: type.getText(),
                    objectText: expression.getText(),
                    fileName: sf.getBaseName(),
                    line: sf.getLineAndColumnAtPos(pa.getStart()).line,
                    context: pa.getParent()?.getText().slice(0, 50).replace(/\s+/g, ' ') + '...',
                });

                // 2. Data for Internal Logic (The actual nodes)
                if (!nodeMap.has(name)) nodeMap.set(name, []);
                nodeMap.get(name).push(nameNode);
            });
        });
        return { jsonMap, nodeMap };
    }
}
