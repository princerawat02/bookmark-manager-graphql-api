import { createYoga, createSchema } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { folderResolvers } from "./graphql/resolvers/folder";

const typeDefs = readFileSync(
  resolve(import.meta.dir, "graphql/schema.graphql"),
  "utf-8",
);

const schema = createSchema({
  typeDefs,
  resolvers: {
   ...folderResolvers,
    Mutation: {},
  },
});

const yoga = createYoga({
  schema,
});

Bun.serve({
  fetch: yoga,
  port: 4000,
});

console.log("GraphQL server running at http://localhost:4000/graphql");