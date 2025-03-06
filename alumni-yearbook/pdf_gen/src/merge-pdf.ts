import { PDFDocument } from "pdf-lib";
import fs from "fs";

async function mergePDFs(pdfFile1: string, pdfFile2: string) {
    const pdf1Bytes = fs.readFileSync(pdfFile1);
    const pdf2Bytes = fs.readFileSync(pdfFile2);

    const pdf1 = await PDFDocument.load(pdf1Bytes);
    const pdf2 = await PDFDocument.load(pdf2Bytes);

    // Copy pages from pdf2 into pdf1
    const copiedPages = await pdf1.copyPages(pdf2, pdf2.getPageIndices());
    copiedPages.forEach((page) => pdf1.addPage(page));

    // Save the merged PDF (overwrites pdfFile1)
    const mergedPdfBytes = await pdf1.save();
    fs.writeFileSync(pdfFile1, mergedPdfBytes);

    console.log(`Merged "${pdfFile2}" into "${pdfFile1}" successfully.`);
}


mergePDFs("../assets/YEARBOOK_BATCH_2024.pdf", "result.pdf");