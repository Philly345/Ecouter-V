// Dynamic sitemap generation for better SEO with international support
export default function handler(req, res) {
  const baseUrl = 'https://ecoutertranscribe.tech';
  const currentDate = new Date().toISOString();
  
  // Static pages with priority and change frequency (optimized for traffic)
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' }, // Homepage
    { url: '/upload', priority: '0.9', changefreq: 'weekly' }, // Main feature
    { url: '/live-transcription', priority: '0.9', changefreq: 'weekly' }, // Growing feature
    { url: '/video-captions', priority: '0.8', changefreq: 'weekly' }, // Popular feature
    { url: '/features', priority: '0.8', changefreq: 'monthly' }, // Conversion page
    { url: '/pricing', priority: '0.8', changefreq: 'monthly' }, // Business page
    { url: '/audio-chat', priority: '0.7', changefreq: 'weekly' }, // Interactive feature
    { url: '/dashboard', priority: '0.7', changefreq: 'weekly' }, // User area
    { url: '/integrations', priority: '0.6', changefreq: 'monthly' }, // Partnerships
    { url: '/help', priority: '0.6', changefreq: 'monthly' }, // Support
    { url: '/contact', priority: '0.5', changefreq: 'monthly' }, // Contact
    { url: '/ai-settings', priority: '0.5', changefreq: 'monthly' }, // Settings
    { url: '/pdf-dialogue', priority: '0.5', changefreq: 'monthly' }, // PDF feature
    { url: '/profile', priority: '0.4', changefreq: 'monthly' }, // User profile
    { url: '/storage', priority: '0.4', changefreq: 'monthly' }, // Storage
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' }, // Legal
    { url: '/terms', priority: '0.3', changefreq: 'yearly' }, // Legal
    { url: '/cookies', priority: '0.3', changefreq: 'yearly' }, // Legal
    { url: '/login', priority: '0.2', changefreq: 'monthly' }, // Auth
    { url: '/signup', priority: '0.2', changefreq: 'monthly' } // Auth
  ];

  // International pages for different languages
  const languages = ['en', 'es', 'fr', 'de', 'pt', 'ja', 'ko', 'zh', 'zh-tw', 'hi', 'ar'];
  const internationalPages = [];
  
  languages.forEach(lang => {
    if (lang !== 'en') { // English is default
      staticPages.forEach(page => {
        // Skip auth pages for international versions
        if (!page.url.includes('login') && !page.url.includes('signup')) {
          internationalPages.push({
            url: `/${lang}${page.url}`,
            priority: (parseFloat(page.priority) * 0.9).toFixed(1), // Slightly lower priority
            changefreq: page.changefreq
          });
        }
      });
    }
  });

  const allPages = [...staticPages, ...internationalPages];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allPages.map(page => {
    const pageUrl = page.url;
    const isInternational = pageUrl.startsWith('/') && pageUrl.split('/')[1].length <= 5;
    const currentLang = isInternational ? pageUrl.split('/')[1] : 'en';
    const basePath = isInternational ? pageUrl.substring(pageUrl.indexOf('/', 1)) : pageUrl;
    
    return `  <url>
    <loc>${baseUrl}${pageUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${languages.map(lang => {
      const hrefUrl = lang === 'en' 
        ? `${baseUrl}${basePath}`
        : `${baseUrl}/${lang}${basePath}`;
      return `
    <xhtml:link rel="alternate" hreflang="${lang}" href="${hrefUrl}" />`;
    }).join('')}
  </url>`;
  }).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800'); // Cache for 24 hours, stale for 7 days
  res.status(200).send(sitemap);
}