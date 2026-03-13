#!/usr/bin/env node
// @ts-check

import { parseArgs } from './src/cli.js';
import { ProjectProcessor } from './src/processor.js';

/**
 * Type-Minifier Entry Point
 */
async function main() {
    try {
        const options = await parseArgs(process.argv.slice(2));
        const processor = new ProjectProcessor(options);

        await processor.run();
    } catch (err) {
        console.error('\n❌ Type-Minifier Error:');
        console.error(err.message || err);
        process.exit(1);
    }
}

main();
