import { afterEach, expect, test } from "bun:test";
import { runCli } from "../src/cli/run";
import { createServer } from "../src/server/index";
import { useTempTaskDir } from "./helpers";

let server: ReturnType<typeof createServer> | null = null;

const { taskDir } = useTempTaskDir();

afterEach(() => {
  server?.stop();
  server = null;
});

test("/ にアクセスするとindex.htmlが返る", async () => {
  server = createServer(19999, taskDir());
  const res = await fetch("http://localhost:19999/");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toContain("text/html");
  const body = await res.text();
  expect(body).toContain('<div id="root">');
});

test("/index.js にアクセスするとSPAのJSが返る", async () => {
  server = createServer(19998, taskDir());
  const res = await fetch("http://localhost:19998/index.js");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toContain("application/javascript");
});

test("/api/tasks へのリクエストはタスク一覧をJSONで返す", async () => {
  server = createServer(19997, taskDir());
  const res = await fetch("http://localhost:19997/api/tasks");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toContain("application/json");
  const body = await res.json();
  expect(body).toHaveProperty("tasks");
  expect(Array.isArray(body.tasks)).toBe(true);
});

test("/api/graph へのリクエストはグラフデータをJSONで返す", async () => {
  server = createServer(19994, taskDir());
  const res = await fetch("http://localhost:19994/api/graph");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toContain("application/json");
  const body = await res.json();
  expect(body).toHaveProperty("nodes");
  expect(body).toHaveProperty("edges");
  expect(body).toHaveProperty("rootOrder");
  expect(Array.isArray(body.nodes)).toBe(true);
  expect(Array.isArray(body.edges)).toBe(true);
  expect(Array.isArray(body.rootOrder)).toBe(true);
});

test("/api/graph の rootOrder はルートタスクの優先順位順のIDリストを返す", async () => {
  await runCli(["add", "タスクA"], taskDir());
  await runCli(["add", "タスクB"], taskDir());
  await runCli(["add", "タスクC"], taskDir());
  // タスクBを先頭に移動（優先順位: B, A, C → ID: 2, 1, 3）
  await runCli(["move", "2", "1"], taskDir());
  server = createServer(19993, taskDir());
  const res = await fetch("http://localhost:19993/api/graph");
  const body = await res.json();
  expect(body.rootOrder).toEqual(["2", "1", "3"]);
});

test("/api/other へのリクエストは 404 を返す", async () => {
  server = createServer(19996, taskDir());
  const res = await fetch("http://localhost:19996/api/other");
  expect(res.status).toBe(404);
});

test("/foo のような任意のパスでもindex.htmlが返る", async () => {
  server = createServer(19995, taskDir());
  const res = await fetch("http://localhost:19995/foo/bar");
  expect(res.status).toBe(200);
  const body = await res.text();
  expect(body).toContain('<div id="root">');
});

test("指定したポートが使用中の場合、次のポートで起動する", async () => {
  const first = createServer(19990, taskDir());
  server = createServer(19990, taskDir());
  expect(server.port).toBe(19991);
  first.stop();
});

test("10ポート試行してもすべて使用中の場合、エラーをスローする", async () => {
  const servers: ReturnType<typeof createServer>[] = [];
  for (let i = 0; i < 10; i++) {
    servers.push(createServer(19980 + i, taskDir()));
  }
  expect(() => createServer(19980, taskDir())).toThrow();
  for (const s of servers) s.stop();
});
