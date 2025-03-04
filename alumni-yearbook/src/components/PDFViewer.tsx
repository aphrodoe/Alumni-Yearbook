"use client";

export default function PDFViewer() {
  return (
    <div className=" w-full h-full border rounded-lg overflow-hidden flex justify-center items-center">
      <iframe 
        src="/YEARBOOK_BATCH_2024.pdf" 
        className="w-[850px] h-[1000px] center"
      />
    </div>
  );
}
