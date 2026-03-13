// @ts-check
import { Project, ScriptTarget } from 'ts-morph';
import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob'; // Using standard glob to find files for copying
import { NameGenerator } from './generator.js';
import { IOHandler } from './io.js';
import { DiscoveryService } from './discovery.js';
import { TransformerService } from './transformer.js';
import { ProjectMapper } from './discovery/project-mapper.js';

/** @typedef {import('./types.js').MinifierOptions} MinifierOptions */

export class ProjectProcessor {
    /** @param {MinifierOptions} options */
    constructor(options) {
        this.options = options;
        const existingShortNames = Object.values(options.inputMap || {});
        this.generator = new NameGenerator(existingShortNames, options.dictionaryPath);
        this.inputMap = new Map(Object.entries(options.inputMap || {}));
        this.sessionMap = new Map();
        this.ignoreSet = new Set(options.ignoreNames || []);
    }

    /**
     * Selective copy based on user input and exclude globs.
     * @param {string[]} inputGlobs
     * @param {string[]} excludeGlobs
     * @param {string} destDir
     */
    prepareWorkspace(inputGlobs, excludeGlobs, destDir) {
        const files = globSync(inputGlobs, {
            ignore: excludeGlobs,
            nodir: true,
            absolute: false,
        });

        if (files.length > 0) {
            console.log(`📂 Copying ${files.length} files to workspace: ${destDir}`);
        }

        for (const file of files) {
            const destPath = path.join(destDir, file);
            const dir = path.dirname(destPath);

            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.copyFileSync(file, destPath);
        }
        return files;
    }

    /**
     * Helper to check if a file is a JS target.
     * @param {import('ts-morph').SourceFile} file
     */
    static isTargetFile(file) {
        const pathStr = file.getFilePath().toLowerCase();
        return pathStr.endsWith('.js') || pathStr.endsWith('.mjs') || pathStr.endsWith('.cjs');
    }

    async run() {
        const isWriteMode = !this.options.dryRun;
        const useOutDir = isWriteMode && this.options.outDir;
        const workDir = useOutDir ? path.resolve(this.options.outDir) : process.cwd();

        if (useOutDir) {
            this.prepareWorkspace(this.options.inputGlobs, this.options.excludeGlobs, workDir);
        }

        const project = new Project({
            tsConfigFilePath: this.options.projectPath
                ? path.resolve(workDir, this.options.projectPath)
                : undefined,
            compilerOptions: {
                allowJs: true,
                checkJs: true,
                target: ScriptTarget.ESNext,
                lib: ['ESNext', 'DOM'],
                noEmit: true,
            },
            skipAddingFilesFromTsConfig: !this.options.projectPath,
        });

        if (!this.options.projectPath) {
            const searchPattern = useOutDir
                ? path.join(workDir, '**/*.{js,mjs,cjs,ts,d.ts}')
                : this.options.inputGlobs;
            project.addSourceFilesAtPaths(searchPattern);

            if (!useOutDir && this.options.excludeGlobs.length > 0) {
                const excluded = project.addSourceFilesAtPaths(this.options.excludeGlobs);
                excluded.forEach(f => project.removeSourceFile(f));
            }
        }

        // PHASE 0.5: GENERATE PROJECT MAP
        console.log('🗺️  Generating project property map...');
        const { jsonMap, nodeMap } = ProjectMapper.buildMap(project, f =>
            ProjectProcessor.isTargetFile(f)
        );

        // Save ONLY the serializable JSON for debugging
        await IOHandler.saveJson(path.join(process.cwd(), 'project-map.json'), jsonMap);

        const discovery = new DiscoveryService(
            project,
            this.options,
            this.generator,
            this.inputMap,
            this.sessionMap,
            this.ignoreSet,
            nodeMap 
        );

        const { pendingChanges, stats, errors, debugAnyLogs } = discovery.discover();

        // Save Debug Logs once
        if (debugAnyLogs && debugAnyLogs.length > 0) {
            const debugPath = path.join(process.cwd(), 'type-minifier-debug.json');
            await IOHandler.saveJson(debugPath, debugAnyLogs);
            console.log(
                `\n🔍 DEBUG: Found ${debugAnyLogs.length} ambiguous types. Details: ${debugPath}`
            );
        }

        TransformerService.apply(project, pendingChanges);

        this.printReport(stats, errors);

        if (isWriteMode) {
            console.log(`💾 Saving changes to: ${workDir}`);
            await project.save();

            if (this.options.outputMapPath) {
                await IOHandler.saveJson(
                    this.options.outputMapPath,
                    Object.fromEntries(this.sessionMap)
                );
            }
        } else {
            console.log('\n⚠️ MODE: DRY-RUN. No files were modified.');
        }
    }

    /**
     * @param {import('./types.js').MinifierStats} stats
     * @param {string[]} errors
     */
    printReport(stats, errors) {
        const status = this.options.dryRun ? 'DRY-RUN' : 'COMPLETED';
        console.log(`\n--- Type-Minifier Report ---`);
        console.log(`Status:  ${status}`);
        console.log(`Classes: ${stats.classes} | Props: ${stats.total}`);
        console.log(`✅ Renamed: ${stats.renamed} | ❌ Skipped: ${stats.skipped}`);
        if (errors.length > 0) {
            console.warn(`\nWarnings Summary (Last 10):`);
            errors.slice(-10).forEach(e => console.warn(`  - ${e}`));
        }
    }
}
