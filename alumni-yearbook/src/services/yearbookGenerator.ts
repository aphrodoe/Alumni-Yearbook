import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import AWS from 'aws-sdk';
import User from '@/app/models/User';
import Image from '@/app/models/Image';
import MessageBatchmate from '@/app/models/Messageb';
import GeneratedYearbook from '@/app/models/GeneratedYearbook';

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

interface Memory {
    headtitle: string;
    images: {
        s3Url: string;
        caption: string;
    }[];
}

interface ChatSection {
    otherUserName: string;
    otherUserEmail: string;
    messages: {
        message: string;
        isSent: boolean;
        timestamp: Date;
    }[];
}

export class YearbookGenerator {
    private pdfDoc: PDFDocument;
    private currentY: number = 750;
    private pageWidth: number = 595;
    private pageHeight: number = 842;
    private margin: number = 50;
    private font: any;
    private boldFont: any;

    constructor() {
        this.pdfDoc = null as any;
    }

    async initialize() {
        this.pdfDoc = await PDFDocument.create();
        this.pdfDoc.registerFontkit(fontkit);
        
        // Load Times New Roman font
        try {
            const fontBytes = fs.readFileSync("assets/Times New Roman.ttf");
            this.font = await this.pdfDoc.embedFont(fontBytes);
            this.boldFont = await this.pdfDoc.embedFont(fontBytes); // Use same font for bold
        } catch {
            // Fallback to standard Times fonts
            this.font = await this.pdfDoc.embedFont(StandardFonts.TimesRoman);
            this.boldFont = await this.pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        }
    }

    async generatePersonalizedYearbook(email: string): Promise<string> {
        await this.initialize();

        // Get user data
        const user = await User.findOne({ email, hasCompletedPreferences: true });
        if (!user) {
            throw new Error('User not found or has not completed preferences');
        }

        // Generate memories section
        const memories = await this.getMemoriesForUser(email);
        await this.generateMemoriesSection(memories);

        // Generate messages section
        const chatSections = await this.getChatSectionsForUser(email);
        await this.generateMessagesSection(chatSections, user.name);

        // Save personalized PDF
        const personalizedPdfBytes = await this.pdfDoc.save();
        const personalizedPath = `temp/personalized_${email}_${Date.now()}.pdf`;
        fs.writeFileSync(personalizedPath, personalizedPdfBytes);

        // Merge with manual yearbook
        const finalPdfPath = await this.mergeWithManualYearbook(personalizedPath, email);

        // Upload to S3 and save to database
        const s3Url = await this.uploadToS3(finalPdfPath, email);
        
        // Clean up temp files
        fs.unlinkSync(personalizedPath);
        fs.unlinkSync(finalPdfPath);

        return s3Url;
    }

    private async getMemoriesForUser(email: string): Promise<Memory[]> {
        const images = await Image.find({ email }).sort({ headtitle: 1 });
        
        const memoriesMap = new Map<string, Memory>();
        
        images.forEach(img => {
            if (!memoriesMap.has(img.headtitle)) {
                memoriesMap.set(img.headtitle, {
                    headtitle: img.headtitle,
                    images: []
                });
            }
            memoriesMap.get(img.headtitle)!.images.push({
                s3Url: img.s3Url,
                caption: img.caption
            });
        });

        return Array.from(memoriesMap.values());
    }

