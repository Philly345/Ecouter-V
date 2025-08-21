import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical CSS for faster rendering */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body, #__next {
              height: 100%;
              margin: 0;
              padding: 0;
              background-color: #111827;
              color: white;
            }
            * {
              box-sizing: border-box;
            }
            .loading-skeleton {
              background: linear-gradient(90deg, #1f2937 25%, #374151 50%, #1f2937 75%);
              background-size: 200% 100%;
              animation: loading 1.5s infinite;
            }
            @keyframes loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `
        }} />
        
        {/* Preload important assets */}
        <link rel="preload" as="style" href="/_next/static/css/app.css" />
      </Head>
      <body className="bg-gray-900 text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
