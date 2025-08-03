import Head from 'next/head';

export default function SEO({
  title = "Ecouter Transcribe – Smart AI-Powered Transcription",
  description = "Transform audio into intelligent insights. Advanced AI-powered transcription with speaker identification, sentiment analysis, and intelligent summaries.",
  url = "https://ecoutertranscribe.tech",
  image = "https://ecoutertranscribe.tech/og-image.png",
  type = "website"
}) {
  const softwareStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Ecouter Transcribe",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "153"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "url": url,
    "screenshot": image,
    "featureList": [
      "AI Audio Transcription",
      "Speaker Identification",
      "Meeting Analysis",
      "Real-time Chat with Audio",
      "Calendar Integration",
      "Analytics Dashboard"
    ],
    "author": {
      "@type": "Organization",
      "name": "Ecouter Transcribe"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Verified User"
        },
        "reviewBody": "Excellent AI transcription. Fast, accurate, and perfect for meetings."
      }
    ]
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is Ecouter Transcribe really free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Ecouter Transcribe offers a 100% free AI-powered audio-to-text transcription service."
        }
      },
      {
        "@type": "Question",
        "name": "Does it support meetings and speaker separation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, it supports multi-speaker meetings, speaker identification, calendar syncing, and meeting analysis."
        }
      },
      {
        "@type": "Question",
        "name": "Can I export transcripts?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, transcripts can be exported in multiple formats including text, PDF, and Word."
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
      "target": `${url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": url
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Features",
        "item": `${url}/features`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Transcribe",
        "item": `${url}/transcribe`
      }
    ]
  };

  return (
    <Head>
      {/* Basic SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="AI transcription, audio to text, free transcription tool, speaker identification, meeting analysis, Ecouter Transcribe" />
      <meta name="author" content="Ecouter Transcribe" />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Site Verifications */}
      <meta name="google-site-verification" content="arJeK33PX-LVBVLpe0EQsHH32qJSN6yevIsZhzAx1DQ" />
      <meta name="msvalidate.01" content="53E3017973ACFF5BAE8B0B6FF125DFD8" /> {/* Bing Webmaster Tools */}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Ecouter Transcribe" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@ecouterapp" />
      <meta name="twitter:creator" content="@ecouterapp" />

      {/* Canonical */}
      <link rel="canonical" href={url} />

      {/* Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

      {/* PWA */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="application-name" content="Ecouter Transcribe" />
      <meta name="apple-mobile-web-app-title" content="Ecouter Transcribe" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }} />
    </Head>
  );
    }
