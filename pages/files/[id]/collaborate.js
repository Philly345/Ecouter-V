import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../components/AuthContext';
import Head from 'next/head';
import { toast } from 'react-toastify';

export default function CollaborationJoin() {
  const router = useRouter();
  const { id, token } = router.query;
  const { user, authChecked } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collaborationInfo, setCollaborationInfo] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (id && token) {
      verifyCollaborationToken();
    }
  }, [id, token]);

  const verifyCollaborationToken = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files/${id}/collaborate/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setCollaborationInfo(data);
      } else {
        setError(data.message || 'Invalid or expired invitation');
      }
    } catch (error) {
      console.error('Error verifying collaboration token:', error);
      setError('Failed to verify invitation');
    } finally {
      setLoading(false);
    }
  };

  const joinCollaboration = async () => {
    try {
      setJoining(true);

      if (!user) {
        // Store the invitation info and redirect to login
        localStorage.setItem('pendingCollaboration', JSON.stringify({
          fileId: id,
          token,
          returnUrl: `/files/${id}/collaborate?token=${token}`
        }));
        
        router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/files/${id}/collaborate?token=${token}`));
        return;
      }

      const authToken = localStorage.getItem('token');
      const response = await fetch(`/api/files/${id}/collaborate/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Successfully joined collaboration!');
        // Redirect to the edit page
        router.push(`/files/edit/${id}`);
      } else {
        // Check if it's an email mismatch error
        if (data.suggestAction === 'signout_and_signin') {
          setError(
            <div>
              <p className="mb-4">{data.message}</p>
              <div className="space-y-2 text-sm">
                <p><strong>Current:</strong> {data.currentEmail}</p>
                <p><strong>Invited:</strong> {data.invitedEmail}</p>
              </div>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/auth/signin';
                }}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Sign out and use correct email
              </button>
            </div>
          );
        } else {
          setError(data.message || 'Failed to join collaboration');
        }
        toast.error(data.message || 'Failed to join collaboration');
      }
    } catch (error) {
      console.error('Error joining collaboration:', error);
      setError('Failed to join collaboration');
      toast.error('Failed to join collaboration');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Head>
          <title>Joining Collaboration - Écouter</title>
        </Head>
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Invitation</h2>
            <p className="text-gray-600">Please wait while we verify your collaboration invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Head>
          <title>Invitation Error - Écouter</title>
        </Head>
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Invalid</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Head>
        <title>Join Collaboration - Écouter</title>
      </Head>
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full mx-4">
        <div className="text-center mb-6">
          <div className="text-blue-600 text-6xl mb-4">🎤</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Collaboration</h1>
          <p className="text-gray-600">You've been invited to collaborate on a transcript</p>
        </div>

        {collaborationInfo && (
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📝 Transcript Details</h3>
              <p className="text-blue-800"><strong>File:</strong> {collaborationInfo.fileName}</p>
              <p className="text-blue-800"><strong>Invited by:</strong> {collaborationInfo.inviterName}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">🔑 Your Permission Level</h3>
              <p className="text-green-800">
                <strong>{collaborationInfo.permission.charAt(0).toUpperCase() + collaborationInfo.permission.slice(1)}</strong>
              </p>
              <p className="text-green-700 text-sm mt-1">
                {collaborationInfo.permission === 'view' && 'You can view the transcript and leave comments'}
                {collaborationInfo.permission === 'comment' && 'You can view the transcript and add comments'}
                {collaborationInfo.permission === 'edit' && 'You can view, comment, and edit the transcript in real-time'}
                {collaborationInfo.permission === 'owner' && 'You have full access including managing collaborators'}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">✨ Collaboration Features</h3>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>📝 Real-time collaborative editing</li>
                <li>💬 Comments and discussions</li>
                <li>👥 See who's editing where</li>
                <li>💾 Version history tracking</li>
                <li>🔄 Live updates and notifications</li>
              </ul>
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={joinCollaboration}
            disabled={joining}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {joining ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining...
              </span>
            ) : (
              '🔗 Join Collaboration'
            )}
          </button>

          <p className="text-gray-500 text-sm mt-4">
            By joining, you agree to collaborate respectfully and follow the project guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}