import { createServer } from "../server/index";

export function serve(port: number): void {
  createServer(port);
  console.log(`Listening on http://localhost:${port}`);
}
