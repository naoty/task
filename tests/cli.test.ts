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

test("--version はバージョンのみを表示する", () => {
  expect(run("--version").trim()).toBe("0.1.0");
});

test("-v はバージョンのみを表示する", () => {
  expect(run("-v").trim()).toBe("0.1.0");
});
