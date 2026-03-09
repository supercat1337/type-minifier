// @ts-check

import { Project, ScriptTarget, Node } from 'ts-morph';
import { NameGenerator } from './generator.js';
import { SafetyAnalyzer } from './analyzer.js';
import { IOHandler } from './io.js';

export class ProjectProcessor {
    constructor(options) {
        this.options = options;
        const existingShortNames = Object.values(options.inputMap || {});
        this.generator = new NameGenerator(existingShortNames);
        this.inputMap = new Map(Object.entries(options.inputMap || {}));
        this.sessionMap = new Map();
        this.excludeSet = new Set(options.exclude || []);
        this.stats = { total: 0, renamed: 0, skipped: 0, classes: 0 };
    }

    async run(globPath) {
        const project = new Project({
            compilerOptions: {
                allowJs: true,
                checkJs: true,
                declaration: this.options.dts,
                outDir: this.options.outDir || undefined,
                target: ScriptTarget.ESNext,
                lib: ['ESNext', 'DOM'],
            },
        });

        project.addSourceFilesAtPaths(globPath);
        const pendingChanges = new Map();

        // --- PHASE 1: DISCOVERY ---
        for (const file of project.getSourceFiles()) {
            for (const cls of file.getClasses()) {
                this.stats.classes++;
                const allMembers = [...cls.getInstanceMembers(), ...cls.getStaticMembers()];

                for (const member of allMembers) {
                    if (!Node.isNameable(member) && !Node.isPropertyNamed(member)) continue;

                    const originalName = member.getName();
                    this.stats.total++;

                    if (this.excludeSet.has(originalName)) {
                        this.stats.skipped++;
                        continue;
                    }

                    // Safety check (skipped for native private fields # as they are inherently safe)
                    if (!originalName.startsWith('#')) {
                        const analysis = SafetyAnalyzer.check(member);
                        if (!analysis.safe) {
                            this.stats.skipped++;
                            continue;
                        }
                    }

                    // Resolve short name
                    let short =
                        this.sessionMap.get(originalName) ||
                        this.inputMap.get(originalName) ||
                        this.generator.generate(originalName, this.options.underscore);
                    this.sessionMap.set(originalName, short);

                    // RENAME LOGIC
                    if (originalName.startsWith('#')) {
                        // OPTIMIZED: Native Private Fields (#)
                        // We search for all occurrences of this private name strictly within the class body
                        const classText = cls.getText();
                        const escapedName = originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        // Regex to find #name but NOT as part of a larger word
                        const regex = new RegExp(`${escapedName}\\b`, 'g');

                        let match;
                        while ((match = regex.exec(classText)) !== null) {
                            const start = cls.getStart() + match.index;
                            const filePath = file.getFilePath();
                            if (!pendingChanges.has(filePath)) pendingChanges.set(filePath, []);

                            pendingChanges.get(filePath).push({
                                start: start,
                                end: start + originalName.length,
                                newName: short,
                            });
                        }
                        this.stats.renamed++;
                    } else {
                        // STANDARD: Public/Internal Properties (Requires Language Service)
                        try {
                            const nameNode = member.getNameNode();
                            const renameLocations = project
                                .getLanguageService()
                                .findRenameLocations(nameNode);
                            if (renameLocations) {
                                for (const loc of renameLocations) {
                                    const filePath = loc.getSourceFile().getFilePath();
                                    if (!pendingChanges.has(filePath))
                                        pendingChanges.set(filePath, []);
                                    const span = loc.getTextSpan();
                                    pendingChanges.get(filePath).push({
                                        start: span.getStart(),
                                        end: span.getEnd(),
                                        newName: short,
                                    });
                                }
                                this.stats.renamed++;
                            }
                        } catch (e) {
                            this.stats.skipped++;
                        }
                    }
                }
            }
        }

        // --- PHASE 2: TRANSFORMATION ---
        for (const [filePath, changes] of pendingChanges) {
            const sourceFile = project.getSourceFile(filePath);
            // Remove duplicate locations that might occur with Regex + LS overlap
            const uniqueChanges = Array.from(new Set(changes.map(c => JSON.stringify(c)))).map(s =>
                JSON.parse(s)
            );
            uniqueChanges.sort((a, b) => b.start - a.start);

            for (const change of uniqueChanges) {
                sourceFile.replaceText([change.start, change.end], change.newName);
            }
        }

        this.printReport();

        if (!this.options.dryRun) {
            if (this.options.outDir) await project.emit();
            else if (this.options.writeInPlace) await project.save();
            if (this.options.outputMapPath)
                await IOHandler.saveJson(
                    this.options.outputMapPath,
                    Object.fromEntries(this.sessionMap)
                );
        }
    }

    printReport() {
        console.log(`\n--- Type-Minifier Report ---`);
        console.log(`Classes: ${this.stats.classes} | Props: ${this.stats.total}`);
        console.log(`✅ Renamed: ${this.stats.renamed} | ❌ Skipped: ${this.stats.skipped}`);
    }
}
