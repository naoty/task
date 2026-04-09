import open from "open";
import { createServer } from "../server/index";

export async function serve(port: number, taskDir: string): Promise<void> {
  const server = createServer(port, taskDir);
  const url = `http://localhost:${server.port}`;
  console.log(`🚀 Listening on ${url}`);
  console.log(`🌐 Opening browser...`);
  await open(url);
}
