import type { PrismaClient } from "@prisma/client";

export type FolderRecord = {
  id: string;
  name: string;
  createdAt: Date;
};

export type BookmarkRecord = {
  id: string;
  title: string;
  url: string;
  tags: string[];
  folderId: string;
  createdAt: Date;
};

export type BookmarkPage = {
  items: BookmarkRecord[];
  nextCursor: string | null;
};

export type Context = {
  db: PrismaClient;
};
