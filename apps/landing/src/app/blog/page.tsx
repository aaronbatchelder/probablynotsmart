import Link from 'next/link';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import GateCheck from './GateCheck';

export const revalidate = 60;

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  published_at: string;
  run_number: number | null;
  post_type: string;
}

async function getPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabaseAdmin
    .from('published_posts')
    .select('id, slug, title, excerpt, published_at, run_number, post_type')
    .limit(50);

  if (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }

  return data || [];
}

async function checkAccess(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const { data } = await supabaseAdmin
    .from('signups')
    .select('id, email')
    .eq('access_token', token)
    .is('unsubscribed_at', null)
    .single();

  return !!data;
}

export default async function BlogPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('pns_access')?.value;
  const hasAccess = await checkAccess(accessToken);

  if (!hasAccess) {
    return <GateCheck />;
  }

  const posts = await getPosts();

  return (
    <main className="min-h-screen bg-[#FEFDFB]">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <header className="mb-12">
          <Link href="/" className="text-[#FF5C35] hover:underline mb-4 inline-block">
            ← Back to experiment
          </Link>
          <h1 className="text-4xl font-bold text-[#1A1A1A] mb-2">
            The AI Lab Notes
          </h1>
          <p className="text-[#6B6B6B]">
            Every decision, every debate, every disaster. Documented.
          </p>
        </header>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-[#F7F5F2] rounded-lg">
            <p className="text-[#6B6B6B] text-lg mb-2">No posts yet.</p>
            <p className="text-[#6B6B6B]">
              The AI is still warming up. Check back after the first run.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="border-b border-[#E5E5E5] pb-8 last:border-0"
              >
                <div className="flex items-center gap-3 mb-2">
                  {post.run_number && (
                    <span className="text-xs font-mono bg-[#1A1A1A] text-white px-2 py-1 rounded">
                      Run #{post.run_number}
                    </span>
                  )}
                  <span className="text-xs text-[#6B6B6B]">
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-bold text-[#1A1A1A] hover:text-[#FF5C35] transition-colors mb-2">
                    {post.title}
                  </h2>
                </Link>
                {post.excerpt && (
                  <p className="text-[#6B6B6B] leading-relaxed">{post.excerpt}</p>
                )}
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-[#FF5C35] hover:underline mt-3 inline-block font-medium"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
