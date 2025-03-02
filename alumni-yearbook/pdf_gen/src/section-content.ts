import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";

async function addImage(inputFile: string, outputFile: string, imageFile: string, x_cord: number, y_cord:number, imgWidth: number,imgHeight: number ) {

    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();

    
    const imageBytes = fs.readFileSync(imageFile);
    const image = imageFile.endsWith(".png") ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);

    const x = x_cord; 
    const y = y_cord; 


    //Polaroid effect
    const padding=5;
    const bottom=30;
    const px=x-padding;
    const py= y-padding-bottom;
    page.drawRectangle({
        x:px,
        y:py,
        width: imgWidth+2*padding,
        height: imgHeight+2*padding+bottom,
        borderWidth: 2,
        borderColor: rgb(0, 0, 0), 
        color: rgb(1, 1, 1), 
    });


    
    page.drawImage(image, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
    });
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFile, modifiedPdfBytes);

    console.log(`Image added to ${inputFile}. Saved as ${outputFile}.`);
}

async function addParagraph(inputFile: string,outputFile: string,paragraph: string,x: number,y: number,boxWidth: number,boxHeight: number,fontSize: number) {
    
    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    
    const page = pdfDoc.getPage(0);

    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync("../assets/Airstream.ttf");
    const font = await pdfDoc.embedFont(fontBytes);
    const lineHeight = fontSize * 1.5;
    
    // Split the paragraph into lines that fit inside the box width
    const words = paragraph.split(" ");
    let lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
        let testLine = currentLine.length > 0 ? currentLine + " " + word : word;
        if (font.widthOfTextAtSize(testLine, fontSize) < boxWidth - 20) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    const totalTextHeight = lines.length * lineHeight;
    if (totalTextHeight > boxHeight - 20) {
        console.log("Warning: Text is too large to fit inside the box.");
    }

    // Draw the box around the text
    /*page.drawRectangle({
        x,
        y,
        width: boxWidth,
        height: boxHeight,
        borderWidth: 2,
        borderColor: rgb(0, 0, 0), 
        color: rgb(1, 1, 1), 
    });*/

    //post it effect
    const imageBytes = fs.readFileSync('../assets/post-it.png');
    const image = await pdfDoc.embedPng(imageBytes);

    page.drawImage(image, {
        x,
        y,
        width: boxWidth*1.05,
        height: boxHeight,
    });


    let textY = y + boxHeight - 15; // Start from the top of the box
    for (const line of lines) {
        page.drawText(line, { x: x + 10, y: textY, size: fontSize, font, color: rgb(0, 0, 0) });
        textY -= lineHeight; 
    }

    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFile, modifiedPdfBytes);

    console.log(`Added paragraph inside a box at (${x}, ${y}) on the first page.`);
}

async function main(){
    const para="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse tellus tortor, sodales nec risus at, porta pretium eros. Sed sodales egestas quam. Morbi ultrices quam neque, eu efficitur nisl ullamcorper vitae. Ut ultricies sollicitudin est et mollis. Nullam sit amet feugiat massa. Curabitur euismod lectus et mi dignissim maximus. Ut sed bibendum lectus, et molestie lectus. Proin commodo ullamcorper lectus non porta. Nulla purus est, facilisis eget sollicitudin at, luctus eu massa. Sed mi erat, pellentesque quis molestie quis, congue viverra diam. Mauris et iaculis erat. Pellentesque sit amet blandit mi, ac placerat est. Donec quis lorem auctor, euismod ex."
    await addParagraph("updated.pdf","updated.pdf",para,500,450, 300,300,15);
    await addImage("updated.pdf","updated.pdf","../assets/people.jpg",50,450,400,300);

    await addParagraph("updated.pdf","updated.pdf",para,50,100,300,300,15);
    await addImage("updated.pdf","updated.pdf","../assets/party.jpg",400,100,400,300);
}

main();