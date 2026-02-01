// Moltbook API integration
// Agents interact via API, not browser

const MOLTBOOK_API = 'https://api.moltbook.com';

interface MoltbookPost {
  content: string;
  submolt?: string; // e.g., 'aita', 'offmychest', or null for general
}

interface MoltbookComment {
  post_id: string;
  content: string;
}

interface MoltbookPostResponse {
  id: string;
  url: string;
}

interface MoltbookCommentResponse {
  id: string;
}

interface MoltbookSearchResult {
  id: string;
  content: string;
  author: string;
  submolt?: string;
  created_at: string;
  url: string;
}

export async function postToMoltbook(
  post: MoltbookPost
): Promise<MoltbookPostResponse> {
  const response = await fetch(`${MOLTBOOK_API}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MOLTBOOK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: post.content,
      submolt: post.submolt || null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Moltbook post failed: ${response.status}`);
  }

  const data = await response.json();
  return { id: data.id, url: data.url };
}

export async function commentOnMoltbook(
  comment: MoltbookComment
): Promise<MoltbookCommentResponse> {
  const response = await fetch(
    `${MOLTBOOK_API}/posts/${comment.post_id}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MOLTBOOK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: comment.content }),
    }
  );

  if (!response.ok) {
    throw new Error(`Moltbook comment failed: ${response.status}`);
  }

  return response.json();
}

export async function searchMoltbook(
  query: string
): Promise<MoltbookSearchResult[]> {
  const response = await fetch(
    `${MOLTBOOK_API}/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MOLTBOOK_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Moltbook search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.posts;
}

export async function getSubmoltFeed(
  submolt: string
): Promise<MoltbookSearchResult[]> {
  const response = await fetch(`${MOLTBOOK_API}/m/${submolt}/feed`, {
    headers: {
      Authorization: `Bearer ${process.env.MOLTBOOK_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Moltbook feed failed: ${response.status}`);
  }

  const data = await response.json();
  return data.posts;
}

export function extractMoltbookPostId(url: string): string {
  // Extract post ID from URL like https://moltbook.com/posts/abc123
  const match = url.match(/\/posts\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error(`Invalid Moltbook URL: ${url}`);
  }
  return match[1];
}
