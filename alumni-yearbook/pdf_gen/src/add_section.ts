import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import fontkit from "@pdf-lib/fontkit";

async function addSectionHeading(inputFile: string, outputFile: string, heading: string) {
    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const page = pdfDoc.getPage(0);
    const { width } = page.getSize();

    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync("..assets/Airstream.ttf");
    const font = await pdfDoc.embedFont(fontBytes);
    let fontSize = 80; 

    const textWidth = font.widthOfTextAtSize(heading, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    const padding = 10;
    const boxWidth = textWidth + padding * 4;
    const boxHeight = textHeight + padding * 2;
    const x = (width - boxWidth) / 2; 
    const y = 750; 

    // Draw rounded rectangle (border)
    page.drawRectangle({
        x,
        y,
        width: boxWidth,
        height: boxHeight,
        borderWidth: 2,
        borderColor: rgb(0, 0, 0), // Black border
        color: rgb(1, 1, 1), // White fill
    });

    // Draw heading text
    page.drawText(heading, {
        x: x + padding * 2, // Center inside the rectangle
        y: y + padding, // Align inside the rectangle
        size: fontSize,
        font,
        color: rgb(0, 0, 0), // Black text
    });

    // Save modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFile, modifiedPdfBytes);

    console.log(`Added section heading "${heading}" with a rounded border on the first page.`);
}

// Example usage
addSectionHeading("existing.pdf", "updated.pdf", "Section 1: Introduction");