    private async getChatSectionsForUser(email: string): Promise<ChatSection[]> {
        const sentMessages = await MessageBatchmate.find({ email_sender: email }).sort({ timestamp: 1 });
        const receivedMessages = await MessageBatchmate.find({ email_receiver: email }).sort({ timestamp: 1 });

        const chatMap = new Map<string, ChatSection>();

        // Process sent messages
        for (const msg of sentMessages) {
            const otherUser = await User.findOne({ email: msg.email_receiver });
            if (!chatMap.has(msg.email_receiver)) {
                chatMap.set(msg.email_receiver, {
                    otherUserName: otherUser?.name || 'Unknown User',
                    otherUserEmail: msg.email_receiver,
                    messages: []
                });
            }
            chatMap.get(msg.email_receiver)!.messages.push({
                message: msg.message,
                isSent: true,
                timestamp: msg.timestamp
            });
        }

        // Process received messages
        for (const msg of receivedMessages) {
            const otherUser = await User.findOne({ email: msg.email_sender });
            if (!chatMap.has(msg.email_sender)) {
                chatMap.set(msg.email_sender, {
                    otherUserName: otherUser?.name || 'Unknown User',
                    otherUserEmail: msg.email_sender,
                    messages: []
                });
            }
            chatMap.get(msg.email_sender)!.messages.push({
                message: msg.message,
                isSent: false,
                timestamp: msg.timestamp
            });
        }

        // Sort messages within each chat
        chatMap.forEach(chat => {
            chat.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        });

        return Array.from(chatMap.values());
    }

    private async generateMemoriesSection(memories: Memory[]) {
        if (memories.length === 0) return;

        console.log(`\n=== STARTING MEMORIES SECTION ===`);
        console.log(`Total memories to process: ${memories.length}`);
        
        // Add initial "My Memories" title page
        await this.addNewPage();
        this.addInitialMemoriesTitle();
        
        for (let i = 0; i < memories.length; i++) {
            const memory = memories[i];
            console.log(`\nProcessing memory ${i + 1}/${memories.length}: ${memory.headtitle}`);
            
            // Force new page for each memory
            await this.addNewPage();
            console.log(`Created new page for memory ${i + 1}`);
            
            await this.addMemorySection(memory);
        }
        
        console.log(`=== MEMORIES SECTION COMPLETE ===\n`);
    }

    private async generateMessagesSection(chatSections: ChatSection[], userName: string) {
        if (chatSections.length === 0) return;

        for (let i = 0; i < chatSections.length; i++) {
            const chat = chatSections[i];
            // Start each new conversation on a new page
            await this.addNewPage();
            this.addSectionTitle(`Conversation with ${chat.otherUserName}`);

            for (const msg of chat.messages) {
                await this.checkPageSpace(80);
                const currentPage = this.getCurrentPage();

                const senderName = msg.isSent ? userName : chat.otherUserName;
                const bubbleColor = msg.isSent ? rgb(0.525, 0.447, 0.584) : rgb(0.9, 0.9, 0.9);
                const textColor = msg.isSent ? rgb(1, 1, 1) : rgb(0, 0, 0);

                // Bubble dimensions
                const maxWidth = this.pageWidth - 2 * this.margin - 100;
                const padding = 12;
                const textSize = 12;

                // Wrap message text
                const wrappedMessage = this.wrapText(msg.message, 50);
                const lines = wrappedMessage.split('\n');
                const lineHeight = textSize + 4;
                const bubbleHeight = lines.length * lineHeight + 2 * padding + 25; // extra for sender name

                // Calculate bubble width (approximate)
                let bubbleWidth = 0;
                lines.forEach(line => {
                    bubbleWidth = Math.max(bubbleWidth, line.length * 7);
                });
                bubbleWidth = Math.max(bubbleWidth, senderName.length * 8); // Ensure sender name fits
                bubbleWidth += 2 * padding;
                bubbleWidth = Math.min(bubbleWidth, maxWidth);

                // Bubble position
                const bubbleX = msg.isSent ? this.pageWidth - this.margin - bubbleWidth : this.margin;
                const bubbleY = this.currentY - bubbleHeight;

                // Draw bubble rectangle
                currentPage.drawRectangle({
                    x: bubbleX,
                    y: bubbleY,
                    width: bubbleWidth,
                    height: bubbleHeight,
                    color: bubbleColor,
                    borderColor: rgb(0.6, 0.6, 0.6),
                    borderWidth: 1
                });

                // Draw sender name
                currentPage.drawText(senderName, {
                    x: bubbleX + padding,
                    y: bubbleY + bubbleHeight - padding - 12,
                    size: 10,
                    font: this.boldFont,
                    color: msg.isSent ? rgb(0.8, 0.8, 1) : rgb(0.3, 0.3, 0.3)
                });

                // Draw message text
                let textY = bubbleY + bubbleHeight - padding - 28;
                lines.forEach(line => {
                    currentPage.drawText(line, {
                        x: bubbleX + padding,
                        y: textY,
                        size: textSize,
                        font: this.font,
                        color: textColor
                    });
                    textY -= lineHeight;
                });

                this.currentY -= (bubbleHeight + 15);
            }
        }
    }

