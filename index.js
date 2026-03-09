#!/usr/bin/env node
// @ts-check

import { ProjectProcessor } from "./src/processor.js";
import { IOHandler } from "./src/io.js";

const args = process.argv.slice(2);
const usage = `
JSDoc Minifier CLI (Dry-run by default)

Usage: node index.js <glob> [options]

Options:
  --input-map <path>   Seed names from JSON
  --output-map <path>  Save current session names to JSON (auto-cleanup)
  --exclude <path>     JSON array of names to ignore
  --outDir <path>      Save results to directory
  --write              Overwrite sources (Caution!)
  --dts                Generate .d.ts files
  --keep-underscore    Keep "_" prefix
`;

if (args.includes("-h") || args.length === 0) {
  console.log(usage);
  process.exit(0);
}

const getArg = (flag) => args[args.indexOf(flag) + 1];

const options = {
  inputMap: await IOHandler.loadJson(getArg("--input-map")) || {},
  outputMapPath: getArg("--output-map"),
  exclude: await IOHandler.loadJson(getArg("--exclude")) || [],
  outDir: getArg("--outDir"),
  writeInPlace: args.includes("--write"),
  dryRun: !args.includes("--write") && !args.includes("--outDir"),
  dts: args.includes("--dts"),
  underscore: args.includes("--keep-underscore")
};

const glob = args.find(a => !a.startsWith("-"));
new ProjectProcessor(options).run(glob).catch(console.error);
