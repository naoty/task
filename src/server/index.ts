import { watch } from "node:fs";
import indexCss from "../../dist/ui/index.css" with { type: "text" };
import indexHtml from "../../dist/ui/index.html" with { type: "text" };
import indexJs from "../../dist/ui/index.js" with { type: "text" };
import { buildGraph } from "../commands/graph";
import { list } from "../commands/list";

export function createServer(
  port: number,
  taskDir: string,
): ReturnType<typeof Bun.serve> {
  const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
  const encoder = new TextEncoder();

  const watcher = watch(taskDir, () => {
    const data = encoder.encode("data: change\n\n");
    for (const client of clients) {
      try {
        client.enqueue(data);
      } catch {
        clients.delete(client);
      }
    }
  });

  for (let i = 0; i < 10; i++) {
    try {
      const server = Bun.serve({
        port: port + i,
        fetch: createFetch(taskDir, clients, encoder),
      });
      const originalStop = server.stop.bind(server);
      server.stop = (...args: Parameters<typeof server.stop>) => {
        watcher.close();
        return originalStop(...args);
      };
      return server;
    } catch (e) {
      if (
        e instanceof Error &&
        (e as NodeJS.ErrnoException).code === "EADDRINUSE"
      ) {
        continue;
      }
      watcher.close();
      throw e;
    }
  }
  watcher.close();
  throw new Error(`No available port found starting from ${port}`);
}

function createFetch(
  taskDir: string,
  clients: Set<ReadableStreamDefaultController<Uint8Array>>,
  encoder: TextEncoder,
) {
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

    if (url.pathname === "/api/events" && req.method === "GET") {
      let controller: ReadableStreamDefaultController<Uint8Array>;
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          controller = c;
          clients.add(controller);
          controller.enqueue(encoder.encode(": connected\n\n"));
        },
        cancel() {
          clients.delete(controller);
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
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
