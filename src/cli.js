// @ts-check

import { IOHandler } from './io.js';
import { showHelp } from './help.js';

/**
 * Parses command line arguments into a structured options object.
 * @param {string[]} args - The process.argv.slice(2) array.
 * @returns {Promise<import('./types.js').MinifierOptions>}
 */
export async function parseArgs(args) {
    /** @type {import('./types.js').MinifierOptions} */
    const options = {
        inputGlobs: [],
        excludeGlobs: [],
        ignoreNames: [],
        projectPath: null,
        underscore: false,
        dts: false,
        writeInPlace: false,
        dryRun: true,
        outputMapPath: null,
        inputMap: {},
        outDir: '',
        dictionaryPath: '',
    };

    if (args.includes('-h') || args.includes('--help') || args.length === 0) {
        showHelp();
        process.exit(0);
    }

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--project':
            case '-p':
                options.projectPath = args[++i];
                break;
            case '--exclude':
                options.excludeGlobs.push(args[++i]);
                break;
            case '--ignore-names':
                options.ignoreNames = (await IOHandler.loadJson(args[++i])) || [];
                break;
            case '--input-map':
                options.inputMap = (await IOHandler.loadJson(args[++i])) || {};
                break;
            case '--output-map':
                options.outputMapPath = args[++i];
                break;
            case '--outDir':
                options.outDir = args[++i];
                break;
            case '--write':
                options.writeInPlace = true;
                break;
            case '--dts':
                options.dts = true;
                break;
            case '--keep-underscore':
                options.underscore = true;
                break;
            case '--dict':
            case '-d':
                options.dictionaryPath = args[++i];
                break;
            default:
                // Treat non-flag arguments as input globs
                if (!arg.startsWith('-')) options.inputGlobs.push(arg);
                break;
        }
    }

    if (!options.outDir) {
        throw new Error("--outDir required");
    }

    // Validation Logic: OutDir takes priority and disables In-Place writing
    if (options.outDir) {
        options.writeInPlace = false;
        options.dryRun = false;
    } else if (options.writeInPlace) {
        options.dryRun = false;
    }

    return options;
}
