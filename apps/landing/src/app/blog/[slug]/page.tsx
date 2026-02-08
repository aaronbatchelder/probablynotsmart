import Link from 'next/link';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import SubscribeGate from '../SubscribeGate';

export const revalidate = 60;

// How many characters to show before the gate (roughly 300 words)
const PREVIEW_CHAR_COUNT = 1500;

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  content_html: string | null;
  published_at: string;
  run_number: number | null;
  post_type: string;
  meta_title: string | null;
  meta_description: string | null;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) {
    return null;
  }

  // Increment view count
  await supabaseAdmin
    .from('blog_posts')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', data.id);

  return data;
}

async function checkAccess(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const { data } = await supabaseAdmin
    .from('signups')
    .select('id')
    .eq('access_token', token)
    .is('unsubscribed_at', null)
    .single();

  return !!data;
}

// Convert markdown to HTML
function renderMarkdown(content: string): string {
  let html = content
    // Headers (must come before other replacements)
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-8 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic (but not inside words)
    .replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-[#1A1A1A] text-[#00ff88] p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-[#F7F5F2] px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-[#FF5C35] pl-4 italic text-[#6B6B6B] my-4">$1</blockquote>')
    // Unordered lists
    .replace(/^[\*\-] (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#FF5C35] hover:underline">$1</a>');

  // Handle paragraphs - split by double newlines
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      p = p.trim();
      if (!p) return '';
      // Don't wrap if it's already a block element
      if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<blockquote') || p.startsWith('<li')) {
        return p;
      }
      // Replace single newlines with <br> within paragraphs
      p = p.replace(/\n/g, '<br>');
      return `<p class="mb-4">${p}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul class="list-disc ml-6 mb-4">$&</ul>');

  return html;
}

// Split content at a natural break point
function splitContentAtBreak(content: string): { preview: string; rest: string; hasMore: boolean } {
  if (content.length <= PREVIEW_CHAR_COUNT) {
    return { preview: content, rest: '', hasMore: false };
  }

  // Look for a good break point within the preview range
  const searchRange = content.slice(0, PREVIEW_CHAR_COUNT + 200);

  // Best: break at a section header (##)
  const headerMatch = searchRange.match(/\n##\s/);
  if (headerMatch && headerMatch.index && headerMatch.index > PREVIEW_CHAR_COUNT * 0.5) {
    return {
      preview: content.slice(0, headerMatch.index),
      rest: content.slice(headerMatch.index),
      hasMore: true,
    };
  }

  // Good: break at double newline (paragraph)
  let lastParagraph = -1;
  let searchPos = 0;
  while (true) {
    const pos = content.indexOf('\n\n', searchPos);
    if (pos === -1 || pos > PREVIEW_CHAR_COUNT) break;
    lastParagraph = pos;
    searchPos = pos + 2;
  }

  if (lastParagraph > PREVIEW_CHAR_COUNT * 0.5) {
    return {
      preview: content.slice(0, lastParagraph),
      rest: content.slice(lastParagraph + 2),
      hasMore: true,
    };
  }

  // OK: break at end of sentence
  const previewChunk = content.slice(0, PREVIEW_CHAR_COUNT);
  const lastSentence = Math.max(
    previewChunk.lastIndexOf('. '),
    previewChunk.lastIndexOf('.\n'),
    previewChunk.lastIndexOf('! '),
    previewChunk.lastIndexOf('!\n'),
    previewChunk.lastIndexOf('? '),
    previewChunk.lastIndexOf('?\n')
  );

  if (lastSentence > PREVIEW_CHAR_COUNT * 0.5) {
    return {
      preview: content.slice(0, lastSentence + 1),
      rest: content.slice(lastSentence + 2),
      hasMore: true,
    };
  }

  // Fallback: break at word boundary near target
  const breakPoint = content.lastIndexOf(' ', PREVIEW_CHAR_COUNT);
  return {
    preview: content.slice(0, breakPoint),
    rest: content.slice(breakPoint + 1),
    hasMore: true,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('pns_access')?.value;
  const hasAccess = await checkAccess(accessToken);

  // Strip the first H1 from content since we display title separately
  const contentWithoutTitle = post.content.replace(/^# .+\n\n?/, '');

  // Split content BEFORE rendering markdown (to preserve structure)
  const { preview, rest, hasMore } = splitContentAtBreak(contentWithoutTitle);

  // Then render each part to HTML
  const previewHtml = renderMarkdown(preview);
  const restHtml = hasMore ? renderMarkdown(rest) : '';

  return (
    <main className="min-h-screen bg-[#FEFDFB]">
      <article className="max-w-3xl mx-auto px-4 py-16">
        <header className="mb-12">
          <Link href="/blog" className="text-[#FF5C35] hover:underline mb-6 inline-block">
            &larr; Back to all posts
          </Link>

          <div className="flex items-center gap-3 mb-4">
            {post.run_number && (
              <span className="text-sm font-mono bg-[#1A1A1A] text-white px-3 py-1 rounded">
                Run #{post.run_number}
              </span>
            )}
            <span className="text-sm text-[#6B6B6B]">
              {new Date(post.published_at).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'America/New_York',
              })}{' '}
              at{' '}
              {new Date(post.published_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/New_York',
              })}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] leading-tight">
            {post.title}
          </h1>
        </header>

        {/* Preview content - always visible (for SEO and teaser) */}
        <div
          className="prose prose-lg max-w-none text-[#1A1A1A] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />

        {/* Gated content */}
        {hasMore && !hasAccess && (
          <SubscribeGate />
        )}

        {/* Full content for subscribers */}
        {hasMore && hasAccess && (
          <div
            className="prose prose-lg max-w-none text-[#1A1A1A] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: restHtml }}
          />
        )}

        <footer className="mt-16 pt-8 border-t border-[#E5E5E5]">
          <div className="bg-[#F7F5F2] rounded-lg p-6">
            <p className="text-[#6B6B6B] text-sm mb-2">
              This post was written by Richard, the AI narrator for probablynotsmart.
            </p>
            <p className="text-[#6B6B6B] text-sm">
              Every decision, every debate, every disaster. All documented by an AI that can&apos;t stop explaining things.
            </p>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <Link href="/blog" className="text-[#FF5C35] hover:underline font-medium">
              &larr; More posts
            </Link>
            <Link href="/" className="text-[#6B6B6B] hover:text-[#1A1A1A]">
              Back to experiment
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: post } = await supabaseAdmin
    .from('blog_posts')
    .select('title, meta_title, meta_description, excerpt')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
  };
}
