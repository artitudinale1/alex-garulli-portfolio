import { auth } from "@/auth";
import { blogGraphqlUrl } from "@/lib/blog/posts";
import {
  editorSecretsConfigured,
  githubIdFromProfile,
  isEditorGithubId,
  signEditorToken,
} from "@/lib/blog/editor-auth";
import { parseEditorPost, parseEditorPosts, toPostInput, type EditorPost, type PostDraft } from "@/lib/blog/editor";

const EDITOR_TIMEOUT_MS = 70_000;

const EDITOR_FIELDS = `
  id
  title
  slug
  excerpt
  contentMarkdown
  category
  tags
  status
  publishedAt
  coverImageUrl
`;

const LIST_QUERY = `
  query EditorPosts {
    editorPosts(limit: 50) { ${EDITOR_FIELDS} }
  }
`;

const POST_QUERY = `
  query EditorPost($id: ID!) {
    editorPost(id: $id) { ${EDITOR_FIELDS} }
  }
`;

const CREATE_MUTATION = `
  mutation CreatePost($input: PostInput!) {
    createPost(input: $input) { ${EDITOR_FIELDS} }
  }
`;

const UPDATE_MUTATION = `
  mutation UpdatePost($id: ID!, $input: PostInput!) {
    updatePost(id: $id, input: $input) { ${EDITOR_FIELDS} }
  }
`;

const PUBLISH_MUTATION = `
  mutation PublishPost($id: ID!) {
    publishPost(id: $id) { ${EDITOR_FIELDS} }
  }
`;

const UNPUBLISH_MUTATION = `
  mutation UnpublishPost($id: ID!) {
    unpublishPost(id: $id) { ${EDITOR_FIELDS} }
  }
`;

export class EditorApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EditorApiError";
  }
}

export type EditorGate = { state: "unconfigured" } | { state: "anonymous" } | { state: "forbidden" } | { state: "editor" };

export async function editorGate(): Promise<EditorGate> {
  if (!editorSecretsConfigured()) return { state: "unconfigured" };
  try {
    const session = await auth();
    const id = githubIdFromProfile(session?.user?.id, undefined);
    if (!id) return { state: "anonymous" };
    if (!isEditorGithubId(id)) return { state: "forbidden" };
    return { state: "editor" };
  } catch {
    return { state: "unconfigured" };
  }
}

type GraphQLErrorBody = { message?: string; extensions?: { code?: string } };
type GraphQLResponse = { data?: Record<string, unknown>; errors?: GraphQLErrorBody[] };

function errorMessage(errors: GraphQLErrorBody[] | undefined): string {
  const error = errors?.[0];
  const code = error?.extensions?.code;
  const message = error?.message ?? "";
  if ((code === "BAD_USER_INPUT" || code === "NOT_FOUND") && message.length > 0 && message.length <= 200) return message;
  if (code === "FORBIDDEN") return "This GitHub account cannot edit the blog.";
  if (code === "UNAUTHENTICATED") return "The editor session was rejected. Sign in again.";
  return "The blog API could not complete that request.";
}

async function editorRequest<T>(query: string, variables: Record<string, unknown>, select: (data: Record<string, unknown>) => unknown): Promise<T> {
  const session = await auth();
  const githubId = githubIdFromProfile(session?.user?.id, undefined);
  if (!githubId || !isEditorGithubId(githubId)) throw new EditorApiError("This GitHub account cannot edit the blog.");
  const secret = process.env.EDITOR_AUTH_SECRET ?? "";
  const token = signEditorToken(secret, githubId);

  let response: Response;
  try {
    response = await fetch(blogGraphqlUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(EDITOR_TIMEOUT_MS),
    });
  } catch {
    throw new EditorApiError("The blog API did not respond. On the free host it can take about a minute to wake. Try again.");
  }

  if (response.status === 502 || response.status === 503) {
    throw new EditorApiError("The blog API is waking up. Wait about a minute and try again.");
  }
  if (!response.ok) throw new EditorApiError("The blog API could not complete that request.");

  const body = (await response.json()) as GraphQLResponse;
  if (body.errors?.length || !body.data) throw new EditorApiError(errorMessage(body.errors));
  return select(body.data) as T;
}

function onePost(data: Record<string, unknown>, field: string): EditorPost {
  const post = parseEditorPost(data[field]);
  if (!post) throw new EditorApiError("The blog API returned an article the editor could not read.");
  return post;
}

export async function listEditorPosts(): Promise<EditorPost[]> {
  try {
    return await editorRequest(LIST_QUERY, {}, (data) => parseEditorPosts(data.editorPosts));
  } catch (error) {
    if (error instanceof EditorApiError) throw error;
    throw new EditorApiError("The blog API returned an article list the editor could not read.");
  }
}

export async function readEditorPost(id: string): Promise<EditorPost | null> {
  return editorRequest(POST_QUERY, { id }, (data) => (data.editorPost == null ? null : onePost(data, "editorPost")));
}

export async function createEditorPost(draft: PostDraft): Promise<EditorPost> {
  return editorRequest(CREATE_MUTATION, { input: toPostInput(draft) }, (data) => onePost(data, "createPost"));
}

export async function updateEditorPost(id: string, draft: PostDraft): Promise<EditorPost> {
  return editorRequest(UPDATE_MUTATION, { id, input: toPostInput(draft) }, (data) => onePost(data, "updatePost"));
}

export async function publishEditorPost(id: string): Promise<EditorPost> {
  return editorRequest(PUBLISH_MUTATION, { id }, (data) => onePost(data, "publishPost"));
}

export async function unpublishEditorPost(id: string): Promise<EditorPost> {
  return editorRequest(UNPUBLISH_MUTATION, { id }, (data) => onePost(data, "unpublishPost"));
}
