import { createSchema, createYoga } from "graphql-yoga";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { db } from "./db/client";
import { resolvers } from "./graphql/resolvers/index";
import type { Context } from "./types/domain";

const typeDefs = await readFile(
  new URL("./graphql/schema.graphql", import.meta.url),
  "utf8",
);
const schema = createSchema({ typeDefs, resolvers });
const yoga = createYoga({
  schema,
  context: async (): Promise<Context> => ({ db }),
});
const port = Number(process.env.PORT ?? 4000);
const server = createServer(yoga);

server.listen(port, () => {
  console.log(
    `Bookmark Manager GraphQL API running at http://localhost:${port}/graphql`,
  );
});

process.on("SIGINT", async () => {
  await db.$disconnect();
  server.close();
});
