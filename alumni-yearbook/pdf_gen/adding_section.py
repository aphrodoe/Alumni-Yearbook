from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from io import BytesIO

#CODE WHICH CAN ADD N PAGES TO THE END OF A DOCUMENT ALONG WITH A TEXT HEADING
#REPLACE INPUT PDF WITH LOCATION OF PDF FILE

def create_section_pages(n, text_label, page_size):
    packet = BytesIO()
    c = canvas.Canvas(packet, pagesize=page_size)

    for i in range(n):  # Generate N pages
        c.setFont("Helvetica-Bold", 20)
        c.drawString(100, 100, f"{text_label} - Page {i+1}")
        c.showPage()

    c.save()
    packet.seek(0)
    return packet

def add_section_to_pdf(input_pdf, output_pdf, n, text_label):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()

    # Copy original pages
    for page in reader.pages:
        writer.add_page(page)

    # Get the size of the last page
    last_page = reader.pages[-1]
    page_width = last_page.mediabox.width
    page_height = last_page.mediabox.height
    page_size = (page_width, page_height)

    # Create new section pages
    new_pdf = PdfReader(create_section_pages(n, text_label, page_size))
    for page in new_pdf.pages:
        writer.add_page(page)

    # Save the updated PDF
    with open(output_pdf, "wb") as f:
        writer.write(f)

# Example Usage
input_pdf = "YEARBOOK_BATCH_2024.pdf"
output_pdf = "updated.pdf"   
n = 3                      
text_label = "MEMORIES"

add_section_to_pdf(input_pdf, output_pdf, n, text_label)

print(f"Added {n} pages with label '{text_label}' to {input_pdf}. Saved as {output_pdf}.")
