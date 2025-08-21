import { useEffect } from 'react';
import { useRouter } from 'next/router';

function Error({ statusCode }) {
  const router = useRouter();

  useEffect(() => {
    // If it's a 401 error, redirect to login instead of showing error page
    if (statusCode === 401) {
      router.push('/login');
    }
  }, [statusCode, router]);

  // Don't render anything for 401 errors since we're redirecting
  if (statusCode === 401) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-black mb-4">
          {statusCode
            ? `An error ${statusCode} occurred on server`
            : 'An error occurred on client'}
        </h1>
        <p className="text-gray-600 mb-8">
          {statusCode === 404
            ? 'This page could not be found.'
            : 'Sorry, something went wrong.'}
        </p>
        <a
          href="/"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Go back home
        </a>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error