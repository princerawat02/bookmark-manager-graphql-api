# Bookmark Manager Walkthrough

## Project overview

This project is a small GraphQL API for organizing bookmarks into folders. It is built with:

- Bun for the runtime and package scripts
- TypeScript for application code
- GraphQL Yoga for the GraphQL HTTP server
- Prisma 7 with the PostgreSQL driver adapter for database access
- PostgreSQL running in Docker
- Vitest for unit and integration tests

The API lets a client create folders, save bookmarks with tags, search and paginate bookmarks, update or delete bookmarks, and move bookmarks between folders.

## Run it locally

Requirements: Bun and Docker.

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a `.env` file in the project root:

   ```env
   DATABASE_URL="postgresql://bookmark_user:bookmark_password@localhost:5432/bookmark_manager?schema=public"
   ```

3. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

   The Docker Compose service uses PostgreSQL 17, exposes port `5432`, and stores data in the `postgres_data` volume.

4. Generate Prisma Client and apply the existing migrations:

   ```bash
   bunx --bun prisma generate
   bunx --bun prisma migrate deploy
   ```

5. Start the API:

   ```bash
   bun run dev
   ```

The GraphQL endpoint is `http://localhost:4000/graphql`. GraphQL Yoga serves the schema defined in `src/graphql/schema.graphql`.

## Project structure

- `src/server.ts` creates the GraphQL Yoga server, loads the schema, and combines the resolvers. Bun listens on port `4000`.
- `src/db/prisma.ts` loads `DATABASE_URL`, creates the PostgreSQL adapter, and exports the Prisma client.
- `src/graphql/schema.graphql` defines the public GraphQL types, queries, mutations, and pagination response.
- `src/graphql/resolvers/folder.ts` handles folder queries and the `Folder.bookmarks` field.
- `src/graphql/resolvers/bookmark.ts` handles bookmark filtering, ordering, and cursor pagination.
- `src/graphql/resolvers/mutation.ts` handles all create, update, move, and delete operations.
- `src/graphql/pagination.ts` encodes and validates opaque base64url cursors.
- `src/validation/bookmark.ts` validates bookmark titles and URLs.
- `prisma/schema.prisma` defines the database models and relationship.
- `prisma/migrations/` contains the checked-in database migration.
- `tests/unit/` tests resolver behavior with mocked Prisma calls.
- `tests/integeration/` tests persistence against PostgreSQL. The directory name is currently spelled `integeration`.

## Data model

`Folder` contains an auto-generated CUID, a name, a creation timestamp, and many bookmarks.

`Bookmark` contains an auto-generated CUID, title, URL, string-array tags, folder ID, and creation timestamp. Every bookmark must belong to a folder. The foreign-key relationship uses `onDelete: Cascade`, so deleting a folder also deletes its bookmarks.

Folders and bookmarks are returned newest first. Bookmark pagination uses `createdAt DESC` followed by `id DESC` as a stable tie-breaker.

## GraphQL API

### Queries

`folders` returns all folders, newest first. A client can request each folder's bookmarks through the nested `bookmarks` field.

`folder(id)` returns one folder or `null` when the ID does not exist.

`bookmarks(folderId, search, take, cursor)` returns a `BookmarkConnection`:

- `folderId` limits results to one folder.
- `search` performs a case-insensitive search in bookmark titles.
- `take` controls page size and defaults to `10`; it must be greater than zero.
- `cursor` continues from the previous page.
- `items` contains the current page.
- `hasNextPage` indicates whether more records exist.
- `nextCursor` is the cursor for the next request, or `null` at the end.

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
      createdAt
    }
    hasNextPage
    nextCursor
  }
}
```

To fetch the next page, pass the returned `nextCursor` as `cursor`:

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

The resolver fetches one extra record (`take + 1`) to determine `hasNextPage`, then removes that extra record from the response. Cursors contain the last item's creation time and ID and are validated before use.

### Mutations

Create a folder:

```graphql
mutation {
  createFolder(name: "Development") {
    id
    name
    createdAt
  }
}
```

Create a bookmark using the returned folder ID:

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
    tags
    folderId
  }
}
```

The remaining operations are:

- `updateBookmark(id, title, url, tags)` updates any supplied fields.
- `moveBookmark(id, folderId)` moves an existing bookmark to another existing folder.
- `deleteBookmark(id)` deletes a bookmark and returns `true`.

## Validation and errors

- Folder names are trimmed and cannot be empty.
- Bookmark titles are trimmed and cannot be empty.
- Bookmark URLs must be accepted by the standard `URL` parser.
- A bookmark cannot be created or moved into a missing folder.
- Updating, moving, or deleting a missing bookmark returns a `NOT_FOUND` GraphQL error.
- Invalid input, including `take <= 0` and malformed cursors, returns a `BAD_USER_INPUT` GraphQL error.

## Tests

Unit tests mock Prisma and cover folder resolver ordering, folder lookup, nested bookmark lookup, bookmark creation, and invalid bookmark titles.

The integration test connects to PostgreSQL, creates a folder and bookmark, reads the bookmark back, checks its persisted values, and cleans up the records. Start Docker before running it.

Run all tests:

```bash
bunx vitest run
```

Run Vitest in watch mode during development:

```bash
bunx vitest
```

## Database development

After changing `prisma/schema.prisma`, create a named migration during development:

```bash
bunx --bun prisma migrate dev --name describe-your-change
bunx --bun prisma generate
```

The generated Prisma client is written to `src/generated/prisma` and should not be edited manually.

## Stop and future improvements

Stop the local database with:

```bash
docker compose down
```

Possible future improvements include authentication and authorization, folder management mutations, bookmark sorting beyond creation date, stronger tag validation, automated API-level tests, caching, API versioning, and production deployment configuration.
