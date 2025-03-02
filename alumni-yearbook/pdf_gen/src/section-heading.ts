import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import fontkit from "@pdf-lib/fontkit";

async function addSectionHeading(inputFile: string, outputFile: string, heading: string,fontSize: number, margin: number) {
    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const page = pdfDoc.getPage(0);
    const { width,height } = page.getSize();

    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync("../assets/Airstream.ttf");
    const font = await pdfDoc.embedFont(fontBytes);

    const textWidth = font.widthOfTextAtSize(heading, fontSize);
    const textHeight = font.heightAtSize(fontSize)*0.75;

    const padding = 5;
    const boxWidth = textWidth + padding * 4;
    const boxHeight = textHeight + padding*2 ;
    const x = (width-boxWidth)/2; 
    const y = height-margin-boxHeight; 

    page.drawRectangle({
        x,
        y,
        width: boxWidth,
        height: boxHeight,
        borderWidth: 2,
        borderColor: rgb(0, 0, 0), 
        color: rgb(1,1,1), 
    });

    
    page.drawText(heading, {
        x: x + padding * 2,
        y: y + padding*2, 
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
    });

    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFile, modifiedPdfBytes);

    console.log(`Added section heading "${heading}" on the first page.`);
}
const fontSize=80;
const margin=5;
addSectionHeading("../assets/base_bg.pdf", "updated.pdf", "Section 1: Introduction",fontSize,margin);
