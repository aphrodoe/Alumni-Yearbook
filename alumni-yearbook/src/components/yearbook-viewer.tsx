'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';

interface YearbookData {
  pdfUrl: string;
  hasPersonalizedYearbook: boolean;
  generatedAt?: string;
}

export default function YearbookViewer() {
  const { data: session, status } = useSession();
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [yearbookData, setYearbookData] = useState<YearbookData | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      setError('Please sign in to view your yearbook');
      setLoading(false);
      return;
    }

    if (session?.user?.email) {
      fetchYearbook(session.user.email);
    }
  }, [session, status]);

  async function fetchYearbook(email: string) {
    try {
      const res = await fetch(`/api/yearbook/get?email=${email}`);
      if (!res.ok) throw new Error('Failed to fetch yearbook');
      
      const data: YearbookData = await res.json();
      setYearbookData(data);
      setPdfUrl(data.pdfUrl);
    } catch (err) {
      console.error('Error fetching yearbook:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPdfUrl('/manual-yearbook.pdf');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <div className="ml-4 text-lg">Loading your yearbook...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4 text-lg">Please sign in to view your yearbook</div>
          <button
            onClick={() => signIn('google')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4 text-lg">Error: {error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Your Yearbook</h1>
          <p className="text-gray-600 mb-2">Welcome, {session?.user?.name}!</p>
          
          {yearbookData && (
            <div className="mb-4">
              {yearbookData.hasPersonalizedYearbook ? (
                <p className="text-green-600 font-semibold">
                  ✅ Your personalized yearbook is ready!
                </p>
              ) : (
                <p className="text-orange-600 font-semibold">
                  📖 Viewing the standard yearbook
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            src={pdfUrl}
            width="100%"
            height="800px"
            style={{ border: 'none' }}
            title="Yearbook PDF"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