    private async addNewPage() {
        const page = this.pdfDoc.addPage([this.pageWidth, this.pageHeight]);
        this.currentY = this.pageHeight - this.margin;
        
        // Add background image to every page
        try {
            const backgroundBytes = fs.readFileSync("assets/background.jpg");
            const backgroundImage = await this.pdfDoc.embedJpg(backgroundBytes);
            
            page.drawImage(backgroundImage, {
                x: 0,
                y: 0,
                width: this.pageWidth,
                height: this.pageHeight,
            });
        } catch (error) {
            console.log('Background image not found, using plain background');
        }
        
        return page;
    }

    private getCurrentPage() {
        const pages = this.pdfDoc.getPages();
        return pages[pages.length - 1];
    }

    private addInitialMemoriesTitle() {
        const page = this.getCurrentPage();
        const title = "My Memories";
        
        // Make it more prominent and centered
        const fontSize = 48; // Increased size for prominence
        const titleWidth = title.length * (fontSize * 0.6); // Approximate width calculation
        const x = (this.pageWidth - titleWidth) / 2; // Center horizontally
        const y = (this.pageHeight) / 2; // Center vertically on page
        
        // Draw the text without shadow - just the purple text
        page.drawText(title, {
            x: x,
            y: y,
            size: fontSize,
            font: this.boldFont,
            color: rgb(0.525, 0.447, 0.584) // Purple color #867295
        });
        
        // Set current Y to below the centered title
        this.currentY = y - 100; // More space below the prominent title
    }


    private addSectionTitle(title: string) {
        const page = this.getCurrentPage();
        
        // Use smaller font size for long titles
        const fontSize = title.length > 30 ? 20 : 24;
        
        // Wrap long titles
        const maxCharsPerLine = Math.floor((this.pageWidth - 2 * this.margin) / (fontSize * 0.5));
        const wrappedTitle = this.wrapText(title, maxCharsPerLine);
        const lines = wrappedTitle.split('\n');
        
        let currentY = this.currentY;
        
        lines.forEach(line => {
            // Draw text without shadow - just the purple text
            page.drawText(line, {
                x: this.margin,
                y: currentY,
                size: fontSize,
                font: this.boldFont,
                color: rgb(0.525, 0.447, 0.584) // Purple color #867295
            });
            
            currentY -= (fontSize + 8);
        });
        
        this.currentY = currentY - 10;
    }

