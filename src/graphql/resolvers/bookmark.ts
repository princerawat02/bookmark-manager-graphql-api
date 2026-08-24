import { GraphQLError } from "graphql";
import { prisma } from "../../db/prisma";
import {
  decodeCursor,
  encodeCursor,
} from "../pagination";

type BookmarkQueryArgs = {
  folderId?: string;
  search?: string;
  take?: number;
  cursor?: string;
};

export const bookmarkResolvers = {
  Query: {
    bookmarks: async (
      _parent: unknown,
      args: BookmarkQueryArgs,
    ) => {
      const take = args.take ?? 10;

      if (take <= 0) {
        throw new GraphQLError("take must be greater than 0", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      const cursor = args.cursor
        ? decodeCursor(args.cursor)
        : undefined;

      const bookmarks = await prisma.bookmark.findMany({
        where: {
          ...(args.folderId
            ? {
                folderId: args.folderId,
              }
            : {}),

          ...(args.search
            ? {
                title: {
                  contains: args.search,
                  mode: "insensitive",
                },
              }
            : {}),

          ...(cursor
            ? {
                OR: [
                  {
                    createdAt: {
                      lt: new Date(cursor.createdAt),
                    },
                  },
                  {
                    createdAt: new Date(cursor.createdAt),
                    id: {
                      lt: cursor.id,
                    },
                  },
                ],
              }
            : {}),
        },

        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],

        take: take + 1,
      });

      const hasNextPage = bookmarks.length > take;

      const items = hasNextPage
        ? bookmarks.slice(0, take)
        : bookmarks;

      const lastItem = items.at(-1);

      return {
        items,
        nextCursor: lastItem
          ? encodeCursor({
              createdAt: lastItem.createdAt.toISOString(),
              id: lastItem.id,
            })
          : null,
        hasNextPage,
      };
    },
  },
};