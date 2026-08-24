import { prisma } from "../../db/prisma";

export const folderResolvers = {
  Query: {
    folders: () => {
      return prisma.folder.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
    },

    folder: (_parent: unknown, args: { id: string }) => {
      return prisma.folder.findUnique({
        where: {
          id: args.id,
        },
      });
    },
  },

  Folder: {
    bookmarks: (parent: { id: string }) => {
      return prisma.bookmark.findMany({
        where: {
          folderId: parent.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },
  },
};