"use client";

import { useState, useEffect } from 'react';

interface PDFViewerProps {
  fileLocation: string;
}

export default function PDFViewer({ fileLocation }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fileLocation) {
      try {
        setPdfUrl(fileLocation);
      } catch (err) {
        console.error('Error setting PDF URL:', err);
        setError('Failed to process PDF URL');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('No file location provided');
      setIsLoading(false);
    }
  }, [fileLocation]);

  if (isLoading) {
    return (
      <div className="w-full h-full border rounded-lg overflow-hidden flex justify-center items-center">
        <div>Loading PDF...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full border rounded-lg overflow-hidden flex justify-center items-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full border rounded-lg overflow-hidden flex justify-center items-center">
      {pdfUrl ? (
        <iframe 
          src={pdfUrl}
          className="w-[850px] h-[1000px] center"
          onError={() => setError('Failed to load PDF. Please check if the file exists and is accessible.')}
        />
      ) : (
        <div>No PDF URL available</div>
      )}
    </div>
  );
}