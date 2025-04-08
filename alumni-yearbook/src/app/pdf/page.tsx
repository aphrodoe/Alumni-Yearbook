"use client";
import { useState, useEffect } from "react";
import PDFViewer from "@/components/PDFViewer";

export default function PDFViewerPage() {
  const [fileLocation, setFileLocation] = useState<string | null>(null);
  
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setFileLocation(query.get("fileLocation"));
  }, []);

  if (fileLocation === null) {
    return <div>Loading...</div>;
  }

  if (!fileLocation) {
    return <div>No PDF file specified.</div>;
  }

  return (
    <div className="h-screen">
      <PDFViewer fileLocation={fileLocation} />
    </div>
  );
}
