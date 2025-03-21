import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

interface MessageData {
  senderName: string;
  senderEmail: string;
  messages: {
    text: string;
    timestamp: string;
  }[];
}

async function createMessagePDF(messageData: MessageData[]): Promise<string> {
 
  const pdfDoc = await PDFDocument.create();
  
  pdfDoc.registerFontkit(fontkit);
  
  const titleFontBytes = fs.readFileSync("assets/PragerHeadlines.ttf");
  const titleFont = await pdfDoc.embedFont(titleFontBytes);
  
  const messageFontBytes = fs.readFileSync("assets/Angelos.ttf");
  const messageFont = await pdfDoc.embedFont(messageFontBytes);
  
  const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const titlePage = pdfDoc.addPage([595, 842]); 
  const { width, height } = titlePage.getSize();
  
  titlePage.drawText("My Messages", {
    x: 50,
    y: height - 100,
    size: 40,
    font: titleFont,
    color: rgb(0, 0, 0)
  });

  for (const sender of messageData) {
    let page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();
    
    page.drawText(`Message from ${sender.senderName}`, {
      x: 50,
      y: height - 50,
      size: 24,
      font: titleFont,
      color: rgb(0, 0, 0)
    });
    
    page.drawText(`(${sender.senderEmail})`, {
      x: 50,
      y: height - 80,
      size: 12,
      font: standardFont,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    page.drawLine({
      start: { x: 50, y: height - 100 },
      end: { x: width - 50, y: height - 100 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7)
    });
    
    let yPosition = height - 130;
    const messageGap = 20;
    const messageMargin = 50;
    const maxWidth = width - (messageMargin * 2);
    
    for (const message of sender.messages) {
      const timestamp = new Date(message.timestamp).toLocaleString();
      
      page.drawText(timestamp, {
        x: messageMargin,
        y: yPosition,
        size: 10,
        font: standardFont,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      yPosition -= 20;
      
      const words = message.text.split(' ');
      let line = '';
      const fontSize = 12;
      const lineHeight = fontSize * 1.5;
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = messageFont.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth > maxWidth && line !== '') {
          page.drawText(line, {
            x: messageMargin,
            y: yPosition,
            size: fontSize,
            font: messageFont,
            color: rgb(0, 0, 0)
          });
          
          line = word;
          yPosition -= lineHeight;
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        page.drawText(line, {
          x: messageMargin,
          y: yPosition,
          size: fontSize,
          font: messageFont,
          color: rgb(0, 0, 0)
        });
      }
      
      page.drawRectangle({
        x: messageMargin - 10,
        y: yPosition - 10,
        width: maxWidth + 20,
        height: (height - 130) - yPosition + 30,
        borderWidth: 1,
        borderColor: rgb(0.8, 0.8, 0.8),
        color: rgb(0.95, 0.95, 0.95),
        opacity: 0.5,
        borderOpacity: 0.7
      });
      
      yPosition -= 40;
      
      if (yPosition < 100) {
        const newPage = pdfDoc.addPage([595, 842]);
        page = newPage;
        yPosition = height - 50;
      }
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  const tempFilePath = `message_pdf_${Date.now()}.pdf`;
  fs.writeFileSync(tempFilePath, pdfBytes);
  
  return tempFilePath;
}

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
      console.error('Error connecting to DB:', error);
      return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 });
    }

    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid message data' }, { status: 400 });
    }

    const pdfPath = await createMessagePDF(messages);
    
    try {
      const uploadResponse = await cloudinary.uploader.upload(pdfPath, {
        resource_type: "raw",
        public_id: `messages_${userEmail.split('@')[0]}_${Date.now()}`,
        folder: "message_pdfs"
      });
      
      fs.unlink(pdfPath, (err) => {
        if (err) {
          console.error(`Error deleting temporary PDF file: ${pdfPath}`, err);
        }
      });
      
      return NextResponse.json({ 
        message: 'Message PDF generated successfully',
        url: uploadResponse.secure_url
      });
      
    } catch (error) {
      console.error('Error uploading PDF to Cloudinary:', error);
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { message: 'Error processing request' },
      { status: 500 }
    );
  }
}