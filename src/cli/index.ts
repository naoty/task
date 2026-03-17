#!/usr/bin/env node

import cac from "cac";
import { version } from "../../package.json" with { type: "json" };

const cli = cac("task");

cli.version(version);
cli.help();

cli.parse();
