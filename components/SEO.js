import Head from 'next/head';

// A helper function to get the current date in YYYY-MM-DD format
const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Returns "2025-08-04"
};

export default function SEO({
  title = "Ecouter: Free AI Transcription with Speaker ID & Summaries",
  description = "Get free, unlimited AI transcription with Ecouter. Our advanced software provides speaker identification, sentiment analysis, and intelligent summaries from any audio or video file. Start transcribing in minutes!",
  url = "https://ecoutertranscribe.tech",
  image = "https://ecoutertranscribe.tech/og-image.png",
  type = "website",
  breadcrumbs = [ // Default breadcrumbs for the homepage
    { position: 1, name: "Home", item: "https://ecoutertranscribe.tech" }
  ]
}) {

  // --- Consolidated & Enhanced Structured Data (Schema.org) ---
  
  const softwareStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Ecouter Transcribe",
    "operatingSystem": "Web-based, All", // More specific
    "applicationCategory": "BusinessApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "153" // This should ideally be updated dynamically
    },
    "offers": {
      "@type": "Offer",
      "price": "0", // Correctly indicates the service is free
      "priceCurrency": "USD"
    },
    "url": url,
    "screenshot": image,
    "featureList": [
      "Free AI Audio Transcription",
      "Unlimited Transcripts",
      "Speaker Identification (Diarization)",
      "Sentiment Analysis",
      "Intelligent Meeting Summaries",
      "Real-time Chat with Audio",
      "Calendar Integration",
      "Export to TXT, PDF, Word"
    ],
    "publisher": { // Merged Organization schema here
      "@type": "Organization",
      "name": "Ecouter Transcribe",
      "url": url,
      "logo": `${url}/logo-new.png`
    },
    "review": [ // It's best to populate this from real, recent user reviews if possible
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Verified User"
        },
        "datePublished": "2025-07-20", // Added date for freshness
        "reviewBody": "Excellent and completely free AI transcription. Fast, accurate, and the speaker identification is perfect for my meetings."
      }
    ]
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is Ecouter Transcribe completely free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Ecouter Transcribe is a 100% free AI-powered audio-to-text transcription service with no hidden costs or limits on transcription length."
        }
      },
      {
        "@type": "Question",
        "name": "What are the main features of Ecouter Transcribe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our key features include highly accurate AI transcription, automatic speaker identification (separation), sentiment analysis, and intelligent summaries of your audio content."
        }
      },
      {
        "@type": "Question",
        "name": "What file formats can I export my transcripts to?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can export your completed transcripts in multiple formats, including plain text (.txt), PDF, and Microsoft Word (.docx)."
        }
      }
    ]
  };

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": url,
    "name": "Ecouter Transcribe",
    "alternateName": "EcouterTranscribe",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${url}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    // IMPORTANT: This should be dynamic. Pass a `breadcrumbs` array as a prop 
    // to this component from each page to reflect its actual path.
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.item
    }))
  };

  return (
    <Head>
      {/* --- Basic & Optimized SEO Meta Tags --- */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="author" content="Ecouter Transcribe" />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="language" content="English" />
      {/* REMOVED: <meta name="keywords" ... /> - Obsolete */}
      {/* REMOVED: <meta name="revisit-after" ... /> - Obsolete */}
      
      {/* --- Site Verifications --- */}
      <meta name="google-site-verification" content="arJeK33PX-LVBVLpe0EQsHH32qJSN6yevIsZhzAx1DQ" />
      <meta name="msvalidate.01" content="53E3017973ACFF5BAE8B0B6FF125DFD8" />

      {/* --- Open Graph (for Facebook, LinkedIn, etc.) --- */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Ecouter Transcribe" />
      <meta property="og:locale" content="en_US" />

      {/* --- Twitter Card --- */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@ecouterapp" />
      <meta name="twitter:creator" content="@ecouterapp" />

      {/* --- Canonical & Links --- */}
      <link rel="canonical" href={url} />
      <link rel="manifest" href="/manifest.json" /> {/* ADDED for PWA */}

      {/* --- Icons (Cleaned Up) --- */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      {/* REMOVED redundant favicon links */}
      
      {/* --- PWA Theme --- */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="application-name" content="Ecouter Transcribe" />
      <meta name="apple-mobile-web-app-title" content="Ecouter Transcribe" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* --- JSON-LD Structured Data Scripts --- */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }} />
      {/* REMOVED separate Organization script, it's now merged above */}

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
