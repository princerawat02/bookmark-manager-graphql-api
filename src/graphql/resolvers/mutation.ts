import { GraphQLError } from "graphql";
import { prisma } from "../../db/prisma";
import {
  validateBookmarkTitle,
  validateBookmarkUrl,
} from "../../validation/bookmark";

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

    createBookmark: async (
      _parent: unknown,
      args: {
        title: string;
        url: string;
        tags: string[];
        folderId: string;
      },
    ) => {
      const title = validateBookmarkTitle(args.title);
      const url = validateBookmarkUrl(args.url);

      const folder = await prisma.folder.findUnique({
        where: {
          id: args.folderId,
        },
      });

      if (!folder) {
        throw new GraphQLError("Folder not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      return prisma.bookmark.create({
        data: {
          title,
          url,
          tags: args.tags,
          folderId: args.folderId,
        },
      });
    },
  },
};