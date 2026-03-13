// @ts-check
import ts, { Node } from 'ts-morph';

/** @typedef {import('../analyzer.js').RenameableMember} RenameableMember */

const PROTECTED_PROPS = new Set([
    'constructor',
    'prototype',
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
    'toJSON',
]);

export class MemberCollector {
    /**
     * @param {import('ts-morph').ClassDeclaration} cls
     * @returns {any[]}
     */
    static collect(cls) {
        /** @type {Map<string, any>} */
        const memberMap = new Map();

        // 1. Standard members
        [...cls.getInstanceMembers(), ...cls.getStaticMembers()].forEach(m => {
            const name = m.getName();
            if (!PROTECTED_PROPS.has(name)) memberMap.set(name, m);
        });

        // 2. Scan for "this.prop" in class body
        cls.getDescendantsOfKind(ts.SyntaxKind.PropertyAccessExpression).forEach(pa => {
            if (pa.getExpression().getKind() === ts.SyntaxKind.ThisKeyword) {
                const name = pa.getName();
                if (!memberMap.has(name) && !PROTECTED_PROPS.has(name)) {
                    const nameNode = pa.getNameNode();
                    /** @type {any} */
                    const virtualMember = nameNode;
                    virtualMember.getName = () => name;
                    virtualMember.getNameNode = () => nameNode;
                    memberMap.set(name, virtualMember);
                }
            }
        });

        return Array.from(memberMap.values());
    }
}
