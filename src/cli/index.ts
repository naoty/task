#!/usr/bin/env node

import { homedir } from "node:os";
import { resolve } from "node:path";
import { runCli } from "./run";

function getTaskDir(): string {
  return process.env.TASK_DIR ?? resolve(homedir(), ".tasks");
}

const { output, exitCode } = await runCli(process.argv.slice(2), getTaskDir());
console.log(output);
process.exit(exitCode);
