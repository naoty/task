import { expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runCli } from "../src/cli/run";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("依存関係を削除する", async () => {
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: { "1": [2] } }),
  );

  await runCli(["dep", "delete", "1", "2"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({});
});

test("複数の依存関係を一度に削除する", async () => {
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({
      children: { root: [1, 2, 3, 4] },
      dependencies: { "1": [2, 3, 4] },
    }),
  );

  await runCli(["dep", "delete", "1", "2", "3"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [4] });
});

test("依存関係がなくなった場合、エントリを削除する", async () => {
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: { "1": [2] } }),
  );

  await runCli(["dep", "delete", "1", "2"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(Object.keys(index.dependencies)).not.toContain("1");
});

test("存在しない依存関係を削除しようとしても無視する", async () => {
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ children: { root: [1, 2] }, dependencies: { "1": [2] } }),
  );

  await runCli(["dep", "delete", "1", "99"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2] });
});

test("childrenフィールドを変更しない", async () => {
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({
      children: { root: [3, 1, 2] },
      dependencies: { "1": [2] },
    }),
  );

  await runCli(["dep", "delete", "1", "2"], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.children).toEqual({ root: [3, 1, 2] });
});
