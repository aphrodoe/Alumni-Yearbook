//pdf-lib opening pdf, accessing pages, creating pages, editing page order

import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";

async function addPagesToPDF(inputFile: string, outputFile: string, n: number, textLabel: string) {
    // Load existing PDF
    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const lastPage = pdfDoc.getPages().slice(-1)[0]; 
    const { width, height } = lastPage.getSize();

    for (let i = 1; i <= n; i++) {
        const newPage = pdfDoc.addPage([width, height]);
        newPage.drawText(`${textLabel} - Page ${i}`, {
            x: width / 3,
            y: height / 2,
            size: 24,
            color: rgb(0, 0, 0),
        });
    }

    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFile, modifiedPdfBytes);
    console.log(`Added ${n} pages with label '${textLabel}' to ${inputFile}. Saved as ${outputFile}.`);
}

addPagesToPDF("YEARBOOK_BATCH_2024.pdf", "updated.pdf", 3, "New Section");
