import { GraphQLError } from "graphql";

export function validateTitle(title: string): string {
  const normalizedTitle = title.trim();
  if (normalizedTitle.length === 0) {
    throw new GraphQLError("Invalid bookmark title");
  }
  return normalizedTitle;
}

export function validateUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.protocol || !parsedUrl.hostname) {
      throw new Error("Invalid URL");
    }
  } catch {
    throw new GraphQLError("Invalid bookmark URL");
  }
  return url;
}
