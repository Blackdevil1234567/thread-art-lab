from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from thread_art import generate_thread_art
from pdf_generator import generate_board_pdf
import numpy as np
import cv2
import base64
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate")
async def generate_art(
    file: UploadFile = File(...),
    numPins: int = Form(200),
    numLines: int = Form(1000),
    lineWeight: int = Form(10),
    algorithm: str = Form("greedy"),
    mode: str = Form("preview"),
    shape: str = Form("circle"),
    colorMode: str = Form("bw"),
    autoStop: bool = Form(True),
    contrast: float = Form(1.0),
    brightness: int = Form(0),
    enhanceContrast: bool = Form(True),
    cmyIntensity: str = Form('{"c": 100, "m": 100, "y": 100, "k": 100}'),
    dynamicLimit: str = Form("0")
):
    # Support both bool (from some clients) and str (from App.jsx)
    is_dynamic = str(dynamicLimit).lower() in ["1", "true", "on", "yes"]
    print(f"DEBUG: Starting generation. autoStop={autoStop}, numLines={numLines}, algo={algorithm}, dynamicLimit={is_dynamic}", flush=True)
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Could not read the uploaded image file. Make sure it's a valid JPG or PNG.")
 
    # Perform algorithm
    sequences = generate_thread_art(
        img, 
        num_pins=numPins, 
        num_lines=numLines, 
        line_weight=lineWeight,
        algorithm=algorithm,
        mode=mode,
        shape=shape,
        color_mode=colorMode,
        auto_stop=autoStop,
        contrast=contrast,
        brightness=brightness,
        enhance_contrast=enhanceContrast,
        cmy_intensity=json.loads(cmyIntensity),
        dynamic_limit=is_dynamic
    )
    
    return {"sequences": sequences}

@app.post("/generate-pdf")
async def get_pdf_template(
    numPins: int = Form(...),
    shape: str = Form("circle"),
    widthCm: float = Form(30),
    heightCm: float = Form(30)
):
    pdf_bytes = generate_board_pdf(numPins, shape, widthCm, heightCm)
    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=thread_art_template_{widthCm}x{heightCm}cm.pdf"
        }
    )
    
@app.post("/preprocess")
async def preprocess_art(
    file: UploadFile = File(...),
    contrast: float = Form(1.0),
    brightness: int = Form(0),
    shape: str = Form("circle"),
    enhanceContrast: bool = Form(True)
):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")
        
    from thread_art import preprocess_image
    inverted, mask, adjusted = preprocess_image(img, contrast, brightness, enhanceContrast, shape)
    
    # Encode as JPEG for preview
    _, buffer = cv2.imencode('.jpg', inverted)
    base64_img = base64.b64encode(buffer).decode('utf-8')
    
    return {"preview": f"data:image/jpeg;base64,{base64_img}"}

if __name__ == "__main__":
    print("--- THREADIFY ENGINE v2.1 LOADED (12,000 Line Limit Active) ---")
    uvicorn.run(app, host="0.0.0.0", port=8000)
