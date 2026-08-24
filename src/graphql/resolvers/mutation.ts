import { GraphQLError } from "graphql";
import { prisma } from "../../db/prisma";

export const mutationResolvers = {
  Mutation: {
    createFolder: async (_parent: unknown, args: { name: string }) => {
      const name = args.name.trim();

      if (!name) {
        throw new GraphQLError("Folder name cannot be empty", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      return prisma.folder.create({
        data: {
          name,
        },
      });
    },
  },
};