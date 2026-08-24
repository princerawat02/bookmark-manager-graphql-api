type BookmarkCursor = {
  createdAt: string;
  id: string;
};

export function encodeCursor(cursor: BookmarkCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(cursor: string): BookmarkCursor {
  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as unknown;

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("createdAt" in decoded) ||
      !("id" in decoded) ||
      typeof decoded.createdAt !== "string" ||
      typeof decoded.id !== "string"
    ) {
      throw new Error();
    }

    return {
      createdAt: decoded.createdAt,
      id: decoded.id,
    };
  } catch {
    throw new Error("Invalid pagination cursor");
  }
}