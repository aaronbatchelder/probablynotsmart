/**
 * Blog Integration
 *
 * Handles publishing blog posts from Richard to Supabase.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not found');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface BlogPost {
  title: string;
  content: string;
  slug: string;
  excerpt?: string;
}

interface PublishOptions {
  runId?: string;
  runNumber?: number;
  postType?: 'run_update' | 'weekly_digest' | 'special' | 'announcement';
}

/**
 * Publish a blog post from Richard
 */
export async function publishBlogPost(
  post: BlogPost,
  options: PublishOptions = {}
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Generate excerpt from content if not provided
    const excerpt = post.excerpt || generateExcerpt(post.content);

    // Ensure unique slug
    const uniqueSlug = await ensureUniqueSlug(post.slug);

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        run_id: options.runId,
        run_number: options.runNumber,
        slug: uniqueSlug,
        title: post.title,
        excerpt,
        content: post.content,
        content_html: null, // Will be rendered on read
        post_type: options.postType || 'run_update',
        status: 'published',
        published_at: new Date().toISOString(),
        meta_title: post.title,
        meta_description: excerpt,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to publish blog post:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Blog publish error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Generate excerpt from markdown content
 */
function generateExcerpt(content: string, maxLength: number = 200): string {
  // Remove markdown formatting
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Truncate at word boundary
  const truncated = plainText.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace) + '...';
}

/**
 * Ensure slug is unique by appending number if needed
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const { data } = await supabase
    .from('blog_posts')
    .select('slug')
    .like('slug', `${baseSlug}%`);

  if (!data || data.length === 0) {
    return baseSlug;
  }

  const existingSlugs = new Set(data.map((d) => d.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  // Find next available number
  let counter = 2;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }

  return `${baseSlug}-${counter}`;
}

/**
 * Get recent blog posts
 */
export async function getRecentPosts(limit: number = 10): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('published_posts')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Store social posts for later publishing
 */
export async function storeSocialPosts(
  runId: string,
  posts: { x: string; linkedin: string; threads: string }
): Promise<void> {
  const socialPosts = [
    { platform: 'x', content: posts.x },
    { platform: 'linkedin', content: posts.linkedin },
    { platform: 'threads', content: posts.threads },
  ];

  for (const post of socialPosts) {
    await supabase.from('social_posts').insert({
      run_id: runId,
      platform: post.platform,
      post_type: 'run_update',
      content: post.content,
      // Will be filled when actually posted
      external_id: null,
      external_url: null,
      posted_at: null,
    });
  }
}
