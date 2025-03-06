import { degrees, PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { createCanvas, loadImage } from "canvas";
import fs from "fs";
import { randomInt } from "crypto";
import { off } from "process";

export async function createDoc(templateFile: string, outputFile: string, pages: number) {
    const templatePdfBytes = fs.readFileSync(templateFile);
    const templatePdf = await PDFDocument.load(templatePdfBytes);

    const newPdf = await PDFDocument.create();

    for (let i = 0; i < pages; i++) {
        const [copiedPage] = await newPdf.copyPages(templatePdf, [0]); 
        newPdf.addPage(copiedPage);
    }

    const newPdfBytes = await newPdf.save();
    fs.writeFileSync(outputFile, newPdfBytes);

    console.log(`created a new PDF with ${pages} repeated pages.`);
}

export async function addImage(inputFile: string, outputFile: string, imageFile: string, x_cord: number, y_cord:number, secWidth:number, secHeight:number, imgWidth: number,imgHeight: number ,pageNo: number) {

    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const page = pdfDoc.getPage(pageNo-1);
    const { width, height } = page.getSize();

    
    const imageBytes = fs.readFileSync(imageFile);
    const image = imageFile.endsWith(".png") ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
    if(image.width/image.height > imgWidth/imgHeight){
        const ratio= imgWidth/image.width
        imgWidth= image.width*ratio;
        imgHeight= image.height*ratio;
    }
    else{
        const ratio= imgHeight/image.height;
        imgWidth= image.width*ratio;
        imgHeight= image.height*ratio;
    }


    const padding=5;
    const bottom=30;

    const x = x_cord+(secWidth-imgWidth-2*padding)/2 + padding; 
    const y = y_cord+(secHeight-imgHeight-2*padding-bottom)/2 + padding + bottom; 

    //Polaroid effect
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

export async function addParagraph(inputFile: string,outputFile: string,paragraph: string,x: number,y: number,secWidth:number, secHeight:number,boxWidth: number,boxHeight: number,fontSize: number,pageNo: number) {
    
    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    
    const page = pdfDoc.getPage(pageNo-1);

    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync("../assets/Angelos.ttf");
    const font = await pdfDoc.embedFont(fontBytes);
    const lineHeight = fontSize * 1.5;
    
    // Split the paragraph into lines that fit inside the box width
    const words = paragraph.split(" ");
    let lines= [];
    let currentLine = "";
    const minWidth=boxWidth/2;
    while(lineHeight*lines.length< boxHeight/2 && boxWidth>minWidth ){
        lines.length=0;
        currentLine="";
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
        boxWidth*=0.95;
        boxHeight*=0.95;
    }
    boxHeight*=1.05;
    boxWidth*=1.05;
    const totalTextHeight = lines.length * lineHeight;
    const offset=(boxHeight-totalTextHeight)/2-20;
    if (totalTextHeight > boxHeight*1.1) {
        console.log("Warning: Text is too large to fit inside the box.");
    }

    x=x+(secWidth-boxWidth)/2;
    y=y+(secHeight-boxWidth)/2;

    const imageBytes = fs.readFileSync("../assets/torn-paper.png");
    const image = await pdfDoc.embedPng(imageBytes);

    // -K*math.random()  higher K = less chance of rotation
    const theta=5*Math.pow(Math.E,Math.random()*-10);
    const rotation= degrees(theta);

    page.drawImage(image,{
        x:x-15,
        y:y-10,
        height: boxHeight*1.2,
        width:boxWidth*1.2,
        rotate: rotation,
    })

    //post it design
    /*page.drawRectangle({
        x:x,
        y:y,
        color:rgb(0.99,0.81,0.13),
        width: boxWidth,
        height: boxHeight,
    })

    page.drawCircle({
        x:x,
        y:y+boxHeight,
        size:10,
        color: rgb(1, 0, 0),
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 1,
    })

    page.drawCircle({
        x:x+boxWidth,
        y:y,
        size:10,
        color: rgb(1, 0, 0),
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 1,
    })*/

    let textY = y + boxHeight - 15-offset; // Start from the top of the box
    for (const line of lines) {
        page.drawText(line, { x: x + 25-(textY-y)*Math.sin((theta*Math.PI)/180), y: textY, size: fontSize, font, color: rgb(0, 0, 0),rotate: degrees(5) });
        textY -= lineHeight; 
    }

    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFile, modifiedPdfBytes);

    console.log(`Added paragraph inside a box.`);
}

/*
async function main(){
    const para="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse tellus tortor, sodales nec risus at, porta pretium eros. Sed sodales egestas quam. Morbi ultrices quam neque, eu efficitur nisl ullamcorper vitae. Ut ultricies sollicitudin est et mollis. Nullam sit amet feugiat massa. Curabitur euismod lectus et mi dignissim maximus. Ut sed bibendum lectus, et molestie lectus. Proin commodo ullamcorper lectus non porta. Nulla purus est, facilisis eget sollicitudin at, luctus eu massa. Sed mi erat, pellentesque quis molestie quis, congue viverra diam. Mauris et iaculis erat. Pellentesque sit amet blandit mi, ac placerat est. Donec quis lorem auctor, euismod ex."
    await addParagraph("updated.pdf","updated.pdf",para,500,450, 300,300,15,1);
    await addImage("updated.pdf","updated.pdf","../assets/people.jpg",50,450,400,300,1);

    await addParagraph("updated.pdf","updated.pdf",para,50,100,300,300,15,1);
    await addImage("updated.pdf","updated.pdf","../assets/party.jpg",400,100,400,300,1);
}
main()
*/