// @ts-check
export class PrivateRenamer {
    /**
     * @param {import('ts-morph').ClassDeclaration} cls
     * @param {string} originalName
     * @param {string} shortName
     * @returns {Array<{start: number, end: number, newName: string}>}
     */
    static findLocations(cls, originalName, shortName) {
        const locations = [];
        const classText = cls.getText();
        const escapedName = originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match #name only as a full word
        const regex = new RegExp(`${escapedName}\\b`, 'g');
        
        let match;
        while ((match = regex.exec(classText)) !== null) {
            const startInFile = cls.getStart() + match.index;
            locations.push({
                start: startInFile,
                end: startInFile + originalName.length,
                newName: shortName
            });
        }
        return locations;
    }
}
