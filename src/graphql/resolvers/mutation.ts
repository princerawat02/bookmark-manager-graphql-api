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

    updateBookmark: async (
      _parent: unknown,
      args: {
        id: string;
        title?: string | null;
        url?: string | null;
        tags?: string[] | null;
      },
    ) => {
      const bookmark = await prisma.bookmark.findUnique({
        where: {
          id: args.id,
        },
      });

      if (!bookmark) {
        throw new GraphQLError("Bookmark not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      const data: {
        title?: string;
        url?: string;
        tags?: string[];
      } = {};

      if (args.title !== undefined && args.title !== null) {
        data.title = validateBookmarkTitle(args.title);
      }

      if (args.url !== undefined && args.url !== null) {
        data.url = validateBookmarkUrl(args.url);
      }

      if (args.tags !== undefined && args.tags !== null) {
        data.tags = args.tags;
      }

      return prisma.bookmark.update({
        where: {
          id: args.id,
        },
        data,
      });
    },
  },
};
