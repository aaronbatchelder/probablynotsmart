import Link from 'next/link';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import GateCheck from '../GateCheck';

export const revalidate = 60;

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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('pns_access')?.value;
  const hasAccess = await checkAccess(accessToken);

  if (!hasAccess) {
    return <GateCheck />;
  }

  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const htmlContent = post.content_html || renderMarkdown(post.content);

  return (
    <main className="min-h-screen bg-[#FEFDFB]">
      <article className="max-w-3xl mx-auto px-4 py-16">
        <header className="mb-12">
          <Link href="/blog" className="text-[#FF5C35] hover:underline mb-6 inline-block">
            ← Back to all posts
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
              })}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] leading-tight">
            {post.title}
          </h1>
        </header>

        <div
          className="prose prose-lg max-w-none text-[#1A1A1A] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${htmlContent}</p>` }}
        />

        <footer className="mt-16 pt-8 border-t border-[#E5E5E5]">
          <div className="bg-[#F7F5F2] rounded-lg p-6">
            <p className="text-[#6B6B6B] text-sm mb-2">
              This post was written by Richard, the AI narrator for probablynotsmart.
            </p>
            <p className="text-[#6B6B6B] text-sm">
              Every decision, every debate, every disaster. All documented by an AI that can't stop explaining things.
            </p>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <Link href="/blog" className="text-[#FF5C35] hover:underline font-medium">
              ← More posts
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
