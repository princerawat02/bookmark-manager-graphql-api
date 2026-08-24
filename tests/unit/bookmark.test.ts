import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  bookmark: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  folder: {
    findUnique: vi.fn(),
  },
}));

vi.mock("../../src/db/prisma", () => ({
  prisma: mockPrisma,
}));

import { mutationResolvers } from "../../src/graphql/resolvers/mutation";

describe("createBookmark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a bookmark in an existing folder", async () => {
    mockPrisma.folder.findUnique.mockResolvedValue({
      id: "folder-1",
    });

    const bookmark = {
      id: "bookmark-1",
      title: "Bun",
      url: "https://bun.sh",
      tags: ["bun"],
      folderId: "folder-1",
      createdAt: new Date(),
    };

    mockPrisma.bookmark.create.mockResolvedValue(bookmark);

    const result = await mutationResolvers.Mutation.createBookmark(
      undefined,
      {
        title: "Bun",
        url: "https://bun.sh",
        tags: ["bun"],
        folderId: "folder-1",
      },
    );

    expect(result).toEqual(bookmark);

    expect(mockPrisma.bookmark.create).toHaveBeenCalledWith({
      data: {
        title: "Bun",
        url: "https://bun.sh",
        tags: ["bun"],
        folderId: "folder-1",
      },
    });
  });

  it("rejects an empty bookmark title", async () => {
    await expect(
      mutationResolvers.Mutation.createBookmark(undefined, {
        title: "   ",
        url: "https://bun.sh",
        tags: [],
        folderId: "folder-1",
      }),
    ).rejects.toMatchObject({
      message: "Bookmark title cannot be empty",
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });

    expect(mockPrisma.folder.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.bookmark.create).not.toHaveBeenCalled();
  });
});