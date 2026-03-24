import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { depAdd } from "../src/commands/dep-add";
import { useTempTaskDir } from "./helpers";

const { taskDir } = useTempTaskDir();

test("依存関係を追加する", async () => {
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2], dependencies: {} }),
  );

  await depAdd(1, [2], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2] });
});

test("複数の依存関係を一度に追加する", async () => {
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2, 3, 4], dependencies: {} }),
  );

  await depAdd(1, [2, 3, 4], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2, 3, 4] });
});

test("すでに存在する依存関係は重複して追加しない", async () => {
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [1, 2], dependencies: { "1": [2] } }),
  );

  await depAdd(1, [2], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2] });
});

test("インデックスファイルが存在しない場合でも依存関係を追加する", async () => {
  await depAdd(1, [2], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.dependencies).toEqual({ "1": [2] });
});

test("orderフィールドを変更しない", async () => {
  writeFileSync(
    resolve(taskDir(), "index.json"),
    JSON.stringify({ order: [3, 1, 2], dependencies: {} }),
  );

  await depAdd(1, [2], taskDir());

  const index = JSON.parse(readFileSync(resolve(taskDir(), "index.json"), "utf-8"));
  expect(index.order).toEqual([3, 1, 2]);
});
