// @ts-check
import { Node } from 'ts-morph';
import { SafetyAnalyzer } from './analyzer.js';
import { MemberCollector } from './discovery/member-collector.js';
import { PrivateRenamer } from './discovery/private-renamer.js';
import { ReferenceFinder } from './discovery/reference-finder.js';

/** @typedef {import('./types.js').MinifierOptions} MinifierOptions */
/** @typedef {import('./transformer.js').TextChange} TextChange */
/** @typedef {import('./analyzer.js').RenameableMember} RenameableMember */

export class DiscoveryService {
    /**
     * @param {import('ts-morph').Project} project
     * @param {MinifierOptions} options
     * @param {import('./generator.js').NameGenerator} generator
     * @param {Map<string, string>} inputMap
     * @param {Map<string, string>} sessionMap
     * @param {Set<string>} ignoreSet
     * @param {Map<string, import('ts-morph').Node[]>} nodeMap
     */
    constructor(project, options, generator, inputMap, sessionMap, ignoreSet, nodeMap) {
        this.project = project;
        this.options = options;
        this.generator = generator;
        this.inputMap = inputMap;
        this.sessionMap = sessionMap;
        this.ignoreSet = ignoreSet;
        this.nodeMap = nodeMap;
        /** @type {Map<string, TextChange[]>} */
        this.pendingChanges = new Map();
        /** @type {import('./types.js').DebugEntry[]} */
        this.debugAnyLogs = [];
    }

    /** @param {import('ts-morph').SourceFile} file */
    isTargetFile(file) {
        const pathStr = file.getFilePath().toLowerCase();
        return pathStr.endsWith('.js') || pathStr.endsWith('.mjs') || pathStr.endsWith('.cjs');
    }

    /**
     * @param {string} filePath
     * @param {number} start
     * @param {number} end
     * @param {string} newName
     */
    addChange(filePath, start, end, newName) {
        if (!this.pendingChanges.has(filePath)) this.pendingChanges.set(filePath, []);
        const changes = /** @type {TextChange[]} */ (this.pendingChanges.get(filePath));
        if (!changes.some(c => c.start === start && c.end === end)) {
            changes.push({ start, end, newName });
        }
    }

    discover() {
        const stats = { classes: 0, total: 0, renamed: 0, skipped: 0 };
        const errors = [];

        for (const file of this.project.getSourceFiles()) {
            if (!this.isTargetFile(file)) continue;

            for (const cls of file.getClasses()) {
                stats.classes++;
                const members = MemberCollector.collect(cls);

                for (const member of members) {
                    const originalName = member.getName();
                    stats.total++;

                    if (this.ignoreSet.has(originalName)) {
                        stats.skipped++;
                        continue;
                    }

                    if (!originalName.startsWith('#')) {
                        const analysis = SafetyAnalyzer.check(member);
                        if (!analysis.safe) {
                            stats.skipped++;
                            if (analysis.error) errors.push(`${originalName}: ${analysis.error}`);
                            continue;
                        }
                    }

                    const short =
                        this.sessionMap.get(originalName) ||
                        this.inputMap.get(originalName) ||
                        this.generator.generate(originalName, this.options.underscore);
                    this.sessionMap.set(originalName, short);

                    if (originalName.startsWith('#')) {
                        const locs = PrivateRenamer.findLocations(cls, originalName, short);
                        locs.forEach(l =>
                            this.addChange(file.getFilePath(), l.start, l.end, l.newName)
                        );
                        stats.renamed++;
                    } else {
                        const { locations, debugLogs } = ReferenceFinder.find(
                            this.project,
                            member,
                            cls,
                            f => this.isTargetFile(f)
                        );
                        this.debugAnyLogs.push(...debugLogs);
                        locations.forEach(loc => {
                            let start, end;
                            const targetFile = loc.getSourceFile();

                            // 1. Explicitly check if it's a Node (Heuristic result)
                            if (Node.isNode(loc)) {
                                start = loc.getStart();
                                end = loc.getEnd();
                            }
                            // 2. Otherwise, treat it as a RenameLocation (Language Service result)
                            else {
                                // We use a temporary variable to help the IDE understand the cast
                                /** @type {import('ts-morph').RenameLocation} */
                                const renameLoc = loc;
                                const span = renameLoc.getTextSpan();
                                start = span.getStart();
                                end = span.getEnd();
                            }

                            this.addChange(targetFile.getFilePath(), start, end, short);
                        });
                        stats.renamed++;
                    }
                }
            }
        }
        return {
            pendingChanges: this.pendingChanges,
            stats,
            errors,
            debugAnyLogs: this.debugAnyLogs,
        };
    }
}
