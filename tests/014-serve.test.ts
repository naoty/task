import { afterEach, expect, test } from "bun:test";
import { createServer } from "../src/server/index";
import { useTempTaskDir } from "./helpers";

let server: ReturnType<typeof createServer> | null = null;

const { taskDir } = useTempTaskDir();

afterEach(() => {
  server?.stop();
  server = null;
});

test("/ にアクセスするとプレースホルダーHTMLが返る", async () => {
  server = createServer(19999, taskDir());
  const res = await fetch("http://localhost:19999/");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toContain("text/html");
  const body = await res.text();
  expect(body).toContain("Hello, task!");
});

test("/api/tasks へのリクエストはタスク一覧をJSONで返す", async () => {
  server = createServer(19998, taskDir());
  const res = await fetch("http://localhost:19998/api/tasks");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toContain("application/json");
  const body = await res.json();
  expect(body).toHaveProperty("tasks");
  expect(Array.isArray(body.tasks)).toBe(true);
});

test("/api/other へのリクエストは 404 を返す", async () => {
  server = createServer(19997, taskDir());
  const res = await fetch("http://localhost:19997/api/other");
  expect(res.status).toBe(404);
});

test("/foo のような任意のパスでもプレースホルダーHTMLが返る", async () => {
  server = createServer(19996, taskDir());
  const res = await fetch("http://localhost:19996/foo/bar");
  expect(res.status).toBe(200);
  const body = await res.text();
  expect(body).toContain("Hello, task!");
});
