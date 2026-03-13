// @ts-check

/**
 * @typedef {Object} TextChange
 * @property {number} start - The starting character offset of the text to replace.
 * @property {number} end - The ending character offset of the text to replace.
 * @property {string} newName - The new shortened name to insert.
 */

export class TransformerService {
    /**
     * Applies collected text changes to the project source files.
     * Processes changes in reverse order (bottom-to-top) to maintain valid offsets.
     * 
     * @param {import('ts-morph').Project} project - The ts-morph project instance.
     * @param {Map<string, TextChange[]>} pendingChanges - Map of file paths to their respective changes.
     */
    static apply(project, pendingChanges) {
        for (const [filePath, changes] of pendingChanges) {
            const sourceFile = project.getSourceFile(filePath);
            if (!sourceFile) continue;

            // 1. Filter duplicate spans using a unique key (start-end)
            const uniqueChanges = Array.from(
                new Map(changes.map(c => [`${c.start}-${c.end}`, c])).values()
            );

            // 2. Sort bottom-to-top to ensure that modifying the top of the file 
            // doesn't break the character offsets for changes below it.
            uniqueChanges.sort((a, b) => b.start - a.start);

            // 3. Perform the actual text replacement
            for (const change of uniqueChanges) {
                sourceFile.replaceText([change.start, change.end], change.newName);
            }
        }
    }
}
