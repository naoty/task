import { createServer } from "../server/index";

export function serve(port: number, taskDir: string): void {
  const server = createServer(port, taskDir);
  console.log(`Listening on http://localhost:${server.port}`);
}
