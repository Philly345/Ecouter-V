import Head from 'next/head';
import { useRouter } from 'next/router';

// A helper function to get a static date (app creation date)
const getStaticDate = () => {
  return "2024-01-15"; // Actual app creation date
};

// A helper function to get the last modified date (when major features were last updated)
const getLastModified = (customDate) => {
  return customDate || "2025-08-21"; // Latest major feature update or custom date
};

export default function SEO({
  title = "Ecouter: Free AI Transcription & Speaker ID",
  description = "Free unlimited AI transcription with speaker identification, sentiment analysis & summaries. 120+ languages, 98% accuracy. Perfect for meetings, interviews & Zoom calls.",
  url,
  image = "https://ecoutertranscribe.tech/og-image.png",
  type = "website",
  locale = "en",
  alternateUrls = {},
  isLocalizedPage = false, // New prop to handle localized pages
  socialDescription, // Optional shorter description for social media
  breadcrumbs, // Dynamic breadcrumbs - pass null for auto-generation
  lastModified, // Dynamic last modified date for content pages
  faqData, // Array of FAQ objects: [{ question: "...", answer: "..." }]
}) {

  const router = useRouter();
  const baseUrl = "https://ecoutertranscribe.tech";
  const currentUrl = url || `${baseUrl}${router.asPath}`;
  
  // International targeting - Major markets for transcription services (must be defined early)
  const supportedLocales = {
    'en': { name: 'English', region: 'US', placename: 'United States' },
    'es': { name: 'Español', region: 'ES', placename: 'España' },
    'fr': { name: 'Français', region: 'FR', placename: 'France' },
    'de': { name: 'Deutsch', region: 'DE', placename: 'Deutschland' },
    'pt': { name: 'Português', region: 'BR', placename: 'Brasil' },
    'ja': { name: '日本語', region: 'JP', placename: '日本' },
    'ko': { name: '한국어', region: 'KR', placename: '대한민국' },
    'zh': { name: '中文', region: 'CN', placename: '中国' },
    'zh-tw': { name: '繁體中文', region: 'TW', placename: '台灣' },
    'hi': { name: 'हिन्दी', region: 'IN', placename: 'भारत' },
    'ar': { name: 'العربية', region: 'SA', placename: 'السعودية' }
  };
  
  // Canonical URL logic: localized pages should canonical to themselves
  const canonicalUrl = isLocalizedPage && locale !== 'en' 
    ? `${baseUrl}/${locale}${router.asPath.replace(`/${locale}`, '')}`
    : currentUrl;

  // Social media description (shorter, punchier for better CTR - optimized for Twitter/LinkedIn)
  const socialDesc = socialDescription || (description.length > 100 
    ? description.substring(0, 97) + "..." 
    : description);

  // Normalize router path for hreflang (remove existing language prefix) - more robust regex
  const normalizedPath = router.asPath.replace(/^\/(en|es|fr|de|pt|ja|ko|zh|zh-tw|hi|ar)(?=\/|$)/, '') || '/';

  // Normalize locale for Open Graph (zh-tw → zh_TW, avoid zh_TW_TW)
  const normalizedLocale = locale === 'zh-tw' ? 'zh_TW' : locale;
  
  // Ensure en always uses en_US for Facebook canonical default, handle zh-tw special case
  const ogLocale = locale === 'zh-tw' ? 'zh_TW' : 
    `${normalizedLocale}_${supportedLocales[locale]?.region || 'US'}`;

  // Auto-generate breadcrumbs if not provided
  const generateBreadcrumbs = () => {
    if (breadcrumbs) return breadcrumbs; // Use provided breadcrumbs
    
    const pathSegments = normalizedPath.split('/').filter(segment => segment);
    const homeUrl = isLocalizedPage && locale !== 'en' 
      ? `${baseUrl}/${locale}` 
      : baseUrl;
    const crumbs = [{ position: 1, name: "Home", item: homeUrl }];
    
    let currentPath = isLocalizedPage && locale !== 'en' ? `/${locale}` : '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      // Better capitalization for multi-word slugs
      const name = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      crumbs.push({
        position: index + 2,
        name: name,
        item: `${baseUrl}${currentPath}`
      });
    });
    
    return crumbs;
  };

  const finalBreadcrumbs = generateBreadcrumbs();
  const finalLastModified = getLastModified(lastModified);
  const hasFaqs = faqData && faqData.length > 0;

  // --- Enhanced Structured Data (Schema.org) with International Support ---
  
  const softwareStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Ecouter Transcribe",
    "operatingSystem": "Web Browser, Android, iOS",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "Transcription Software",
    "datePublished": getStaticDate(),
    "dateModified": finalLastModified,
    // Removed aggregateRating - only include if you have real user reviews
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": `${new Date().getFullYear() + 1}-12-31`
    },
    "url": currentUrl,
    "screenshot": image,
    "downloadUrl": currentUrl,
    "installUrl": currentUrl,
    "featureList": [
      "Free AI Audio Transcription",
      "Unlimited Meeting Transcription",
      "98% Accuracy Rate",
      "120+ Languages Supported",
      "Speaker Identification (Diarization)",
      "Real-time Live Transcription", 
      "Zoom Transcription Integration",
      "Multilingual Transcription",
      "Meeting Transcription Software",
      "Sentiment Analysis",
      "AI-Powered Meeting Summaries",
      "Multi-format Export (PDF, DOCX, TXT, SRT)",
      "Timestamp Generation",
      "Audio/Video File Support",
      "Cloud Storage Integration",
      "Team Collaboration Tools",
      "API Access",
      "Mobile App Support"
    ],
    "inLanguage": locale,
    "availableLanguage": Object.keys(supportedLocales).map(lang => ({
      "@type": "Language", 
      "name": supportedLocales[lang].name,
      "alternateName": lang
    })),
    "publisher": {
      "@type": "Organization",
      "name": "Ecouter Transcribe",
      "url": baseUrl
    }
  };

  // Separate Organization Schema for better SEO
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Ecouter Transcribe",
    "alternateName": ["Ecouter", "EcouterTranscribe"],
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo-new.png`,
      "width": 200,
      "height": 200
    },
    "description": "Leading global provider of free AI-powered transcription services with support for 120+ languages",
    "foundingDate": "2024",
    "areaServed": [
      { "@type": "Country", "name": "United States" },
      { "@type": "Country", "name": "España" },
      { "@type": "Country", "name": "France" },
      { "@type": "Country", "name": "Deutschland" },
      { "@type": "Country", "name": "Brasil" },
      { "@type": "Country", "name": "日本" },
      { "@type": "Country", "name": "대한민국" },
      { "@type": "Country", "name": "中国" },
      { "@type": "Country", "name": "台灣" },
      { "@type": "Country", "name": "भारत" },
      { "@type": "Country", "name": "السعودية" }
    ],
    "sameAs": [
      "https://twitter.com/ecouterapp",
      "https://linkedin.com/company/ecouter-transcribe",
      "https://github.com/ecouter-transcribe"
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": Object.keys(supportedLocales),
        "hoursAvailable": "Mo-Su 00:00-24:00",
        "url": `${baseUrl}/contact`
      },
      {
        "@type": "ContactPoint", 
        "contactType": "technical support",
        "availableLanguage": ["en", "es", "fr", "de"],
        "hoursAvailable": "Mo-Fr 09:00-18:00"
      }
    ],
    "knowsAbout": [
      "AI Transcription",
      "Speech Recognition", 
      "Audio Processing",
      "Natural Language Processing",
      "Speaker Identification",
      "Machine Learning"
    ]
  };

  // Dynamic FAQ Schema - only if FAQ data is provided
  const faqStructuredData = hasFaqs ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  // Default FAQs for homepage if no custom FAQs provided
  const defaultFaqData = [
    {
      question: "Is Ecouter Transcribe available worldwide?",
      answer: "Yes, Ecouter works worldwide and supports 120+ languages including multilingual transcription for global meetings."
    },
    {
      question: "What languages does Ecouter support for transcription?",
      answer: "Our AI supports 120+ languages including English, Spanish, French, German, Chinese, Japanese, and all major world languages for multilingual transcription."
    },
    {
      question: "Is Ecouter Transcribe completely free?",
      answer: "Yes, Ecouter is 100% free with unlimited meeting transcription forever. Perfect for Zoom calls, interviews, and business meetings."
    },
    {
      question: "What are the main features of Ecouter meeting transcription software?",
      answer: "AI transcription, speaker identification, sentiment analysis, meeting summaries, and Zoom transcription integration."
    },
    {
      question: "What file formats can I export my transcripts to?",
      answer: "Export meeting transcriptions in TXT, PDF, Word, and SRT subtitle formats for easy sharing and collaboration."
    }
  ];

  const finalFaqData = hasFaqs ? faqStructuredData : {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": defaultFaqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": baseUrl,
    "name": "Ecouter Transcribe",
    "alternateName": "EcouterTranscribe",
    "datePublished": getStaticDate(),
    "dateModified": finalLastModified,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": finalBreadcrumbs.map((crumb) => ({
      "@type": "ListItem",
      "position": crumb.position,
      "name": crumb.name,
      "item": crumb.item
    }))
  };

  // Consolidated Structured Data using @graph for better SEO
  const consolidatedStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      organizationData,
      softwareStructuredData,
      websiteStructuredData,
      breadcrumbStructuredData,
      finalFaqData
    ].filter(Boolean) // Remove null values
  };

  return (
    <Head>
      {/* --- Enhanced Basic & International SEO Meta Tags --- */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* Note: keywords meta tag is legacy - focus on natural keyword usage in content */}
      <meta name="author" content="Ecouter Transcribe" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Language and International Targeting */}
      <meta name="language" content={supportedLocales[locale]?.name || 'English'} />
      
      {/* Hreflang for International SEO - Using proper URL structure */}
      {Object.keys(supportedLocales).map(lang => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={alternateUrls[lang] 
            ? `${baseUrl}${alternateUrls[lang].startsWith('/') ? alternateUrls[lang] : `/${alternateUrls[lang]}`}` 
            : `${baseUrl}${lang === 'en' ? '' : `/${lang}`}${normalizedPath}`}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={currentUrl} />
      
      {/* --- Site Verifications --- */}
      <meta name="google-site-verification" content="arJeK33PX-LVBVLpe0EQsHH32qJSN6yevIsZhzAx1DQ" />
      <meta name="msvalidate.01" content="53E3017973ACFF5BAE8B0B6FF125DFD8" />

      {/* --- Enhanced Open Graph (for Facebook, LinkedIn, etc.) --- */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={socialDesc} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Screenshot of Ecouter AI transcription interface showing speaker identification and meeting summaries" />
      <meta property="og:site_name" content="Ecouter Transcribe" />
      <meta property="og:locale" content={ogLocale} />
      
      {/* Preload OG image for faster social sharing */}
      <link rel="preload" as="image" href={image} />
      
      {/* Additional Open Graph locales for international reach - All supported languages */}
      {Object.keys(supportedLocales)
        .filter(lang => lang !== locale)
        .map(lang => {
          // Handle special cases for clean locale formatting
          let ogLocaleAlternate;
          if (lang === 'zh-tw') {
            ogLocaleAlternate = 'zh_TW';
          } else if (lang === 'zh') {
            ogLocaleAlternate = 'zh_CN';
          } else {
            ogLocaleAlternate = `${lang}_${supportedLocales[lang].region}`;
          }
          
          return (
            <meta 
              key={lang}
              property="og:locale:alternate" 
              content={ogLocaleAlternate} 
            />
          );
        })}

      {/* --- Enhanced Twitter Card --- */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={socialDesc} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content="Screenshot of Ecouter AI transcription interface showing speaker identification and meeting summaries" />
      <meta name="twitter:site" content="@ecouterapp" />
      <meta name="twitter:creator" content="@ecouterapp" />

      {/* --- Canonical & Links --- */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      <link rel="manifest" href="/manifest.json" />

      {/* --- Icons (Cleaned Up) --- */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      
      {/* --- PWA Theme --- */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="application-name" content="Ecouter Transcribe" />
      <meta name="apple-mobile-web-app-title" content="Ecouter Transcribe" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://ecoutertranscribe.tech" />
      
      {/* Performance hints */}
      <meta httpEquiv="x-dns-prefetch-control" content="on" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* --- Consolidated JSON-LD Structured Data (Modern @graph approach) --- */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(consolidatedStructuredData) }} />
      
      {/* --- Analytics --- */}
      <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q0FM9G43P3"></script>
      <script dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Q0FM9G43P3');
        `,
      }} />
    </Head>
  );
}