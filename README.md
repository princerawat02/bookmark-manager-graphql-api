# Bookmark Manager API

A small GraphQL API for saving bookmarks in folders. It is built with Bun, TypeScript, GraphQL Yoga, Prisma, and PostgreSQL.

## Run it locally

You need [Bun](https://bun.sh/) and Docker installed.

```bash
git clone <your-repository-url>
cd bookmark-manager
bun install
```

Create a `.env` file in the project folder:

```env
DATABASE_URL="postgresql://bookmark_user:bookmark_password@localhost:5432/bookmark_manager?schema=public"
```

Start the database, set up Prisma, and run the API:

```bash
docker compose up -d
bunx --bun prisma generate
bunx --bun prisma migrate deploy
bun run dev
```

The API runs at `http://localhost:4000/graphql`.

When you are finished, stop the database with:

```bash
docker compose down
```

## Database changes

The database has two models: `Folder` and `Bookmark`. A bookmark must belong to a folder. Deleting a folder also deletes its bookmarks.

After changing `prisma/schema.prisma`, create a migration during development with:

```bash
bunx --bun prisma migrate dev --name describe-your-change
```

Then regenerate the client:

```bash
bunx --bun prisma generate
```

## GraphQL API

The schema is in `src/graphql/schema.graphql`. Resolvers are in `src/graphql/resolvers/`.

### Queries

- `folders` gets all folders, including bookmarks when requested.
- `folder(id)` gets one folder and its bookmarks.
- `bookmarks(folderId, search, take, cursor)` lists bookmarks.

`folderId` filters by folder. `search` looks for text in a bookmark title.

Example:

```graphql
query {
  bookmarks(search: "prisma", take: 10) {
    items {
      id
      title
      url
      tags
      folderId
    }
    hasNextPage
    nextCursor
  }
}
```

### Mutations

- `createFolder(name)`
- `createBookmark(title, url, tags, folderId)`
- `updateBookmark(id, title, url, tags)`
- `deleteBookmark(id)`
- `moveBookmark(id, folderId)`

Create a folder first, then use its ID to create bookmarks:

```graphql
mutation {
  createFolder(name: "Development") {
    id
    name
  }
}
```

```graphql
mutation {
  createBookmark(
    title: "Prisma Docs"
    url: "https://www.prisma.io/docs"
    tags: ["database", "orm"]
    folderId: "FOLDER_ID"
  ) {
    id
    title
    url
  }
}
```

Titles cannot be empty, and URLs must be valid. Missing folders and bookmarks return GraphQL errors.

## Pagination

Bookmarks are ordered by `createdAt DESC, id DESC`. The API returns up to `take` items and provides a `nextCursor` when more items are available.

Use that cursor in the next request:

```graphql
query {
  bookmarks(take: 10, cursor: "NEXT_CURSOR") {
    items {
      id
      title
    }
    hasNextPage
    nextCursor
  }
}
```

The cursor contains the last bookmark's creation time and ID, so the next page continues from the correct position without repeating items.

## Tests

The integration tests use the PostgreSQL container, so start Docker first:

```bash
docker compose up -d
bunx vitest run
```

For watch mode:

```bash
bunx vitest
```

## Future work

If this API grew, useful next steps would be authentication, authorization, caching, API versioning, and scaling.
