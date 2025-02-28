import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";

async function addTextToImage(imagePath: string, outputPath: string, text: string) {

    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    
    ctx.drawImage(image, 0, 0, image.width, image.height);

    
    ctx.font = "bold 60px Arial";
    ctx.fillStyle = "black"; 
    ctx.textAlign = "center";
    ctx.fillText(text, image.width / 2, image.height - 50);

    
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    console.log(`Text added to image. Saved as ${outputPath}`);
}

async function addTextToPDF(inputFile: string,outputFile: string,page_no:number, text: string,x_cord: number,y_cord: number) {
    
    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const page = pdfDoc.getPage(page_no-1);
    const { width, height } = page.getSize();

    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync("assets/Airstream.ttf");
    const font = await pdfDoc.embedFont(fontBytes);

    let fontSize = 80; 

    page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0), // Red text for visibility
    });

    // Save modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFile, modifiedPdfBytes);

    console.log(`Added text "${text}" at (${x}, ${y}) on page ${page_no} ABOVE all pre-existing images.`);
}

   

async function addImageToPage(inputFile: string, outputFile: string, imageFile: string,page_no: number, x_cord: number, y_cord:number, imgWidth: number,imgHeight: number ) {

    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const page = pdfDoc.getPage(page_no-1);
    const { width, height } = page.getSize();

    
    const imageBytes = fs.readFileSync(imageFile);
    const image = imageFile.endsWith(".png") 
        ? await pdfDoc.embedPng(imageBytes) 
        : await pdfDoc.embedJpg(imageBytes);

    const x = x_cord; 
    const y = y_cord; 

    
    page.drawImage(image, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
    });


    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFile, modifiedPdfBytes);

    console.log(`Image added to ${page_no}'th page of ${inputFile}. Saved as ${outputFile}.`);
}
let n=1;
let width=100;
let height=100;
let x=100;
let y=600;


//addImageToPage("YEARBOOK_BATCH_2024.pdf", "updated.pdf", "test.png",n,x,y,width,height);
//addTextToImage("ball.png","out.png","something");

//addTextToPDF("YEARBOOK_BATCH_2024.pdf","updated.pdf",n,"something",x,y);
async function main(){
    for (let i = 0; i < 4; i++) {
        y=600
        await addImageToPage("assets/updated.pdf", "assets/updated.pdf", "assets/ball.png",n,x,y,width,height);
        y-=height;
        await addTextToPDF("assets/updated.pdf","assets/updated.pdf",n,"assets/something",x,y);
        y-=height*2;
        await addImageToPage("assets/updated.pdf", "assets/updated.pdf", "assets/out.png",n,x,y,width,height);
        x+= width*2
    }
}

main()

//addImageToPage("YEARBOOK_BATCH_2024.pdf", "updated.pdf", "ball.png",n,100,600,100,100);
