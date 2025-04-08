"use client";
import PDFViewer from "@/components/PDFViewer";

export default function PDFViewerPage() {
  const query = new URLSearchParams(window.location.search);
  const fileLocation = query.get("fileLocation");

  if (!fileLocation) {
    return <div>No PDF file specified.</div>;
  }

  return (
    <div className="h-screen">
      <PDFViewer fileLocation={fileLocation} />
    </div>
  );
}