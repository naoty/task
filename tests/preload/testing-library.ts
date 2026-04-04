import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach } from "bun:test";

afterEach(() => {
  cleanup();
});
