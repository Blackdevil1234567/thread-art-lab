import { useState } from 'react'
import Controls from './components/Controls'
import CanvasPreview from './components/CanvasPreview'
import ImageCropper from './components/ImageCropper'

function App() {
  const [imageFile, setImageFile] = useState(null)
  const [numPins, setNumPins] = useState(250)
  const [numLines, setNumLines] = useState(1500)
  const [lineWeight, setLineWeight] = useState(10)
  const [threadColor, setThreadColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  
  // Advanced features
  const [algorithm, setAlgorithm] = useState('greedy')
  const [mode, setMode] = useState('preview')
  const [shape, setShape] = useState('circle')
  const [colorMode, setColorMode] = useState('bw') // bw or color
  const [autoStop, setAutoStop] = useState(true)
  const [contrast, setContrast] = useState(1.0)
  const [brightness, setBrightness] = useState(0)
  const [boardWidthCm, setBoardWidthCm] = useState(30)
  const [boardHeightCm, setBoardHeightCm] = useState(30)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPreprocessing, setIsPreprocessing] = useState(false)
  const [sequences, setSequences] = useState([])
  const [targetPreview, setTargetPreview] = useState(null)
  const [showTargetPreview, setShowTargetPreview] = useState(false)
  const [cmyIntensity, setCmyIntensity] = useState({ c: 100, m: 100, y: 100, k: 100 })
  const [dynamicLimit, setDynamicLimit] = useState(false)
  
  // Cropping states
  const [rawImage, setRawImage] = useState(null)
  const [isCropping, setIsCropping] = useState(false)

  const handleRawImageSelect = (file) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      setRawImage(reader.result)
      setIsCropping(true)
    }
  }

  const handleCropDone = (croppedFile) => {
    setImageFile(croppedFile)
    setIsCropping(false)
    setRawImage(null)
    // Clear sequences if a new image is cropped
    setSequences([])
    setTargetPreview(null)
    setShowTargetPreview(false)
  }

  const handleCropCancel = () => {
    setIsCropping(false)
    setRawImage(null)
  }

  const handleGenerate = async () => {
    if (!imageFile) return;
    setIsGenerating(true);
    
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('numPins', numPins);
    formData.append('numLines', numLines);
    formData.append('lineWeight', lineWeight);
    formData.append('algorithm', algorithm);
    formData.append('mode', mode);
    formData.append('shape', shape);
    formData.append('contrast', contrast);
    formData.append('brightness', brightness);
    formData.append('cmyIntensity', JSON.stringify(cmyIntensity));
    formData.append('dynamicLimit', dynamicLimit ? "1" : "0");
    
    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
          let errDetail = 'Unknown Server Error';
          try {
              const errData = await response.json();
              errDetail = errData.detail || errDetail;
          } catch(e) {}
          throw new Error(errDetail);
      }
      
      const data = await response.json();
      setSequences(data.sequences || []);
    } catch (error) {
      console.error('Generation failed', error);
      alert(error.message === 'Failed to fetch' ? 'Failed to connect to the generator. Is the backend running?' : `Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  const handlePreprocess = async () => {
    if (!imageFile) return;
    setIsPreprocessing(true);
    
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('contrast', contrast);
    formData.append('brightness', brightness);
    formData.append('shape', shape);
    
    try {
      const response = await fetch('http://localhost:8000/preprocess', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setTargetPreview(data.preview);
    } catch (error) {
      console.error('Preprocessing failed', error);
    } finally {
      setIsPreprocessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-800 border-b border-slate-700 py-4 px-8 shadow-sm z-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Threadify</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium tracking-wide">AI-Powered</span>
          </h1>
          <p className="text-sm text-slate-400">Turn any image into printable string art</p>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-80 flex-shrink-0 border-r border-slate-700 bg-slate-800 overflow-y-auto">
          <Controls 
            imageFile={imageFile} setImageFile={setImageFile}
            numPins={numPins} setNumPins={setNumPins}
            numLines={numLines} setNumLines={setNumLines}
            lineWeight={lineWeight} setLineWeight={setLineWeight}
            algorithm={algorithm} setAlgorithm={setAlgorithm}
            mode={mode} setMode={setMode}
            shape={shape} setShape={setShape}
            colorMode={colorMode} setColorMode={setColorMode}
            threadColor={threadColor} setThreadColor={setThreadColor}
            bgColor={bgColor} setBgColor={setBgColor}
            autoStop={autoStop} setAutoStop={setAutoStop}
            contrast={contrast} setContrast={setContrast}
            brightness={brightness} setBrightness={setBrightness}
            targetPreview={targetPreview} 
            showTargetPreview={showTargetPreview} setShowTargetPreview={setShowTargetPreview}
            cmyIntensity={cmyIntensity} setCmyIntensity={setCmyIntensity}
            boardWidthCm={boardWidthCm} setBoardWidthCm={setBoardWidthCm}
            boardHeightCm={boardHeightCm} setBoardHeightCm={setBoardHeightCm}
            dynamicLimit={dynamicLimit} setDynamicLimit={setDynamicLimit}
            onGenerate={handleGenerate}
            onPreprocess={handlePreprocess}
            handleRawImageSelect={handleRawImageSelect}
            isGenerating={isGenerating}
            isPreprocessing={isPreprocessing}
          />
        </div>
        
        <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-8 relative">
          <CanvasPreview 
            sequences={sequences} 
            numPins={numPins}
            threadColor={threadColor}
            bgColor={bgColor}
            lineWeight={lineWeight}
            shape={shape}
            boardWidthCm={boardWidthCm}
            boardHeightCm={boardHeightCm}
          />
        </div>
      </main>

      {isCropping && (
        <ImageCropper 
          image={rawImage}
          shape={shape}
          onCropDone={handleCropDone}
          onCropCancel={handleCropCancel}
        />
      )}
    </div>
  )
}

export default App
