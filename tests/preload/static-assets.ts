import { mock } from "bun:test";

mock.module("../../src/server/static-assets", () => ({
  css: "",
  html: `<!doctype html><html><head></head><body><div id="root"></div></body></html>`,
  js: "",
}));
