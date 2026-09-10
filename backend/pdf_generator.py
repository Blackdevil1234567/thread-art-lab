import math
from fpdf import FPDF
import io

def generate_board_pdf(num_pins, shape, width_cm, height_cm):
    """
    Generates a multi-page A4 PDF template for the physical board.
    """
    width_mm = width_cm * 10
    height_mm = height_cm * 10
    
    # A4 dimensions in mm
    A4_W = 210
    A4_H = 297
    MARGIN = 10 # 1cm safety margin for printers
    PRINTABLE_W = A4_W - 2 * MARGIN
    PRINTABLE_H = A4_H - 2 * MARGIN
    
    OVERLAP = 5 # 5mm overlap for taping
    
    # Calculate pin coordinates in mm
    center_x = width_mm / 2
    center_y = height_mm / 2
    radius = (min(width_mm, height_mm) / 2) - 2 # 2mm inset for safety
    
    pins = []
    for i in range(num_pins):
        if shape == "circle":
            angle = 2 * math.pi * i / num_pins - math.pi/2
            px = center_x + radius * math.cos(angle)
            py = center_y + radius * math.sin(angle)
        else:
            # Square mapping
            dist = i * (8 * radius) / num_pins
            if dist < 2 * radius:
                px = center_x - radius + dist
                py = center_y - radius
            elif dist < 4 * radius:
                px = center_x + radius
                py = center_y - radius + (dist - 2 * radius)
            elif dist < 6 * radius:
                px = center_x + radius - (dist - 4 * radius)
                py = center_y + radius
            else:
                px = center_x - radius
                py = center_y + radius - (dist - 6 * radius)
        pins.append((px, py))

    # Determine number of pages
    # We use (Real Size - Overlap) to determine steps
    cols = math.ceil(width_mm / (PRINTABLE_W - OVERLAP))
    rows = math.ceil(height_mm / (PRINTABLE_H - OVERLAP))
    
    pdf = FPDF(orientation='P', unit='mm', format='A4')
    pdf.set_auto_page_break(False)
    
    for row in range(rows):
        for col in range(cols):
            pdf.add_page()
            
            # Current view window in board coordinates (mm)
            window_x_start = col * (PRINTABLE_W - OVERLAP)
            window_y_start = row * (PRINTABLE_H - OVERLAP)
            
            # Draw board content
            pdf.set_draw_color(180, 180, 180) # Light grey for guide
            pdf.set_line_width(0.1)
            
            # Draw Reference Scale (1cm)
            pdf.rect(MARGIN, MARGIN, 10, 2)
            pdf.set_font("Helvetica", size=6)
            pdf.text(MARGIN, MARGIN + 5, "1cm Scale")
            
            # Page Label
            pdf.set_font("Helvetica", 'B', size=10)
            label = f"Page {chr(65+row)}{col+1} ({row+1},{col+1}) - Board: {width_cm}x{height_cm}cm"
            pdf.text(MARGIN + 20, MARGIN + 4, label)
            
            # Draw Alignment Crosses on corners
            cross_size = 5
            for cx, cy in [(MARGIN, MARGIN), (MARGIN + PRINTABLE_W, MARGIN), 
                           (MARGIN, MARGIN + PRINTABLE_H), (MARGIN + PRINTABLE_W, MARGIN + PRINTABLE_H)]:
                pdf.line(cx - cross_size, cy, cx + cross_size, cy)
                pdf.line(cx, cy - cross_size, cx, cy + cross_size)

            # Draw Pins
            pdf.set_draw_color(0, 0, 0)
            pdf.set_fill_color(0, 0, 0)
            
            for i, (px, py) in enumerate(pins):
                # Check if pin is within current page window
                if (window_x_start <= px <= window_x_start + PRINTABLE_W) and \
                   (window_y_start <= py <= window_y_start + PRINTABLE_H):
                    
                    # Target position on PDF page
                    pdf_x = MARGIN + (px - window_x_start)
                    pdf_y = MARGIN + (py - window_y_start)
                    
                    # Draw small circle for nail
                    pdf.ellipse(pdf_x - 0.5, pdf_y - 0.5, 1, 1, style='F')
                    
                    # Number every 10th pin
                    if i % 10 == 0:
                        pdf.set_font("Helvetica", size=5)
                        pdf.text(pdf_x + 1, pdf_y + 1, str(i))
                        
    # Return PDF as bytes
    return pdf.output()

