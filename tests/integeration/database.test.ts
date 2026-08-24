import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/db/prisma";

describe("PostgreSQL integration", () => {
  it("can persist and retrieve a folder and its bookmark", async () => {
    const folder = await prisma.folder.create({
      data: {
        name: "Integration Test Folder",
      },
    });

    const bookmark = await prisma.bookmark.create({
      data: {
        title: "Bun Documentation",
        url: "https://bun.sh",
        tags: ["bun", "javascript"],
        folderId: folder.id,
      },
    });

    const savedBookmark = await prisma.bookmark.findUnique({
      where: {
        id: bookmark.id,
      },
    });

    expect(savedBookmark).not.toBeNull();
    expect(savedBookmark?.id).toBe(bookmark.id);
    expect(savedBookmark?.title).toBe("Bun Documentation");
    expect(savedBookmark?.folderId).toBe(folder.id);

    await prisma.bookmark.delete({
      where: {
        id: bookmark.id,
      },
    });

    await prisma.folder.delete({
      where: {
        id: folder.id,
      },
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});