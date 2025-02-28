import fitz  

#CODE TO EXTRACT TEXT AND IMAGES FROM A DOCUMENT
#EXTRACTED CO-ORDINATES OF IMAGES APPEAR TO BE GLITCHY
#REPLACE INPUT PDF WITH LOCATION OF PDF FILE

def extract_text_and_images(pdf_path, page_number):
    doc = fitz.open(pdf_path)
    page = doc[page_number - 1]  # Page numbers are 0-based in PyMuPDF

    # Extract text with coordinates
    text_data = []
    for block in page.get_text("dict")["blocks"]:
        if "lines" in block:  # Ignore image blocks
            for line in block["lines"]:
                for span in line["spans"]:
                    text_data.append({
                        "text": span["text"],
                        "x": span["bbox"][0],  # X-coordinate
                        "y": span["bbox"][1],  # Y-coordinate (top-left)
                        "width": span["bbox"][2] - span["bbox"][0],  # Width
                        "height": span["bbox"][3] - span["bbox"][1]  # Height
                    })

    # Extract images with coordinates
    image_data = []
    for img_index, img in enumerate(page.get_images(full=True)):
        xref = img[0]  # Image reference
        base_image = doc.extract_image(xref)
        image_data.append({
            "image_name": f"image_{page_number}_{img_index}.png",
            "x": img[1],  # X-coordinate
            "y": img[2],  # Y-coordinate (top-left)
            "width": img[3],  # Image width
            "height": img[4],  # Image height
            "image_bytes": base_image["image"]  # Image binary data
        })

    return text_data, image_data

# Example usage
pdf_file = "YEARBOOK_BATCH_2024.pdf"
n = 53  # Extract from page 2
text_info, image_info = extract_text_and_images(pdf_file, n)

# Print extracted text with coordinates
print("\nExtracted Text with Coordinates:")
for text in text_info:
    print(f'Text: "{text["text"]}" at (x: {text["x"]}, y: {text["y"]}, w: {text["width"]}, h: {text["height"]})')

# Save extracted images
print("\nExtracted Images:")
for img in image_info:
    with open(img["image_name"], "wb") as f:
        f.write(img["image_bytes"])
    print(f'Saved {img["image_name"]} at (x: {img["x"]}, y: {img["y"]}, w: {img["width"]}, h: {img["height"]})')
