import { degrees, PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import axios from "axios";
import dbConnect from '../../../lib/mongodb.js';
import { v2 as cloudinary } from 'cloudinary';
import Section from "@/app/models/Section"
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';

//const connectToDatabase = require("@/lib/mongo.js");

async function createDoc(templateFile: string, outputFile: string, pages: number) {
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

async function addImage(inputFile: string, outputFile: string, imageFile: string, x_cord: number, y_cord:number, secWidth:number, secHeight:number, imgWidth: number,imgHeight: number ,pageNo: number) {

    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const page = pdfDoc.getPage(pageNo-1);
    const { width, height } = page.getSize();

    
    //const imageBytes = fs.readFileSync(imageFile);
    //const image = imageFile.endsWith(".png") ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);

    const response = await axios.get(imageFile, { responseType: "arraybuffer" });
    const imageBytes = response.data;

    // Determine image format and embed it
    const isPng = imageFile.toLowerCase().endsWith(".png");
    const image = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);

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

async function addParagraph(inputFile: string,outputFile: string,paragraph: string,x: number,y: number,secWidth:number, secHeight:number,boxWidth: number,boxHeight: number,fontSize: number,pageNo: number) {
    
    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    
    const page = pdfDoc.getPage(pageNo-1);

    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync("assets/Angelos.ttf");
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

    const imageBytes = fs.readFileSync("assets/torn-paper.png");
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

async function addSectionHeading(inputFile: string, outputFile: string, heading: string,fontSize: number, margin: number) {
    const existingPdfBytes = fs.readFileSync(inputFile);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const page = pdfDoc.getPage(0);
    const { width,height } = page.getSize();

    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync("assets/PragerHeadlines.ttf");
    const font = await pdfDoc.embedFont(fontBytes);

    const textWidth = font.widthOfTextAtSize(heading, fontSize);
    const textHeight = font.heightAtSize(fontSize)*0.75;

    const padding = 5;
    const boxWidth = textWidth + padding * 4;
    const boxHeight = textHeight + padding*2 ;
    const x = (width-boxWidth)/2; 
    const y = height-margin-boxHeight; 

    const imageBytes = fs.readFileSync("assets/title.png");
    const image = await pdfDoc.embedPng(imageBytes);

    page.drawImage(image,{
        x:x-5,
        y:y-10,
        width:boxWidth*1.1,
        height:boxHeight*1.3,
    })

    /*page.drawRectangle({
        x,
        y,
        width: boxWidth,
        height: boxHeight,
        borderWidth: 2,
        borderColor: rgb(0, 0, 0), 
        color: rgb(1,1,1), 
    });*/

    
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

async function generateSection(templateFile:string,outputFile:string,title:string,images: string[],text: string[]){
    const fontSize=45;
    const margin=5;
    const totalPages=Math.ceil((images.length+text.length)/4);
    let currentPage=1;
    let threshold=0;
    let boxSize=[425,395];
    let location=[[0, 395], [425, 395], [0,0], [425,0]];
    function update(){
        threshold++;
                if(threshold==4){
                    if (currentPage===1){
                        boxSize=[425,425];
                        location=[[0,425],[425,425],[0,0],[425,0]];
                    }
                    threshold=0;
                    currentPage++;
                }
    }
    await createDoc(templateFile,outputFile,totalPages);
    await addSectionHeading(outputFile, outputFile, title,fontSize,margin);
    while(images.length>0 || text.length>0){
        if (images.length>0){
            const image=images.shift();
            if (image!=undefined) await addImage(outputFile,outputFile,image,location[threshold][0],location[threshold][1],boxSize[0],boxSize[1],400,300,currentPage);
            update();
        }
        
        for( let x=0; x<2; x++){
            if(text.length>0){
                const data=text.shift();
                if (data!=undefined) await addParagraph(outputFile,outputFile,data,location[threshold][0],location[threshold][1],boxSize[0],boxSize[1],300,300,12,currentPage);
                update();
            }
            
        }

        if (images.length>0){
            const image=images.shift();
            if (image!=undefined) await addImage(outputFile,outputFile,image,location[threshold][0],location[threshold][1],boxSize[0],boxSize[1],400,300,currentPage);
            update();
        }

    }
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const userEmail = session.user?.email;
        if (!userEmail) {
            return NextResponse.json({ error: 'No email found in session' }, { status: 400 });
        }

        try {
            await dbConnect();
        } catch (error) {
            console.log("Error connecting to DB");
            console.error('Error connecting to DB:', error);
            return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 });
        }

        // Extract images and sections from request body
        const { images, sections,messages } = await request.json();
        const imageList = Array.isArray(images) ? images : Object.values(images);
        if (!images || !sections) {
            return NextResponse.json({ error: 'Missing image or section data' }, { status: 400 });
        }

        interface FormattedMessage {
            formatted_message: string;
        }
        const messageStrings: string[] = messages.map((msg: FormattedMessage) => msg.formatted_message);

        interface GroupedData {
            [headtitle: string]: {
                cloudinaryUrls: string[];
                captions: string[];
            };
        }
        
        interface Data {
            headtitle?: string;
            cloudinaryUrl: string;
            caption: string;
        }
        
        const groupedData: GroupedData = {};
        
        // Loop through imageList[0] and group data by headtitle
        for (let i = 0; i < imageList[0].length; i++) {
            const item: Data = imageList[0][i];
            const headtitle = item.headtitle || "No Headtitle";
        
            if (!groupedData[headtitle]) {
                groupedData[headtitle] = {
                    cloudinaryUrls: [],
                    captions: []
                };
            }
        
            groupedData[headtitle].cloudinaryUrls.push(item.cloudinaryUrl);
            groupedData[headtitle].captions.push(item.caption);
        }
        
        // Append new item with session email as headtitle
        const userHeadtitle = session?.user?.email || "Unknown User";
        groupedData[userHeadtitle] = {
            cloudinaryUrls: [],
            captions: messageStrings 
        };

        console.log("Grouped Data:", groupedData);

        // Deleting old sections from Cloudinary
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            try {
                await cloudinary.uploader.destroy(section.cloudinaryId, { resource_type: "raw" });
            } catch (error) {
                console.log(error);
                return NextResponse.json(
                    { message: 'Error deleting sections' },
                    { status: 500 }
                );
            }
        }

        // Delete old sections from DB
        await Section.deleteMany({ email: userEmail });

        // Generate and upload PDFs
        for (const [headtitle, lists] of Object.entries(groupedData)) {
            await generateSection(
                "assets/base_bg.pdf",
                `${headtitle}.pdf`,
                headtitle,
                lists.cloudinaryUrls,
                lists.captions
            );

            try {
                const uploadResponse = await cloudinary.uploader.upload(`${headtitle}.pdf`, {
                    resource_type: "raw",
                });

                console.log("PDF created and uploaded:", headtitle);

                await new Section({
                    email: userEmail,
                    cloudinaryId: uploadResponse.public_id,
                    cloudinaryUrl: uploadResponse.secure_url,
                    headtitle: headtitle,
                }).save();

                fs.unlink(`${headtitle}.pdf`, (err) => {
                    if (err) {
                        console.error(`Error deleting file ${headtitle}.pdf:`, err);
                    } else {
                        console.log(`File ${headtitle}.pdf deleted successfully.`);
                    }
                });
                
            } catch (error) {
                console.error("Error uploading PDF:", error);
            }
        }

        return NextResponse.json({ message: 'Process successful' });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { message: 'Error processing request' },
            { status: 500 }
        );
    }
}