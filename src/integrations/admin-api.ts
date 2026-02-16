import type { AstroIntegration } from "astro";
import type { Connect, Plugin } from "vite";
import {
  listCollections,
  getContent,
  saveContent,
  createContent,
  deleteContent,
} from "../server/admin/handlers.ts";

function parseBody(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => (data += chunk.toString()));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function json(res: import("http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function adminVitePlugin(): Plugin {
  return {
    name: "admin-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/admin")) return next();

        try {
          // GET /api/admin/collections
          if (url === "/api/admin/collections" && req.method === "GET") {
            return json(res, 200, listCollections());
          }

          // Match /api/admin/content/:collection/:slug
          const contentMatch = url.match(
            /^\/api\/admin\/content\/([a-z]+)\/([a-z0-9][a-z0-9-]*)$/,
          );
          // Match /api/admin/content/:collection (for POST create)
          const collectionMatch = url.match(/^\/api\/admin\/content\/([a-z]+)$/);

          if (contentMatch) {
            const [, collection, slug] = contentMatch;

            if (req.method === "GET") {
              return json(res, 200, getContent(collection, slug));
            }

            if (req.method === "PUT") {
              const body = await parseBody(req);
              const result = saveContent(
                collection,
                slug,
                body.frontmatter as Record<string, unknown>,
                (body.body as string) ?? "",
              );
              return json(res, 200, result);
            }

            if (req.method === "DELETE") {
              return json(res, 200, deleteContent(collection, slug));
            }
          }

          if (collectionMatch && req.method === "POST") {
            const [, collection] = collectionMatch;
            const body = await parseBody(req);
            const result = createContent(
              collection,
              body.slug as string,
              body.frontmatter as Record<string, unknown>,
              (body.body as string) ?? "",
            );
            return json(res, 201, result);
          }

          json(res, 404, { error: "Not found" });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Server error";
          json(res, 400, { error: message });
        }
      });
    },
  };
}

export default function adminApi(): AstroIntegration {
  return {
    name: "admin-api",
    hooks: {
      "astro:config:setup"({ updateConfig, command }) {
        if (command !== "dev") return;
        updateConfig({
          vite: {
            plugins: [adminVitePlugin()],
          },
        });
      },
    },
  };
}
