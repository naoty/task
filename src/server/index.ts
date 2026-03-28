import indexCss from "../../dist/ui/index.css" with { type: "text" };
import indexHtml from "../../dist/ui/index.html" with { type: "text" };
import indexJs from "../../dist/ui/index.js" with { type: "text" };
import { buildGraph } from "../commands/graph";
import { list } from "../commands/list";

export function createServer(
  port: number,
  taskDir: string,
): ReturnType<typeof Bun.serve> {
  for (let i = 0; i < 10; i++) {
    try {
      return Bun.serve({
        port: port + i,
        fetch: createFetch(taskDir),
      });
    } catch (e) {
      if (
        e instanceof Error &&
        (e as NodeJS.ErrnoException).code === "EADDRINUSE"
      ) {
        continue;
      }
      throw e;
    }
  }
  throw new Error(`No available port found starting from ${port}`);
}

function createFetch(taskDir: string) {
  return async function fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/tasks" && req.method === "GET") {
      const result = await list(taskDir);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/api/graph" && req.method === "GET") {
      const result = await buildGraph(taskDir);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return new Response("Not Found", { status: 404 });
    }

    if (url.pathname === "/index.js") {
      return new Response(indexJs, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    if (url.pathname === "/index.css") {
      return new Response(indexCss, {
        headers: { "Content-Type": "text/css" },
      });
    }

    return new Response(indexHtml, {
      headers: { "Content-Type": "text/html" },
    });
  };
}
