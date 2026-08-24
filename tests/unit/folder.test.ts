import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  folder: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  bookmark: {
    findMany: vi.fn(),
  },
}));

vi.mock("../../src/db/prisma", () => ({
  prisma: mockPrisma,
}));

import { folderResolvers } from "../../src/graphql/resolvers/folder";

describe("folder resolvers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns folders ordered by newest first", async () => {
    const folders = [
      {
        id: "folder-1",
        name: "Programming",
        createdAt: new Date(),
      },
    ];

    mockPrisma.folder.findMany.mockResolvedValue(folders);

    const result = await folderResolvers.Query.folders();

    expect(result).toEqual(folders);

    expect(mockPrisma.folder.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
    });
  });

  it("returns a folder by id", async () => {
    const folder = {
      id: "folder-1",
      name: "Programming",
      createdAt: new Date(),
    };

    mockPrisma.folder.findUnique.mockResolvedValue(folder);

    const result = await folderResolvers.Query.folder(undefined, {
      id: "folder-1",
    });

    expect(result).toEqual(folder);

    expect(mockPrisma.folder.findUnique).toHaveBeenCalledWith({
      where: {
        id: "folder-1",
      },
    });
  });

  it("returns bookmarks belonging to a folder", async () => {
    const bookmarks = [
      {
        id: "bookmark-1",
        title: "Bun",
        url: "https://bun.sh",
        tags: ["bun"],
        folderId: "folder-1",
        createdAt: new Date(),
      },
    ];

    mockPrisma.bookmark.findMany.mockResolvedValue(bookmarks);

    const result = await folderResolvers.Folder.bookmarks({
      id: "folder-1",
    });

    expect(result).toEqual(bookmarks);

    expect(mockPrisma.bookmark.findMany).toHaveBeenCalledWith({
      where: {
        folderId: "folder-1",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  });
});