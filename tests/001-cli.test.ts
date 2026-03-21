import { expect, test } from "vite-plus/test";
import { version } from "../package.json" with { type: "json" };

test("--version はバージョンのみを表示する", () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});

test("-v はバージョンのみを表示する", () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
});
