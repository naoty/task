import { list } from "../commands/list";
import placeholderHtml from "./placeholder.html" with { type: "text" };

export function createServer(
  port: number,
  taskDir: string,
): ReturnType<typeof Bun.serve> {
  return Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/api/tasks" && req.method === "GET") {
        const result = await list(taskDir);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.pathname.startsWith("/api/")) {
        return new Response("Not Found", { status: 404 });
      }

      return new Response(placeholderHtml, {
        headers: { "Content-Type": "text/html" },
      });
    },
  });
}
