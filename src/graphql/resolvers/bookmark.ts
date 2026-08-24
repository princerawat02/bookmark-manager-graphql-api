import { prisma } from "../../db/prisma";

type BookmarkQueryArgs = {
  folderId?: string;
  search?: string;
  take?: number;
};

export const bookmarkResolvers = {
  Query: {
    bookmarks: async (
      _parent: unknown,
      args: BookmarkQueryArgs,
    ) => {
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
        },

        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],
      });

      return {
        items: bookmarks,
        nextCursor: null,
        hasNextPage: false,
      };
    },
  },
};