from pdf_generator import generate_board_pdf
import os

def test_pdf():
    print("Testing PDF Generation...")
    try:
        # 30cm x 30cm board, 200 pins
        pdf_bytes = generate_board_pdf(200, "circle", 30, 30)
        print(f"Success! Generated {len(pdf_bytes)} bytes.")
        
        # Save to a temp file for manual check if needed
        with open("test_template.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("Test file saved as test_template.pdf")
    except Exception as e:
        print(f"Error during PDF generation: {e}")

if __name__ == "__main__":
    test_pdf()
