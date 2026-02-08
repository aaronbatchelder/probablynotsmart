import Link from 'next/link';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import SubscribeGate from '../SubscribeGate';

export const revalidate = 60;

// How many words to show before the gate
const PREVIEW_WORD_COUNT = 300;

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

// Simple markdown to HTML (basic support)
function renderMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-8 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-[#1A1A1A] text-[#00ff88] p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm"><code>$2</code></pre>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="bg-[#F7F5F2] px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')
    // Blockquotes
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-[#FF5C35] pl-4 italic text-[#6B6B6B] my-4">$1</blockquote>')
    // Unordered lists
    .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#FF5C35] hover:underline">$1</a>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mb-4">')
    // Line breaks
    .replace(/\n/g, '<br>');
}

// Split content into preview and gated portions
function splitContent(content: string): { preview: string; rest: string; hasMore: boolean } {
  const words = content.split(/\s+/);

  if (words.length <= PREVIEW_WORD_COUNT) {
    return { preview: content, rest: '', hasMore: false };
  }

  // Find a good break point (end of sentence or paragraph)
  let breakIndex = PREVIEW_WORD_COUNT;
  const previewWords = words.slice(0, PREVIEW_WORD_COUNT);
  const previewText = previewWords.join(' ');

  // Try to break at end of paragraph
  const lastParagraphBreak = previewText.lastIndexOf('\n\n');
  if (lastParagraphBreak > previewText.length * 0.5) {
    const preview = previewText.slice(0, lastParagraphBreak);
    const rest = content.slice(lastParagraphBreak);
    return { preview, rest, hasMore: true };
  }

  // Otherwise break at end of sentence
  const lastSentenceEnd = Math.max(
    previewText.lastIndexOf('. '),
    previewText.lastIndexOf('! '),
    previewText.lastIndexOf('? ')
  );

  if (lastSentenceEnd > previewText.length * 0.5) {
    const preview = previewText.slice(0, lastSentenceEnd + 1);
    const rest = content.slice(lastSentenceEnd + 1);
    return { preview, rest, hasMore: true };
  }

  // Fallback: just split at word count
  const preview = previewWords.join(' ');
  const rest = words.slice(PREVIEW_WORD_COUNT).join(' ');
  return { preview, rest, hasMore: true };
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

  // Split content for partial gating
  const { preview, rest, hasMore } = splitContent(contentWithoutTitle);
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
              })}{' '}
              at{' '}
              {new Date(post.published_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
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
          dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${previewHtml}</p>` }}
        />

        {/* Gated content */}
        {hasMore && !hasAccess && (
          <SubscribeGate />
        )}

        {/* Full content for subscribers */}
        {hasMore && hasAccess && (
          <div
            className="prose prose-lg max-w-none text-[#1A1A1A] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${restHtml}</p>` }}
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
