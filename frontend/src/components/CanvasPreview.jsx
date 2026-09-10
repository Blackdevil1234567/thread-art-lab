import React, { useEffect, useRef, useState } from 'react';
import { Download, Play, Pause, FileText, Printer } from 'lucide-react';
import jsPDF from 'jspdf';

const CanvasPreview = ({ sequences, numPins, threadColor, bgColor, lineWeight, shape, boardWidthCm, boardHeightCm }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef(null);

  const canvasSize = 800;
  const radius = canvasSize / 2 - 40; // padding
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  // Flatten sequences for unified playback
  // Add a helper for smoothing out the rendering for multi-color
  const flatSequence = React.useMemo(() => {
    if (!sequences || sequences.length === 0) return [];
    let flat = [];
    
    // Interleave pins for better multi-color visualization (with small batches to make colors pop)
    if (sequences.length > 1) {
        const batchSize = 5; 
        const maxLen = Math.max(...sequences.map(s => s.pins.length));
        
        for (let i = 0; i < maxLen; i += batchSize) {
            sequences.forEach(seqObj => {
                for (let b = 0; b < batchSize; b++) {
                    const idx = i + b;
                    if (idx < seqObj.pins.length) {
                        flat.push({
                            pinIdx: seqObj.pins[idx],
                            color: seqObj.color === 'default' ? threadColor : seqObj.color,
                            isStart: idx === 0
                        });
                    }
                }
            });
        }
    } else {
        sequences[0].pins.forEach((pinIdx, i) => {
            flat.push({
                pinIdx,
                color: sequences[0].color === 'default' ? threadColor : sequences[0].color,
                isStart: i === 0
            });
        });
    }
    return flat;
  }, [sequences, threadColor]);

  // Precompute pin coordinates depending on shape
  const pins = React.useMemo(() => {
    const coords = [];
    if (shape === 'circle') {
        for (let i = 0; i < numPins; i++) {
            const angle = 2 * Math.PI * i / numPins - Math.PI / 2; // start top
            coords.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }
    } else {
        // square logic mapping 0 to numPins around the perimeter
        for (let i = 0; i < numPins; i++) {
            const dist = (i * (8 * radius)) / numPins;
            let x, y;
            if (dist < 2 * radius) {
                x = centerX - radius + dist;
                y = centerY - radius;
            } else if (dist < 4 * radius) {
                x = centerX + radius;
                y = centerY - radius + (dist - 2 * radius);
            } else if (dist < 6 * radius) {
                x = centerX + radius - (dist - 4 * radius);
                y = centerY + radius;
            } else {
                x = centerX - radius;
                y = centerY + radius - (dist - 6 * radius);
            }
            coords.push({ x, y });
        }
    }
    return coords;
  }, [numPins, radius, centerX, centerY, shape]);

  // Convert hex color to rgba for drawing with opacity
  const getRgba = (hex, alpha) => {
    // some CSS colors might be 'default' but we check that before here.
    if (!hex || !hex.startsWith('#') || hex.length !== 7) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const drawFrame = (step) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board boundary
    ctx.beginPath();
    if (shape === 'circle') {
        ctx.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI);
    } else {
        ctx.rect(centerX - radius - 20, centerY - radius - 20, 2 * radius + 40, 2 * radius + 40);
    }
    ctx.strokeStyle = '#e2e8f0'; // Outer rim
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pins
    ctx.fillStyle = '#64748b'; // pin color
    pins.forEach((pin, idx) => {
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw numbers every N pins (e.g., every 10)
        if (numPins <= 100 || idx % 10 === 0) {
            let numX, numY;
            if (shape === 'circle') {
                const numAngle = 2 * Math.PI * idx / numPins - Math.PI / 2;
                numX = centerX + (radius + 28) * Math.cos(numAngle);
                numY = centerY + (radius + 28) * Math.sin(numAngle);
            } else {
                const dx = pin.x - centerX;
                const dy = pin.y - centerY;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                numX = pin.x + (dx/dist) * 14;
                numY = pin.y + (dy/dist) * 14;
            }
            
            ctx.font = "10px Inter text-slate-500";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#94a3b8"; 
            ctx.fillText(idx.toString(), numX, numY);
        }
    });

    if (flatSequence.length === 0) return;

    const alpha = Math.max(0.01, Math.min(1.0, lineWeight / 100));
    ctx.lineWidth = 1;

    const maxSteps = Math.min(step, flatSequence.length);
    
    // To minimize context switches, group by color if drawing full thing,
    // but we need to respect the drawing order if steps are involved.
    // We will just draw segment by segment. It might be slightly slower for 10k lines,
    // but ok for canvas.
    for (let i = 1; i < maxSteps; i++) {
        const item = flatSequence[i];
        if (item.isStart) continue; // don't draw line from previous thread end!
        
        ctx.strokeStyle = getRgba(item.color, alpha);
        ctx.beginPath();
        const prevPin = pins[flatSequence[i-1].pinIdx];
        const curPin = pins[item.pinIdx];
        if (prevPin && curPin) {
            ctx.moveTo(prevPin.x, prevPin.y);
            ctx.lineTo(curPin.x, curPin.y);
            ctx.stroke();
        }
    }
  };

  useEffect(() => {
    drawFrame(currentStep);
  }, [currentStep, flatSequence, pins, threadColor, bgColor, lineWeight, shape]);

  useEffect(() => {
    if (flatSequence && flatSequence.length > 0) {
        setCurrentStep(flatSequence.length);
        setIsPlaying(false);
    } else {
        setCurrentStep(0);
    }
  }, [flatSequence, shape]);

  // Animation Loop
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(playAnim);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, currentStep, flatSequence]);

  const playAnim = () => {
    if (currentStep < flatSequence.length) {
      setCurrentStep(prev => Math.min(prev + 10, flatSequence.length));
      animationRef.current = requestAnimationFrame(playAnim);
    } else {
      setIsPlaying(false);
    }
  };

  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `thread-art-${shape}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleDownloadPDF = () => {
    if (!sequences || sequences.length === 0) return;
    
    const doc = new jsPDF();
    doc.setFont("helvetica");
    
    let currentY = 20;

    sequences.forEach((seqObj, seqIdx) => {
        const titleColorName = seqObj.color === 'default' ? threadColor : seqObj.color;
        
        doc.setFontSize(16);
        doc.text(`Thread Art Layout (${shape.toUpperCase()}) - Instructions`, 20, currentY);
        currentY += 10;
        
        doc.setFontSize(12);
        doc.text(`Layer ${seqIdx + 1} Color: ${titleColorName}`, 20, currentY);
        currentY += 6;
        
        doc.setFontSize(10);
        doc.text(`Total Lines For Layer: ${Math.max(0, seqObj.pins.length - 1)}`, 20, currentY);
        currentY += 10;
        
        doc.setFontSize(9);
        
        // Create rows with exactly 5 transitions (arrows) each, including progress headers
        const pins = seqObj.pins;
        const transitionsPerLine = 5;
        const totalTransitions = pins.length - 1;
        
        for (let i = 0; i < totalTransitions; i += transitionsPerLine) {
            const chunk = pins.slice(i, i + transitionsPerLine + 1);
            const lineRange = `[Lines ${i + 1}-${Math.min(i + transitionsPerLine, totalTransitions)}]`;
            let lineText = `${lineRange.padEnd(14)} ${chunk.join(' --> ')}`;
            
            // Add a trailing arrow if there's more to the sequence
            if (i + transitionsPerLine < totalTransitions) {
                lineText += ' -->';
            }
            
            doc.text(lineText, 20, currentY);
            currentY += 6;
            
            if (currentY > 280) {
                doc.addPage();
                currentY = 20;
            }
        }
        
        if (seqIdx < sequences.length - 1) {
            doc.addPage();
            currentY = 20;
        }
    });
    
    doc.save(`thread-art-instructions-${shape}.pdf`);
  };

  const handleDownloadTemplate = async () => {
    try {
        const formData = new FormData();
        formData.append('numPins', numPins);
        formData.append('shape', shape);
        formData.append('widthCm', boardWidthCm);
        formData.append('heightCm', boardHeightCm);

        const response = await fetch('http://localhost:8000/generate-pdf', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Failed to generate template');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `threadify_template_${boardWidthCm}x${boardHeightCm}cm.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Template download failed', error);
        alert('Could not download template. Check if backend is running.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4" ref={containerRef}>
      
      {/* Canvas Wrapper for scaling */}
      <div className="relative flex flex-col items-center justify-center p-4 w-full h-auto max-h-[75vh]">
        <div className={`bg-white shadow-2xl relative overflow-hidden ring-4 ring-slate-800 ${shape === 'circle' ? 'rounded-full' : 'rounded-md'}`}
             style={{ 
                 width: 'min(100%, 80vh)', 
                 aspectRatio: '1/1',
             }}>
             <canvas 
                ref={canvasRef}
                width={canvasSize}
                height={canvasSize}
                className="w-full h-full object-contain"
             />
        </div>
        
        {(!flatSequence || flatSequence.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    <span className="text-slate-200 font-medium tracking-wide">Waiting for image to generate...</span>
                </div>
            </div>
        )}
      </div>

      {/* Playback Controls & Export */}
      <div className="w-full max-w-3xl mt-4 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-4 flex items-center gap-6 shadow-xl">
          
          <button 
             onClick={() => setIsPlaying(!isPlaying)}
             disabled={!flatSequence || flatSequence.length === 0}
             className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
             {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Step {currentStep} / {flatSequence ? flatSequence.length : 0}</span>
                {flatSequence && flatSequence.length > 0 && currentStep > 0 && (
                    <span className="text-blue-400">Layer Color: {flatSequence[currentStep-1].color.toUpperCase()}</span>
                )}
            </div>
            <input 
                type="range"
                min="0"
                max={flatSequence ? flatSequence.length : 0}
                value={currentStep}
                onChange={(e) => {
                    setCurrentStep(Number(e.target.value));
                    setIsPlaying(false);
                }}
                disabled={!flatSequence || flatSequence.length === 0}
                className="w-full accent-blue-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          <div className="flex gap-2 border-l border-slate-700 pl-6">
            <button 
                onClick={handleDownloadImage}
                disabled={!flatSequence || flatSequence.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download PNG Preview"
            >
                <Download size={16} /> PNG
            </button>
            <button 
                onClick={handleDownloadPDF}
                disabled={!flatSequence || flatSequence.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download Printable Guide"
            >
                <FileText size={16} /> Guide
            </button>
            <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Print Nail Template (To Scale)"
            >
                <Printer size={16} /> Template
            </button>
          </div>
      </div>

    </div>
  );
};

export default CanvasPreview;
