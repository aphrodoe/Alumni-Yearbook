"use client";

import PDFViewer from "@/components/PDFViewer";

interface PDFPageProps {
  fileLocation?: string;
}

export default function PDFPage({ fileLocation = "/YEARBOOK_BATCH_2024.pdf" }: PDFPageProps) {
  return (
    <div className="container mx-auto py-10">
      <PDFViewer fileLocation={fileLocation} /> 
    </div>
  );
}
