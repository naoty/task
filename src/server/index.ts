import globalsCss from "../../dist/ui/globals.css" with { type: "text" };
import indexHtml from "../../dist/ui/index.html" with { type: "text" };
import mainJs from "../../dist/ui/main.js" with { type: "text" };
import { list } from "../commands/list";

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

      if (url.pathname === "/main.js") {
        return new Response(mainJs, {
          headers: { "Content-Type": "application/javascript" },
        });
      }

      if (url.pathname === "/globals.css") {
        return new Response(globalsCss, {
          headers: { "Content-Type": "text/css" },
        });
      }

      return new Response(indexHtml, {
        headers: { "Content-Type": "text/html" },
      });
    },
  });
}
