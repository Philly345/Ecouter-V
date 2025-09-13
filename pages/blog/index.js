import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import Navbar from '../../components/Navbar';
import FloatingBubbles from '../../components/FloatingBubbles';
import SEO from '../../components/SEO';
import { blogPosts } from '../../data/blogPosts.js';
import { FiClock, FiUser, FiTag, FiSearch, FiBookOpen } from 'react-icons/fi';

export default function Blog() {
  const { user, logout } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique categories
  const categories = ['All', ...new Set(blogPosts.map(post => post.category))];

  // Filter posts based on category and search
  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  return (
    <>
      <SEO 
        title="Transcription Blog: AI Tips, Guides & Best Practices | Ecouter"
        description="Learn about AI transcription, speech-to-text technology, and best practices. Get tips for better accuracy, software comparisons, and transcription guides."
        url="https://ecoutertranscribe.tech/blog"
        breadcrumbs={[
          { position: 1, name: "Home", item: "https://ecoutertranscribe.tech" },
          { position: 2, name: "Blog", item: "https://ecoutertranscribe.tech/blog" }
        ]}
      />

      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <FloatingBubbles />
        <Navbar user={user} onLogout={logout} />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-text">
              Transcription Blog
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
              Learn about AI transcription technology, get tips for better accuracy, 
              and discover best practices for speech-to-text conversion.
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-white text-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && selectedCategory === 'All' && !searchTerm && (
          <section className="py-12 px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 gradient-text text-center">
                Featured Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredPosts.slice(0, 2).map(post => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <div className="file-card p-6 h-full hover:scale-105 transition-transform cursor-pointer">
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-3">
                        <span className="bg-gradient-to-r from-white to-gray-400 text-black px-2 py-1 rounded text-xs font-semibold">
                          FEATURED
                        </span>
                        <span>{post.category}</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-gray-200">
                        {post.title}
                      </h3>
                      <p className="text-gray-400 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <FiUser className="w-4 h-4" />
                            <span>{post.author}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FiClock className="w-4 h-4" />
                            <span>{post.readTime}</span>
                          </div>
                        </div>
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20">
                <FiBookOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-2xl font-bold mb-2 text-gray-400">No articles found</h3>
                <p className="text-gray-500">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-8 gradient-text text-center">
                  {selectedCategory === 'All' ? 'All Articles' : `${selectedCategory} Articles`}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPosts.map(post => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <div className="file-card p-6 h-full hover:scale-105 transition-transform cursor-pointer group">
                        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-3">
                          <span className="bg-gray-800 px-2 py-1 rounded text-xs">
                            {post.category}
                          </span>
                          {post.featured && (
                            <span className="bg-gradient-to-r from-white to-gray-400 text-black px-2 py-1 rounded text-xs font-semibold">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white group-hover:text-gray-200">
                          {post.title}
                        </h3>
                        <p className="text-gray-400 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="flex items-center space-x-1 text-xs bg-gray-800 px-2 py-1 rounded text-gray-400"
                            >
                              <FiTag className="w-3 h-3" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <FiUser className="w-4 h-4" />
                              <span>{post.author}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FiClock className="w-4 h-4" />
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-20 px-6 bg-gray-900/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 gradient-text">
              Stay Updated with AI Transcription Tips
            </h2>
            <p className="text-gray-400 mb-8">
              Get the latest guides, tips, and updates about AI transcription technology delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-white text-white"
              />
              <button className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}