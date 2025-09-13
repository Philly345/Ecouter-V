import { blogPosts } from '../data/blogPosts';

const generateSiteMap = () => {
  const baseUrl = 'https://ecoutertranscribe.tech';
  const currentDate = new Date().toISOString();

  // Static pages
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/upload', priority: '0.9', changefreq: 'weekly' },
    { url: '/features', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' },
    { url: '/transcribe-audio', priority: '0.9', changefreq: 'monthly' },
    { url: '/pricing', priority: '0.7', changefreq: 'monthly' },
    { url: '/help', priority: '0.6', changefreq: 'monthly' },
    { url: '/contact', priority: '0.6', changefreq: 'monthly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
  ];

  // Blog posts
  const blogPages = blogPosts.map(post => ({
    url: `/blog/${post.slug}`,
    priority: post.featured ? '0.8' : '0.7',
    changefreq: 'monthly',
    lastmod: post.date
  }));

  const allPages = [...staticPages, ...blogPages];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
};

export default function Sitemap() {
  // This component is never rendered
  return null;
}

export async function getServerSideProps({ res }) {
  const sitemap = generateSiteMap();

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}