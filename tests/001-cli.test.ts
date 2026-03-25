import { spawnSync } from "node:child_process";
import { expect, test } from "vite-plus/test";
import { version } from "../package.json" with { type: "json" };

const BINARY = "./build/task-linux-x64";

test("--version はバージョンのみを表示する", () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

test("-v はバージョンのみを表示する", () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

test("引数なしで実行するとエラーとコマンド一覧をJSON形式で返す", () => {
  const result = spawnSync(BINARY, [], { encoding: "utf8" });
  const output = JSON.parse(result.stdout);
  expect(output.ok).toBe(false);
  expect(output.error.message).toBe("command is required");
  expect(output.error.usage).toBe("task <subcommand>");
  expect(output.error.subcommands).toBeInstanceOf(Array);
  expect(output.error.subcommands.length).toBeGreaterThan(0);
});

test("--help はコマンド一覧をJSON形式で返す", () => {
  const result = spawnSync(BINARY, ["--help"], { encoding: "utf8" });
  const output = JSON.parse(result.stdout);
  expect(output.ok).toBe(true);
  expect(output.result.usage).toBe("task <subcommand>");
  expect(output.result.subcommands).toBeInstanceOf(Array);
  expect(output.result.subcommands.length).toBeGreaterThan(0);
});

test("-h はコマンド一覧をJSON形式で返す", () => {
  const result = spawnSync(BINARY, ["-h"], { encoding: "utf8" });
  const output = JSON.parse(result.stdout);
  expect(output.ok).toBe(true);
  expect(output.result.usage).toBe("task <subcommand>");
  expect(output.result.subcommands).toBeInstanceOf(Array);
});
