import { expect, test } from "vite-plus/test";
import { version } from "../package.json" with { type: "json" };
import { runCli } from "../src/cli/run";

test("--version はバージョンのみを表示する", () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

test("-v はバージョンのみを表示する", () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

test("引数なしで実行するとエラーとコマンド一覧をJSON形式で返す", async () => {
  const { output, exitCode } = await runCli([], "/tmp");
  const result = JSON.parse(output);
  expect(exitCode).toBe(1);
  expect(result.ok).toBe(false);
  expect(result.error.message).toBe("command is required");
  expect(result.error.usage).toBe("task <subcommand>");
  expect(result.error.subcommands).toBeInstanceOf(Array);
  expect(result.error.subcommands.length).toBeGreaterThan(0);
});

test("--help はコマンド一覧をJSON形式で返す", async () => {
  const { output, exitCode } = await runCli(["--help"], "/tmp");
  const result = JSON.parse(output);
  expect(exitCode).toBe(0);
  expect(result.ok).toBe(true);
  expect(result.result.usage).toBe("task <subcommand>");
  expect(result.result.subcommands).toBeInstanceOf(Array);
  expect(result.result.subcommands.length).toBeGreaterThan(0);
});

test("-h はコマンド一覧をJSON形式で返す", async () => {
  const { output, exitCode } = await runCli(["-h"], "/tmp");
  const result = JSON.parse(output);
  expect(exitCode).toBe(0);
  expect(result.ok).toBe(true);
  expect(result.result.usage).toBe("task <subcommand>");
  expect(result.result.subcommands).toBeInstanceOf(Array);
  expect(result.result.subcommands.length).toBeGreaterThan(0);
});

test("dep はサブコマンドなしでエラーを返す", async () => {
  const { output, exitCode } = await runCli(["dep"], "/tmp");
  const result = JSON.parse(output);
  expect(exitCode).toBe(1);
  expect(result.ok).toBe(false);
  expect(result.error.message).toBe("subcommand is required");
});
