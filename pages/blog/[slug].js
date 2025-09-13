import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';
import FloatingBubbles from '../../components/FloatingBubbles';
import SEO from '../../components/SEO';
import { blogPosts } from '../../data/blogPosts';
import { FiClock, FiUser, FiTag, FiArrowLeft, FiShare2, FiBookmark } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

export default function BlogPost() {
  const router = useRouter();
  const { slug } = router.query;
  const { user, logout } = useAuth();

  // Find the blog post
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <>
        <SEO 
          title="Post Not Found | Ecouter Blog"
          description="The requested blog post could not be found."
        />
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
          <FloatingBubbles />
          <Navbar user={user} onLogout={logout} />
          <div className="pt-32 pb-20 px-6 text-center">
            <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
            <p className="text-gray-400 mb-8">The blog post you're looking for doesn't exist.</p>
            <Link href="/blog" className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              <FiArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const relatedPosts = blogPosts
    .filter(p => p.id !== post.id && (
      p.category === post.category || 
      p.tags.some(tag => post.tags.includes(tag))
    ))
    .slice(0, 3);

  return (
    <>
      <SEO 
        title={post.seo.title}
        description={post.seo.description}
        url={`https://ecoutertranscribe.tech/blog/${post.slug}`}
        breadcrumbs={[
          { position: 1, name: "Home", item: "https://ecoutertranscribe.tech" },
          { position: 2, name: "Blog", item: "https://ecoutertranscribe.tech/blog" },
          { position: 3, name: post.title, item: `https://ecoutertranscribe.tech/blog/${post.slug}` }
        ]}
        lastModified={post.date}
      />

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        <Navbar user={user} onLogout={logout} />

        {/* Blog Post Header */}
        <article className="relative pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Back to Blog */}
            <Link href="/blog" className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8">
              <FiArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </Link>

            {/* Post Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 text-black px-3 py-1 rounded-full text-sm font-semibold">
                {post.category}
              </span>
              {post.featured && (
                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                  FEATURED
                </span>
              )}
            </div>

            {/* Post Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text leading-tight">
              {post.title}
            </h1>

            {/* Post Info */}
            <div className="flex flex-wrap items-center gap-6 mb-8 text-gray-400">
              <div className="flex items-center space-x-2">
                <FiUser className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiClock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
              <span>{new Date(post.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center space-x-1 text-sm bg-gray-800 px-3 py-1 rounded-full text-gray-400"
                >
                  <FiTag className="w-3 h-3" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>

            {/* Social Actions */}
            <div className="flex items-center space-x-4 mb-12 pb-8 border-b border-gray-800">
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <FiShare2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                <FiBookmark className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>

            {/* Post Content */}
            <div className="prose prose-lg prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({children}) => <h1 className="text-3xl font-bold mb-6 gradient-text">{children}</h1>,
                  h2: ({children}) => <h2 className="text-2xl font-bold mb-4 text-white mt-8">{children}</h2>,
                  h3: ({children}) => <h3 className="text-xl font-semibold mb-3 text-white mt-6">{children}</h3>,
                  h4: ({children}) => <h4 className="text-lg font-semibold mb-2 text-white mt-4">{children}</h4>,
                  p: ({children}) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                  ul: ({children}) => <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal pl-6 mb-4 text-gray-300 space-y-2">{children}</ol>,
                  li: ({children}) => <li className="text-gray-300">{children}</li>,
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-400 my-6">
                      {children}
                    </blockquote>
                  ),
                  code: ({children}) => (
                    <code className="bg-gray-800 px-2 py-1 rounded text-sm text-gray-200">
                      {children}
                    </code>
                  ),
                  pre: ({children}) => (
                    <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                  a: ({children, href}) => (
                    <a href={href} className="text-blue-400 hover:text-blue-300 underline">
                      {children}
                    </a>
                  ),
                  table: ({children}) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full border border-gray-700">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({children}) => <thead className="bg-gray-800">{children}</thead>,
                  tbody: ({children}) => <tbody>{children}</tbody>,
                  tr: ({children}) => <tr className="border-b border-gray-700">{children}</tr>,
                  th: ({children}) => (
                    <th className="px-4 py-2 text-left text-white font-semibold">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="px-4 py-2 text-gray-300">
                      {children}
                    </td>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Call to Action */}
            <div className="mt-12 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg text-center">
              <h3 className="text-2xl font-bold mb-3 gradient-text">
                Ready to Try AI Transcription?
              </h3>
              <p className="text-gray-400 mb-6">
                Experience the power of free AI transcription with speaker identification and 120+ language support.
              </p>
              <Link 
                href="/upload"
                className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <span>Start Transcribing</span>
              </Link>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-20 px-6 bg-gray-900/20">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-12 gradient-text text-center">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {relatedPosts.map(relatedPost => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <div className="file-card p-6 h-full hover:scale-105 transition-transform cursor-pointer group">
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-3">
                        <span className="bg-gray-800 px-2 py-1 rounded text-xs">
                          {relatedPost.category}
                        </span>
                        {relatedPost.featured && (
                          <span className="bg-gradient-to-r from-white to-gray-400 text-black px-2 py-1 rounded text-xs font-semibold">
                            FEATURED
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-gray-200">
                        {relatedPost.title}
                      </h3>
                      <p className="text-gray-400 mb-4 line-clamp-3">
                        {relatedPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FiClock className="w-4 h-4" />
                          <span>{relatedPost.readTime}</span>
                        </div>
                        <span>{new Date(relatedPost.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

// This function gets called at build time for static generation
export async function getStaticPaths() {
  const paths = blogPosts.map(post => ({
    params: { slug: post.slug }
  }));

  return {
    paths,
    fallback: false // Show 404 for paths not in this list
  };
}

// This function gets called at build time for each blog post
export async function getStaticProps({ params }) {
  return {
    props: {
      slug: params.slug
    }
  };
}