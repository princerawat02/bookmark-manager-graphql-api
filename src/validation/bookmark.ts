import { GraphQLError } from "graphql";

export function validateBookmarkTitle(title: string): string {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new GraphQLError("Bookmark title cannot be empty", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }

  return trimmedTitle;
}

export function validateBookmarkUrl(url: string): string {
  try {
    new URL(url);
  } catch {
    throw new GraphQLError("Bookmark URL is invalid", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }

  return url;
}