#!/usr/bin/env node

import cac from "cac";
import { version } from "../../package.json" with { type: "json" };

const cli = cac("task");

cli.option("-v, --version", "バージョンを表示する");
cli.help();

const { options } = cli.parse();

if (options.version) {
  console.log(version);
  process.exit(0);
}
