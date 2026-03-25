import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { version } from "../package.json" with { type: "json" };

test("--version はバージョンのみを表示する", () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

test("-v はバージョンのみを表示する", () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

test("dep はサブコマンドなしでエラーを返す", () => {
  const result = spawnSync(resolve(import.meta.dirname, "../build/task-linux-x64"), ["dep"], {
    encoding: "utf-8",
  });
  const output = JSON.parse(result.stdout);
  expect(output.ok).toBe(false);
  expect(output.error.message).toBe("subcommand is required");
});
