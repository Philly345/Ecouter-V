import Head from 'next/head';

export default function SEO({ 
  title = "Ecouter Transcribe - Free AI Audio Transcription & Chat",
  description = "Transform your audio files into accurate transcriptions with AI-powered insights. Free audio transcription service with chat functionality, meeting analysis, and integration capabilities.",
  keywords = "audio transcription, AI transcription, meeting transcription, audio to text, free transcription, voice recognition, speech to text, meeting analysis, audio chat",
  url = "https://ecoutertranscribe.tech",
  image = "https://ecoutertranscribe.tech/og-image.png",
  type = "website"
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Ecouter Transcribe",
    "description": description,
    "url": url,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free AI-powered audio transcription service"
    },
    "featureList": [
      "AI Audio Transcription",
      "Real-time Chat with Audio",
      "Meeting Analysis",
      "Speaker Identification",
      "Export Capabilities",
      "Calendar Integration",
      "Analytics Dashboard"
    ],
    "author": {
      "@type": "Organization",
      "name": "Ecouter Transcribe"
    }
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Ecouter Transcribe" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Ecouter Transcribe" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* Google Search Console Verification - Replace with your actual verification code */}
      <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE_HERE" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="application-name" content="Ecouter Transcribe" />
      <meta name="apple-mobile-web-app-title" content="Ecouter Transcribe" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Head>
  );
}
