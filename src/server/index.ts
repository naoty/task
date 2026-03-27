import placeholderHtml from "./placeholder.html" with { type: "text" };

export function createServer(port: number): ReturnType<typeof Bun.serve> {
  return Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url);
      if (url.pathname.startsWith("/api/")) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response(placeholderHtml, {
        headers: { "Content-Type": "text/html" },
      });
    },
  });
}
