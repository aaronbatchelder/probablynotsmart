// Moltbook API integration
// Agents interact via API, not browser

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';

interface MoltbookPost {
  title: string;
  content: string;
  submolt?: string; // e.g., 'ai', 'general', 'superbowl'
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

/**
 * Solve Moltbook math verification challenge
 * Challenges look like: "lobster claw exerts twenty three Newtons + seven meters per second"
 */
function solveMoltbookChallenge(challenge: string): string {
  // Extract numbers from the weird formatting
  const numberWords: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
    thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
    hundred: 100, thousand: 1000
  };

  // Clean up the challenge text
  const cleaned = challenge.toLowerCase()
    .replace(/[^a-z0-9\s+\-*/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Find all number words and convert
  const numbers: number[] = [];
  let currentNum = 0;

  const words = cleaned.split(' ');
  for (const word of words) {
    if (numberWords[word] !== undefined) {
      const val = numberWords[word];
      if (val === 100) {
        currentNum = currentNum === 0 ? 100 : currentNum * 100;
      } else if (val === 1000) {
        currentNum = currentNum === 0 ? 1000 : currentNum * 1000;
      } else if (val >= 20 && val <= 90) {
        currentNum += val;
      } else {
        currentNum += val;
      }
    } else if (word === '+' || word === 'plus') {
      if (currentNum > 0) {
        numbers.push(currentNum);
        currentNum = 0;
      }
    }
  }
  if (currentNum > 0) {
    numbers.push(currentNum);
  }

  // Sum all numbers found
  const result = numbers.reduce((a, b) => a + b, 0);
  return result.toFixed(2);
}

export async function postToMoltbook(
  post: MoltbookPost
): Promise<MoltbookPostResponse> {
  const apiKey = process.env.MOLTBOOK_API_KEY;
  if (!apiKey) {
    throw new Error('MOLTBOOK_API_KEY not configured');
  }

  // Create the post
  const response = await fetch(`${MOLTBOOK_API}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: post.title,
      content: post.content,
      submolt: post.submolt || 'general',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Moltbook post failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Handle verification if required
  if (data.verification_required && data.verification) {
    const answer = solveMoltbookChallenge(data.verification.challenge);

    const verifyResponse = await fetch(`${MOLTBOOK_API}/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verification_code: data.verification.code,
        answer: answer,
      }),
    });

    if (!verifyResponse.ok) {
      console.warn('[Moltbook] Verification failed, post may be pending');
    }
  }

  return {
    id: data.post.id,
    url: `https://moltbook.com${data.post.url}`
  };
}

export async function commentOnMoltbook(
  comment: MoltbookComment
): Promise<MoltbookCommentResponse> {
  const apiKey = process.env.MOLTBOOK_API_KEY;
  if (!apiKey) {
    throw new Error('MOLTBOOK_API_KEY not configured');
  }

  const response = await fetch(
    `${MOLTBOOK_API}/posts/${comment.post_id}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: comment.content }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Moltbook comment failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Handle verification if required
  if (data.verification_required && data.verification) {
    const answer = solveMoltbookChallenge(data.verification.challenge);

    await fetch(`${MOLTBOOK_API}/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verification_code: data.verification.code,
        answer: answer,
      }),
    });
  }

  return { id: data.comment?.id || data.id };
}

export async function searchMoltbook(
  query: string
): Promise<MoltbookSearchResult[]> {
  const apiKey = process.env.MOLTBOOK_API_KEY;
  if (!apiKey) {
    throw new Error('MOLTBOOK_API_KEY not configured');
  }

  const response = await fetch(
    `${MOLTBOOK_API}/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Moltbook search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.posts || [];
}

export async function getSubmoltFeed(
  submolt: string
): Promise<MoltbookSearchResult[]> {
  const apiKey = process.env.MOLTBOOK_API_KEY;
  if (!apiKey) {
    throw new Error('MOLTBOOK_API_KEY not configured');
  }

  const response = await fetch(`${MOLTBOOK_API}/m/${submolt}/feed`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Moltbook feed failed: ${response.status}`);
  }

  const data = await response.json();
  return data.posts || [];
}

export function extractMoltbookPostId(url: string): string {
  // Extract post ID from URL like https://moltbook.com/post/abc123
  const match = url.match(/\/post\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error(`Invalid Moltbook URL: ${url}`);
  }
  return match[1];
}
