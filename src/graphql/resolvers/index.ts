import { GraphQLError } from "graphql";
import type { Prisma } from "@prisma/client";
import type {
  BookmarkPage,
  BookmarkRecord,
  Context,
  FolderRecord,
} from "../../types/domain";
import { validateTitle, validateUrl } from "../../validation/bookmark";

const DEFAULT_TAKE = 20;
const MAX_TAKE = 100;

type BookmarkFilterArgs = {
  folderId?: string | null;
  search?: string | null;
  take: number;
  cursor?: string | null;
};

type Cursor = {
  createdAt: string;
  id: string;
};

type CreateBookmarkArgs = {
  input: { title: string; url: string; tags: string[]; folderId: string };
};

type UpdateBookmarkArgs = {
  id: string;
  input: { title?: string | null; url?: string | null; tags?: string[] | null };
};

type IdArgs = { id: string };
type CreateFolderArgs = { name: string };
type MoveBookmarkArgs = { id: string; folderId: string };

function encodeCursor(bookmark: BookmarkRecord): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: bookmark.createdAt.toISOString(),
      id: bookmark.id,
    }),
  ).toString("base64url");
}

function decodeCursor(value: string): Cursor {
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    );
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof Reflect.get(decoded, "createdAt") !== "string" ||
      typeof Reflect.get(decoded, "id") !== "string"
    ) {
      throw new Error("Invalid cursor");
    }
    return {
      createdAt: Reflect.get(decoded, "createdAt") as string,
      id: Reflect.get(decoded, "id") as string,
    };
  } catch {
    throw new GraphQLError("Invalid pagination cursor");
  }
}

function requiredTake(take: number): number {
  if (!Number.isInteger(take) || take < 1 || take > MAX_TAKE) {
    throw new GraphQLError(`take must be between 1 and ${MAX_TAKE}`);
  }
  return take;
}

function notFound(message: string): never {
  throw new GraphQLError(message);
}

export const resolvers = {
  Query: {
    folders: async (
      _parent: unknown,
      _args: Record<string, never>,
      context: Context,
    ): Promise<FolderRecord[]> =>
      context.db.folder.findMany({ orderBy: { createdAt: "asc" } }),
    folder: async (
      _parent: unknown,
      args: IdArgs,
      context: Context,
    ): Promise<FolderRecord | null> =>
      context.db.folder.findUnique({ where: { id: args.id } }),
    bookmarks: async (
      _parent: unknown,
      args: BookmarkFilterArgs,
      context: Context,
    ): Promise<BookmarkPage> => {
      const take = requiredTake(args.take ?? DEFAULT_TAKE);
      const cursor = args.cursor ? decodeCursor(args.cursor) : null;
      const where: Prisma.BookmarkWhereInput = {
        ...(args.folderId ? { folderId: args.folderId } : {}),
        ...(args.search
          ? { title: { contains: args.search, mode: "insensitive" } }
          : {}),
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: new Date(cursor.createdAt) } },
                {
                  createdAt: new Date(cursor.createdAt),
                  id: { lt: cursor.id },
                },
              ],
            }
          : {}),
      };
      const records = await context.db.bookmark.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: take + 1,
      });
      const hasNextPage = records.length > take;
      const items = hasNextPage ? records.slice(0, take) : records;
      return {
        items,
        nextCursor: hasNextPage ? encodeCursor(items[items.length - 1]) : null,
      };
    },
  },
  Folder: {
    bookmarks: async (
      folder: FolderRecord,
      _args: Record<string, never>,
      context: Context,
    ): Promise<BookmarkRecord[]> =>
      context.db.bookmark.findMany({
        where: { folderId: folder.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
  },
  Mutation: {
    createFolder: async (
      _parent: unknown,
      args: CreateFolderArgs,
      context: Context,
    ): Promise<FolderRecord> => {
      const name = args.name.trim();
      if (name.length === 0) throw new GraphQLError("Invalid folder name");
      return context.db.folder.create({ data: { name } });
    },
    createBookmark: async (
      _parent: unknown,
      args: CreateBookmarkArgs,
      context: Context,
    ): Promise<BookmarkRecord> => {
      const title = validateTitle(args.input.title);
      const url = validateUrl(args.input.url);
      const folder = await context.db.folder.findUnique({
        where: { id: args.input.folderId },
      });
      if (!folder) notFound("Folder not found");
      return context.db.bookmark.create({
        data: { ...args.input, title, url },
      });
    },
    updateBookmark: async (
      _parent: unknown,
      args: UpdateBookmarkArgs,
      context: Context,
    ): Promise<BookmarkRecord> => {
      const existing = await context.db.bookmark.findUnique({
        where: { id: args.id },
      });
      if (!existing) notFound("Bookmark not found");
      const data: Prisma.BookmarkUpdateInput = {
        ...(args.input.title !== undefined && args.input.title !== null
          ? { title: validateTitle(args.input.title) }
          : {}),
        ...(args.input.url !== undefined && args.input.url !== null
          ? { url: validateUrl(args.input.url) }
          : {}),
        ...(args.input.tags !== undefined && args.input.tags !== null
          ? { tags: args.input.tags }
          : {}),
      };
      return context.db.bookmark.update({ where: { id: args.id }, data });
    },
    deleteBookmark: async (
      _parent: unknown,
      args: IdArgs,
      context: Context,
    ): Promise<BookmarkRecord> => {
      const existing = await context.db.bookmark.findUnique({
        where: { id: args.id },
      });
      if (!existing) notFound("Bookmark not found");
      return context.db.bookmark.delete({ where: { id: args.id } });
    },
    moveBookmark: async (
      _parent: unknown,
      args: MoveBookmarkArgs,
      context: Context,
    ): Promise<BookmarkRecord> => {
      const bookmark = await context.db.bookmark.findUnique({
        where: { id: args.id },
      });
      if (!bookmark) notFound("Bookmark not found");
      const folder = await context.db.folder.findUnique({
        where: { id: args.folderId },
      });
      if (!folder) notFound("Target folder does not exist");
      return context.db.bookmark.update({
        where: { id: args.id },
        data: { folderId: args.folderId },
      });
    },
  },
};