    private async addMemorySection(memory: Memory) {
        console.log(`\n=== Starting memory section: ${memory.headtitle} ===`);
        console.log(`Current Y position: ${this.currentY}`);
        console.log(`Total pages before: ${this.pdfDoc.getPages().length}`);
        
        try {
            // 1. Add memory title with title.png background
            await this.checkPageSpace(150);
            let currentPage = this.getCurrentPage();
            console.log(`After title space check - Pages: ${this.pdfDoc.getPages().length}, Y: ${this.currentY}`);
            
            const titleImageBytes = fs.readFileSync("assets/title.png");
            const titleImage = await this.pdfDoc.embedPng(titleImageBytes);
            
            const titleWidth = 450;
            const titleAspectRatio = titleImage.width / titleImage.height;
            const titleHeight = titleWidth / titleAspectRatio;
            const titleX = (this.pageWidth - titleWidth) / 2;
            
            console.log(`Drawing title at: (${titleX}, ${this.currentY - titleHeight})`);
            currentPage.drawImage(titleImage, {
                x: titleX,
                y: this.currentY - titleHeight,
                width: titleWidth,
                height: titleHeight,
            });
            
            // Memory title text with purple color
            const titleTextX = titleX + (titleWidth / 2);
            const titleTextY = this.currentY - (titleHeight / 2);
            
            currentPage.drawText(memory.headtitle, {
                x: titleTextX - (memory.headtitle.length * 10),
                y: titleTextY,
                size: 28,
                font: this.boldFont,
                color: rgb(0.525, 0.447, 0.584) // Purple color #867295
            });
            
            this.currentY -= (titleHeight + 40);
            console.log(`After title - Y position: ${this.currentY}`);
            
            // 2. Pre-load torn paper image
            const tornPaperBytes = fs.readFileSync("assets/torn-paper.png");
            const tornPaperImage = await this.pdfDoc.embedPng(tornPaperBytes);
            
            const postItWidth = 220;
            const postItAspectRatio = tornPaperImage.width / tornPaperImage.height;
            const postItHeight = postItWidth / postItAspectRatio;
            
            console.log(`Post-it dimensions: ${postItWidth}x${postItHeight}`);
            
            // Layout settings
            const imagesPerRow = 2;
            const horizontalSpacing = 30;
            const verticalSpacing = 40;
            const totalRowWidth = (imagesPerRow * postItWidth) + ((imagesPerRow - 1) * horizontalSpacing);
            const startX = (this.pageWidth - totalRowWidth) / 2;
            
            console.log(`Layout - Images per row: ${imagesPerRow}, Start X: ${startX}`);
            console.log(`Total images to process: ${memory.images.length}`);
            
            // Pre-load all images
            const loadedImages = [];
            for (let i = 0; i < memory.images.length; i++) {
                const img = memory.images[i];
                try {
                    console.log(`Pre-loading image ${i + 1}/${memory.images.length}: ${img.s3Url}`);
                    
                    const imageResponse = await fetch(img.s3Url);
                    if (!imageResponse.ok) {
                        throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`);
                    }
                    
                    const imageArrayBuffer = await imageResponse.arrayBuffer();
                    const imageBytes = new Uint8Array(imageArrayBuffer);
                    
                    if (imageBytes.length === 0) {
                        throw new Error('Empty image data received');
                    }
                    
                    let embeddedImage;
                    const urlLower = img.s3Url.toLowerCase();
                    
                    if (urlLower.endsWith('.png')) {
                        embeddedImage = await this.pdfDoc.embedPng(imageBytes);
                    } else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
                        embeddedImage = await this.pdfDoc.embedJpg(imageBytes);
                    } else {
                        // Fallback: try JPG first, then PNG
                        try {
                            embeddedImage = await this.pdfDoc.embedJpg(imageBytes);
                        } catch {
                            embeddedImage = await this.pdfDoc.embedPng(imageBytes);
                        }
                    }
                    
                    loadedImages.push({
                        embedded: embeddedImage,
                        success: true,
                        originalUrl: img.s3Url
                    });
                    
                    console.log(`✓ Successfully pre-loaded image ${i + 1}`);
                    
                } catch (error) {
                    console.error(`✗ Failed to pre-load image ${i + 1}:`, error);
                    loadedImages.push({
                        embedded: null,
                        success: false,
                        originalUrl: img.s3Url,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }
            
            console.log(`Pre-loading complete. Success: ${loadedImages.filter(img => img.success).length}/${loadedImages.length}`);
            
            // 3. Draw torn paper backgrounds and images
            let currentCol = 0;
            
            for (let i = 0; i < memory.images.length; i++) {
                const loadedImage = loadedImages[i];
                
                console.log(`\n--- Processing image ${i + 1} ---`);
                console.log(`Current Y before space check: ${this.currentY}`);
                console.log(`Required space: ${postItHeight + verticalSpacing + 50}`);
                
                // Check space and get current page
                await this.checkPageSpace(postItHeight + verticalSpacing + 50);
                currentPage = this.getCurrentPage();
                
                console.log(`After space check - Pages: ${this.pdfDoc.getPages().length}, Y: ${this.currentY}`);
                
                const postItX = startX + (currentCol * (postItWidth + horizontalSpacing));
                const postItY = this.currentY - postItHeight;
                
                console.log(`Drawing torn paper at: (${postItX}, ${postItY})`);
                
                // Draw torn paper background
                currentPage.drawImage(tornPaperImage, {
                    x: postItX,
                    y: postItY,
                    width: postItWidth,
                    height: postItHeight,
                });
                
                console.log(`✓ Torn paper drawn`);
                
                // Draw image on top if loaded successfully
                if (loadedImage.success && loadedImage.embedded) {
                    try {
                        const imageMargin = 20;
                        const imageAreaWidth = postItWidth - (2 * imageMargin);
                        const imageAreaHeight = postItHeight - (2 * imageMargin);
                        
                        const originalAspectRatio = loadedImage.embedded.width / loadedImage.embedded.height;
                        let drawWidth = imageAreaWidth;
                        let drawHeight = drawWidth / originalAspectRatio;
                        
                        if (drawHeight > imageAreaHeight) {
                            drawHeight = imageAreaHeight;
                            drawWidth = drawHeight * originalAspectRatio;
                        }
                        
                        const drawX = postItX + imageMargin + (imageAreaWidth - drawWidth) / 2;
                        const drawY = postItY + imageMargin + (imageAreaHeight - drawHeight) / 2;
                        
                        console.log(`Drawing image at: (${drawX}, ${drawY}) size: ${drawWidth}x${drawHeight}`);
                        
                        currentPage.drawImage(loadedImage.embedded, {
                            x: drawX,
                            y: drawY,
                            width: drawWidth,
                            height: drawHeight,
                        });
                        
                        console.log(`✓ Image drawn successfully`);
                        
                    } catch (drawError) {
                        console.error(`✗ Failed to draw image:`, drawError);
                        currentPage.drawText('Draw Error', {
                            x: postItX + 20,
                            y: postItY + postItHeight/2,
                            size: 10,
                            font: this.font,
                            color: rgb(0.8, 0.2, 0.2)
                        });
                    }
                } else {
                    console.log(`Drawing placeholder for failed image`);
                    currentPage.drawText('Image not', {
                        x: postItX + 20,
                        y: postItY + postItHeight/2 + 10,
                        size: 10,
                        font: this.font,
                        color: rgb(0.5, 0.5, 0.5)
                    });
                    currentPage.drawText('available', {
                        x: postItX + 20,
                        y: postItY + postItHeight/2 - 10,
                        size: 10,
                        font: this.font,
                        color: rgb(0.5, 0.5, 0.5)
                    });
                }
                
                // Update position
                currentCol++;
                if (currentCol >= imagesPerRow) {
                    currentCol = 0;
                    this.currentY -= (postItHeight + verticalSpacing);
                    console.log(`Row complete, new Y: ${this.currentY}`);
                }
            }
            
            // Adjust for incomplete row
            if (currentCol > 0) {
                this.currentY -= (postItHeight + verticalSpacing);
                console.log(`Incomplete row adjusted, Y: ${this.currentY}`);
            }
            
            // 4. Add caption with purple color
            if (memory.images.length > 0) {
                this.currentY -= 30;
                await this.checkPageSpace(100);
                currentPage = this.getCurrentPage();
                
                console.log(`Drawing caption at Y: ${this.currentY}`);
                
                const captionBoxWidth = 400;
                const captionBoxHeight = 80;
                const captionBoxX = (this.pageWidth - captionBoxWidth) / 2;
                const captionBoxY = this.currentY - captionBoxHeight;
                
                // Draw white rectangle
                currentPage.drawRectangle({
                    x: captionBoxX,
                    y: captionBoxY,
                    width: captionBoxWidth,
                    height: captionBoxHeight,
                    color: rgb(1, 1, 1),
                    borderColor: rgb(0.8, 0.8, 0.8),
                    borderWidth: 2
                });
                
                // Add caption text with purple color
                currentPage.drawText("Caption", {
                    x: captionBoxX + 20,
                    y: this.currentY - 25,
                    size: 16,
                    font: this.boldFont,
                    color: rgb(0.525, 0.447, 0.584) // Purple color #867295
                });
                
                const caption = memory.images[0].caption;
                const wrappedCaption = this.wrapText(caption, 45);
                const lines = wrappedCaption.split('\n');
                
                let captionY = this.currentY - 50;
                lines.forEach(line => {
                    currentPage.drawText(line, {
                        x: captionBoxX + 20,
                        y: captionY,
                        size: 12,
                        font: this.font,
                        color: rgb(0.3, 0.3, 0.3)
                    });
                    captionY -= 18;
                });
                
                this.currentY -= (captionBoxHeight + 20);
                console.log(`Caption complete, final Y: ${this.currentY}`);
            }
            
            // Prepare for next memory
            this.currentY -= 60;
            console.log(`Memory section complete. Final Y: ${this.currentY}`);
            console.log(`Total pages after: ${this.pdfDoc.getPages().length}`);
            
        } catch (error) {
            console.error('Error in addMemorySection:', error);
            const fallbackPage = this.getCurrentPage();
            fallbackPage.drawText(`Memory: ${memory.headtitle}`, {
                x: this.margin,
                y: this.currentY,
                size: 16,
                font: this.boldFont,
                color: rgb(1, 1, 1)
            });
            this.currentY -= 100;
        }
    }

    private async checkPageSpace(requiredSpace: number) {
        console.log(`Checking space: need ${requiredSpace}, have ${this.currentY - this.margin}`);
        if (this.currentY - requiredSpace < this.margin) {
            console.log(`Not enough space, creating new page`);
            await this.addNewPage();
            console.log(`New page created, Y reset to: ${this.currentY}`);
        } else {
            console.log(`Sufficient space available`);
        }
    }

    private wrapText(text: string, maxLength: number): string {
        if (text.length <= maxLength) return text;
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            if ((currentLine + word).length <= maxLength) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    // Word is longer than maxLength, truncate it
                    lines.push(word.substring(0, maxLength - 3) + '...');
                    currentLine = '';
                }
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.join('\n');
    }

    private async mergeWithManualYearbook(personalizedPath: string, email: string): Promise<string> {
        // Load manual yearbook
        const manualPdfBytes = fs.readFileSync('public/manual-yearbook.pdf');
        const manualPdf = await PDFDocument.load(manualPdfBytes);

        // Load personalized yearbook
        const personalizedPdfBytes = fs.readFileSync(personalizedPath);
        const personalizedPdf = await PDFDocument.load(personalizedPdfBytes);

        // Create final PDF
        const finalPdf = await PDFDocument.create();

        // Copy manual pages
        const manualPages = await finalPdf.copyPages(manualPdf, manualPdf.getPageIndices());
        manualPages.forEach(page => finalPdf.addPage(page));

        // Copy personalized pages
        const personalizedPages = await finalPdf.copyPages(personalizedPdf, personalizedPdf.getPageIndices());
        personalizedPages.forEach(page => finalPdf.addPage(page));

        // Save final PDF
        const finalPdfBytes = await finalPdf.save();
        const finalPath = `temp/final_yearbook_${email}_${Date.now()}.pdf`;
        fs.writeFileSync(finalPath, finalPdfBytes);

        return finalPath;
    }

    private async uploadToS3(filePath: string, email: string): Promise<string> {
        // Check if required environment variables are set
        if (!process.env.AWS_S3_BUCKET_NAME) {
            throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
        }
        if (!process.env.AWS_ACCESS_KEY_ID) {
            throw new Error('AWS_ACCESS_KEY_ID environment variable is not set');
        }
        if (!process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS_SECRET_ACCESS_KEY environment variable is not set');
        }

        const fileContent = fs.readFileSync(filePath);
        const fileName = `yearbooks/${email}_yearbook_${Date.now()}.pdf`;

        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileName,
            Body: fileContent,
            ContentType: 'application/pdf',
            ACL: 'public-read'  // Make the PDF publicly accessible
        };

        const result = await s3.upload(params).promise();
        
        // Save to database
        await GeneratedYearbook.findOneAndUpdate(
            { email },
            {
                email,
                s3Key: fileName,
                s3Url: result.Location,
                status: 'completed'
            },
            { upsert: true }
        );

        return result.Location;
    }
}
