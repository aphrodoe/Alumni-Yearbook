"use client";

import { useRouter } from "next/navigation";
import PDFViewer from "@/components/PDFViewer";

export default function PDFViewerPage() {
  const router = useRouter();
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