import { useState, useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Circle, Line } from "fabric";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Undo2, 
  Redo2, 
  Save, 
  Download, 
  Palette, 
  CircleDot,
  Sparkles,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { PatternGenerator } from "@/components/PatternGenerator";
import { ColorPicker } from "@/components/ColorPicker";
import jsPDF from "jspdf";

interface Pin {
  x: number;
  y: number;
  id: string;
}

interface Thread {
  from: string;
  to: string;
  color: string;
  width: number;
}

const Studio = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedColor, setSelectedColor] = useState("#00F5FF");
  const [threadWidth, setThreadWidth] = useState(2);
  const [pinCount, setPinCount] = useState(32);
  const [mode, setMode] = useState<"place" | "connect">("place");
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [history, setHistory] = useState<{ pins: Pin[]; threads: Thread[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: "hsl(250, 35%, 12%)",
    });

    setFabricCanvas(canvas);
    addToHistory([], []);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Generate circular pins
  const generateCircularPins = () => {
    const centerX = 300;
    const centerY = 300;
    const radius = 250;
    const newPins: Pin[] = [];

    for (let i = 0; i < pinCount; i++) {
      const angle = (i / pinCount) * Math.PI * 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      newPins.push({ x, y, id: `pin-${i}` });
    }

    setPins(newPins);
    renderPins(newPins);
    addToHistory(newPins, threads);
    toast.success(`Generated ${pinCount} pins`);
  };

  const renderPins = (pinsToRender: Pin[]) => {
    if (!fabricCanvas) return;

    // Clear existing pins
    fabricCanvas.getObjects().forEach((obj) => {
      if ((obj as any).pinId) {
        fabricCanvas.remove(obj);
      }
    });

    // Render new pins
    pinsToRender.forEach((pin) => {
      const circle = new Circle({
        left: pin.x - 5,
        top: pin.y - 5,
        radius: 5,
        fill: "hsl(310, 100%, 65%)",
        selectable: false,
      });
      
      (circle as any).pinId = pin.id;
      (circle as any).pinType = "pin";

      fabricCanvas.add(circle);
    });

    fabricCanvas.renderAll();
  };

  const connectPins = (fromId: string, toId: string) => {
    const fromPin = pins.find((p) => p.id === fromId);
    const toPin = pins.find((p) => p.id === toId);

    if (!fromPin || !toPin || !fabricCanvas) return;

    const line = new Line([fromPin.x, fromPin.y, toPin.x, toPin.y], {
      stroke: selectedColor,
      strokeWidth: threadWidth,
      selectable: false,
    });
    
    (line as any).threadType = "thread";
    (line as any).threadFrom = fromId;
    (line as any).threadTo = toId;

    fabricCanvas.add(line);
    fabricCanvas.renderAll();

    const newThreads = [...threads, { from: fromId, to: toId, color: selectedColor, width: threadWidth }];
    setThreads(newThreads);
    addToHistory(pins, newThreads);
  };

  const handleCanvasClick = (e: any) => {
    if (!fabricCanvas) return;

    const pointer = fabricCanvas.getPointer(e.e);
    const clickedPin = pins.find((pin) => {
      const distance = Math.sqrt(Math.pow(pin.x - pointer.x, 2) + Math.pow(pin.y - pointer.y, 2));
      return distance < 10;
    });

    if (clickedPin && mode === "connect") {
      if (!selectedPin) {
        setSelectedPin(clickedPin.id);
        toast("Pin selected. Click another pin to connect.");
      } else {
        connectPins(selectedPin, clickedPin.id);
        setSelectedPin(null);
      }
    }
  };

  useEffect(() => {
    if (fabricCanvas) {
      fabricCanvas.on("mouse:down", handleCanvasClick);
    }
    return () => {
      if (fabricCanvas) {
        fabricCanvas.off("mouse:down", handleCanvasClick);
      }
    };
  }, [fabricCanvas, mode, selectedPin, pins, threads, selectedColor, threadWidth]);

  const addToHistory = (newPins: Pin[], newThreads: Thread[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ pins: newPins, threads: newThreads });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setPins(prevState.pins);
      setThreads(prevState.threads);
      renderPins(prevState.pins);
      renderThreads(prevState.threads);
      setHistoryIndex(historyIndex - 1);
      toast("Undo");
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPins(nextState.pins);
      setThreads(nextState.threads);
      renderPins(nextState.pins);
      renderThreads(nextState.threads);
      setHistoryIndex(historyIndex + 1);
      toast("Redo");
    }
  };

  const renderThreads = (threadsToRender: Thread[]) => {
    if (!fabricCanvas) return;

    fabricCanvas.getObjects().forEach((obj) => {
      if ((obj as any).threadType === "thread") {
        fabricCanvas.remove(obj);
      }
    });

    threadsToRender.forEach((thread) => {
      const fromPin = pins.find((p) => p.id === thread.from);
      const toPin = pins.find((p) => p.id === thread.to);

      if (fromPin && toPin) {
        const line = new Line([fromPin.x, fromPin.y, toPin.x, toPin.y], {
          stroke: thread.color,
          strokeWidth: thread.width,
          selectable: false,
        });
        
        (line as any).threadType = "thread";
        (line as any).threadFrom = thread.from;
        (line as any).threadTo = thread.to;

        fabricCanvas.add(line);
      }
    });

    fabricCanvas.renderAll();
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "hsl(250, 35%, 12%)";
    setPins([]);
    setThreads([]);
    addToHistory([], []);
    toast.success("Canvas cleared");
  };

  const exportToPDF = () => {
    if (!fabricCanvas) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const canvasSize = pageWidth - margin * 2;

    pdf.setFillColor(250, 250, 250);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    const dataUrl = fabricCanvas.toDataURL({ 
      format: "png",
      multiplier: 2,
      quality: 1
    });
    pdf.addImage(dataUrl, "PNG", margin, margin, canvasSize, canvasSize);

    pdf.setFontSize(10);
    pdf.text("ThreadArt Studio - Pin & Thread Guide", margin, margin + canvasSize + 10);
    pdf.text(`Total Pins: ${pins.length}`, margin, margin + canvasSize + 15);
    pdf.text(`Total Threads: ${threads.length}`, margin, margin + canvasSize + 20);

    pdf.save("thread-art-pattern.pdf");
    toast.success("PDF exported!");
  };

  return (
    <div className="min-h-screen bg-gradient-cosmic p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Tools Panel */}
          <Card className="p-6 bg-gradient-glass backdrop-blur-lg border-border lg:w-80 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-neon bg-clip-text text-transparent">
              Tools
            </h2>

            <div className="space-y-6">
              {/* Pin Controls */}
              <div>
                <label className="text-sm font-medium mb-2 block">Pin Count: {pinCount}</label>
                <Slider
                  value={[pinCount]}
                  onValueChange={(v) => setPinCount(v[0])}
                  min={8}
                  max={64}
                  step={4}
                  className="mb-2"
                />
                <Button onClick={generateCircularPins} className="w-full" variant="secondary">
                  <CircleDot className="mr-2 h-4 w-4" />
                  Generate Pins
                </Button>
              </div>

              {/* Mode Toggle */}
              <div>
                <label className="text-sm font-medium mb-2 block">Mode</label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setMode("place")}
                    variant={mode === "place" ? "default" : "outline"}
                    className="flex-1"
                  >
                    Place Pins
                  </Button>
                  <Button
                    onClick={() => setMode("connect")}
                    variant={mode === "connect" ? "default" : "outline"}
                    className="flex-1"
                  >
                    Connect
                  </Button>
                </div>
              </div>

              {/* Color Picker */}
              <ColorPicker color={selectedColor} onChange={setSelectedColor} />

              {/* Thread Width */}
              <div>
                <label className="text-sm font-medium mb-2 block">Thread Width: {threadWidth}px</label>
                <Slider
                  value={[threadWidth]}
                  onValueChange={(v) => setThreadWidth(v[0])}
                  min={1}
                  max={8}
                  step={0.5}
                />
              </div>

              {/* Pattern Generator */}
              <PatternGenerator
                pins={pins}
                onGenerate={(newThreads) => {
                  setThreads(newThreads);
                  renderThreads(newThreads);
                  addToHistory(pins, newThreads);
                }}
                selectedColor={selectedColor}
                threadWidth={threadWidth}
              />

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex gap-2">
                  <Button onClick={undo} variant="outline" className="flex-1">
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button onClick={redo} variant="outline" className="flex-1">
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={clearCanvas} variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Canvas
                </Button>
                <Button onClick={exportToPDF} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export to PDF
                </Button>
              </div>
            </div>
          </Card>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center">
            <Card className="p-8 bg-gradient-glass backdrop-blur-lg border-border animate-fade-in">
              <canvas ref={canvasRef} className="rounded-lg shadow-deep" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studio;
