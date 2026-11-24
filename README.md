# Alex Portfolio

Minimal Next.js App Router project for a Contentful-backed portfolio. This phase prepares the content model and a migration script. It does not include the site design, and it does not change existing Contentful content unless you explicitly apply the migration later.

## Setup

```bash
npm install
cp .env.example .env
```

Set these variables in `.env`:

- `CONTENTFUL_MANAGEMENT_TOKEN` — Content Management API personal access token
- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ENVIRONMENT` — `master` for the current space

The script reads those three values from `.env`. The management token is server-side only. Do not prefix it with `NEXT_PUBLIC_`.

## Check the migration logic

```bash
npm run check:migration
```

This typechecks the script and runs the local planner tests. It does not call Contentful.

## Dry-run

```bash
npm run migrate:dry-run
```

`npm run migrate` is the same dry-run. The command reads content types and entries, compares them with the proposal below, and prints the actions it would take. It does not create, update, publish, or delete anything.

`npm run profile:dry-run` reports the profile field changes. It keeps the existing entry ID and contact fields. `npm run publish:dry-run` validates the imported experience and project drafts and lists the publication operations. Neither command writes. Profile apply additionally requires `--expect-version` from that dry-run, and it still does not publish the profile.

Run it twice. The two reports should match. In Contentful, the space should look the same afterward.

## Apply

Do not apply until the dry-run has been reviewed.

```bash
npm run migrate -- --apply
```

`--apply` is refused while the plan contains a conflict. A successful apply can:

- create a missing `experience` or `project` content type
- publish that content type when it matches the proposal and has no pending changes
- create missing catalog entries as unpublished drafts

It never updates or deletes an existing content type, and it never updates, publishes, or deletes entries. The `profile` content type and its entries are never written.

## Proposed content model

The published `profile` content type stays as it is.

Dates on an experience are stored as `startDate` and `endDate`. Leave `endDate` empty for a current role. Descriptions are plain text. Technologies are a list of short strings. URLs must start with `https://`.

### Experience (`experience`)

Display field: `company`

| Field | Type | Required |
| --- | --- | --- |
| company | Short text | yes |
| role | Short text | yes |
| startDate | Date | yes |
| endDate | Date | no |
| description | Long text | no |
| technologies | List of short text | no |
| displayOrder | Integer, minimum 0 | yes |

### Project (`project`)

Display field: `title`

| Field | Type | Required |
| --- | --- | --- |
| title | Short text | yes |
| description | Long text | no |
| technologies | List of short text | no |
| repositoryUrl | Short text (`https` URL) | no |
| demoUrl | Short text (`https` URL) | no |
| displayOrder | Integer, minimum 0 | yes |

## Importing entries later

Records live in `contentful/catalog.mts` and are re-exported as `catalog` from `contentful/model.mts`. Experience records are matched by company, role, and start date. Project records are matched by title. The profile proposal in `contentful/profile-proposal.mts` is not imported by the migration script.

Where the CV gives only a month and year, Date fields use the first day of that month (`YYYY-MM-01`). The current role omits `endDate`.

Run the dry-run again before applying.

- A matching entry with the same values is skipped.
- A matching entry with different values is a conflict and is not overwritten.
- A missing entry would be created as a draft and would not be published.
- The existing profile entry is never updated or published by this script.

## Idempotency

- A missing proposed content type is created.
- An existing content type that matches the proposal is left as-is.
- A matching content type that has never been published would be published on apply. Pending edits on an already published type are not published.
- A content type whose fields differ is reported as a conflict and is not modified.
- The same command can be repeated. After a successful apply, the next dry-run should report no further content-type writes.

## Blog editor

The private editor is at `/admin/blog`. It is not linked from the public portfolio. GitHub sign-in uses Auth.js, and only GitHub numeric user `4562699` can open the editor. The server signs a five-minute token for the blog API. The browser never receives `AUTH_SECRET`, `EDITOR_AUTH_SECRET`, or that token.

Generate a session secret and store it as `AUTH_SECRET` in the Vercel project. Do not commit it.

```bash
openssl rand -base64 32
```

The value must be at least 32 characters. `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `EDITOR_AUTH_SECRET` are already server environment variables. `EDITOR_AUTH_SECRET` must be the same value configured on Render, and it must be at least 32 characters. The GitHub OAuth app needs this callback URL:

`https://www.alexgarulli.org.uk/api/auth/callback/github`

For local sign-in, also allow `http://localhost:3000/api/auth/callback/github`. Render must list `4562699` in `ADMIN_GITHUB_IDS`.

Image uploads are available only after that sign-in. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` on the server. They are already configured for Vercel Production. Do not prefix them with `NEXT_PUBLIC_`. Uploaded files are stored in the Cloudinary folder `alex-blog`.

## Latest dry-run

The 6 experience entries, 6 project entries, and the profile entry are published in space `i2d1ui3ps58s`, environment `master`. The Content Delivery API returns all 13 entries.
