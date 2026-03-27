import { afterEach, expect, test } from "bun:test";
import { createServer } from "../src/server/index";

let server: ReturnType<typeof createServer> | null = null;

afterEach(() => {
  server?.stop();
  server = null;
});

test("/ にアクセスするとプレースホルダーHTMLが返る", async () => {
  server = createServer(19999);
  const res = await fetch("http://localhost:19999/");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toContain("text/html");
  const body = await res.text();
  expect(body).toContain("Hello, task!");
});

test("/api/* へのリクエストは 404 を返す", async () => {
  server = createServer(19998);
  const res = await fetch("http://localhost:19998/api/tasks");
  expect(res.status).toBe(404);
});

test("/foo のような任意のパスでもプレースホルダーHTMLが返る", async () => {
  server = createServer(19997);
  const res = await fetch("http://localhost:19997/foo/bar");
  expect(res.status).toBe(200);
  const body = await res.text();
  expect(body).toContain("Hello, task!");
});
