import { afterEach, beforeEach } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

export function useTempTaskDir(): { taskDir: () => string } {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(resolve(tmpdir(), "task-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  return { taskDir: () => dir };
}
