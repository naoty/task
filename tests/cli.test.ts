import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";

const root = resolve(import.meta.dirname, "..");

function run(args: string): string {
  return execSync(`node dist/index.mjs ${args}`, {
    cwd: root,
    encoding: "utf-8",
  });
}

test("--version はバージョンを表示する", () => {
  expect(run("--version")).toContain("0.1.0");
});

test("-v はバージョンを表示する", () => {
  expect(run("-v")).toContain("0.1.0");
});
