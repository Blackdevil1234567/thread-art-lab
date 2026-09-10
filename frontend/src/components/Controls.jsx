import React, { useRef } from 'react';
import { Upload, Settings, Play, Cpu, LayoutTemplate, Palette, Zap, Ruler } from 'lucide-react';

const Controls = ({
  imageFile, setImageFile,
  numPins, setNumPins,
  numLines, setNumLines,
  lineWeight, setLineWeight,
  algorithm, setAlgorithm,
  mode, setMode,
  shape, setShape,
  colorMode, setColorMode,
  threadColor, setThreadColor,
  bgColor, setBgColor,
  autoStop, setAutoStop,
  contrast, setContrast,
  brightness, setBrightness,
  targetPreview, 
  showTargetPreview, setShowTargetPreview,
  cmyIntensity, setCmyIntensity,
  boardWidthCm, setBoardWidthCm,
  boardHeightCm, setBoardHeightCm,
  dynamicLimit, setDynamicLimit,
  onGenerate, onPreprocess,
  handleRawImageSelect,
  isGenerating, isPreprocessing
}) => {
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleRawImageSelect(e.target.files[0]);
    }
  };

  return (
    <div className="p-4 space-y-4">
      
      {/* Upload Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Upload size={14} /> Image Source
        </h2>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
            ${imageFile ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-blue-400 hover:bg-slate-700/50'}`}
        >
          {imageFile ? (
            <div className="text-emerald-400 font-medium truncate px-2">
              {imageFile.name}
            </div>
          ) : (
            <div className="text-slate-400">
              <span className="text-blue-400 font-medium">Click to upload</span> or drag and drop<br/>
              <span className="text-xs">PNG, JPG up to 10MB</span>
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/png, image/jpeg" 
          onChange={(e) => {
              handleImageChange(e);
              setShowTargetPreview(false);
          }}
        />
      </div>

      {/* Image Preparation */}
      <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
        <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Settings size={14} /> Image Preparation
            </h2>
            <button 
                onClick={() => {
                    const next = !showTargetPreview;
                    setShowTargetPreview(next);
                    if (next && !targetPreview) onPreprocess();
                }}
                className={`text-[10px] px-2 py-1 rounded transition-all font-bold uppercase ${showTargetPreview ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}
            >
                {showTargetPreview ? 'Hide AI View' : 'Show AI View'}
            </button>
        </div>

        {showTargetPreview && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden border border-blue-500/30 group">
                    {isPreprocessing ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : targetPreview ? (
                        <img src={targetPreview} alt="AI Target" className="w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500">No preview</div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded text-[9px] text-blue-400 font-medium">
                        AI TARGET VIEW
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Subject Contrast</span>
                        <span className="text-blue-400 font-mono">{contrast.toFixed(1)}x</span>
                    </div>
                    <input 
                        type="range" min="0.5" max="3.0" step="0.1" 
                        value={contrast} 
                        onChange={(e) => setContrast(parseFloat(e.target.value))}
                        onMouseUp={onPreprocess}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Brightness Floor</span>
                        <span className="text-blue-400 font-mono">{brightness}</span>
                    </div>
                    <input 
                        type="range" min="-100" max="100" step="1" 
                        value={brightness} 
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        onMouseUp={onPreprocess}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>
        )}
      </div>

      {/* Color Balance (Active in CMY/CMYK) */}
      {(colorMode === 'color' || colorMode === 'cmyk') && (
          <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Palette size={14} /> Color Balance
              </h2>
              <div className="space-y-3">
                  <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-cyan-400">Cyan Strength</span>
                            <span className="text-cyan-400 font-mono">{cmyIntensity.c}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="200" step="5" 
                            value={cmyIntensity.c} 
                            onChange={(e) => setCmyIntensity(prev => ({ ...prev, c: parseInt(e.target.value) }))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                  <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-pink-400">Magenta Strength</span>
                            <span className="text-pink-400 font-mono">{cmyIntensity.m}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="200" step="5" 
                            value={cmyIntensity.m} 
                            onChange={(e) => setCmyIntensity(prev => ({ ...prev, m: parseInt(e.target.value) }))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>
                  <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-yellow-400">Yellow Strength</span>
                            <span className="text-yellow-400 font-mono">{cmyIntensity.y}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="200" step="5" 
                            value={cmyIntensity.y} 
                            onChange={(e) => setCmyIntensity(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>
                  {colorMode === 'cmyk' && (
                    <div className="space-y-2">
                          <div className="flex justify-between text-[10px]">
                              <span className="text-slate-100 font-bold italic">CMYK Shadows (Black)</span>
                              <span className="text-slate-100 font-mono">{cmyIntensity.k}%</span>
                          </div>
                          <input 
                              type="range" min="0" max="200" step="5" 
                              value={cmyIntensity.k} 
                              onChange={(e) => setCmyIntensity(prev => ({ ...prev, k: parseInt(e.target.value) }))}
                              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white"
                          />
                      </div>
                  )}
                  {colorMode === 'cmyk' && (
                      <div className="pt-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
                          <Zap size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[9px] text-blue-300 leading-relaxed italic">
                              <strong className="uppercase">Artistic Engine Active:</strong> Spectral separation enabled. Monochrome portraits will now generate with artistic tonal tints.
                          </p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Thread Engine */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Cpu size={16} className="text-blue-400" /> Thread Engine
        </h2>
        
        <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/5">
            <div className="flex flex-col gap-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold px-1">Board</span>
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-700/50">
                    <button onClick={() => setShape('circle')} className={`py-1.5 px-3 text-[10px] uppercase font-bold rounded-md flex-1 ${shape === 'circle' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}>CIRCLE</button>
                    <button onClick={() => setShape('square')} className={`py-1.5 px-3 text-[10px] uppercase font-bold rounded-md flex-1 ${shape === 'square' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}>SQUARE</button>
                </div>
            </div>
            <div className="flex flex-col gap-1 flex-1">
                <span className="text-[9px] text-slate-500 uppercase font-bold px-1">Palette</span>
                <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-700/50">
                    <button onClick={() => setColorMode('bw')} className={`py-1.5 px-2 text-[9px] uppercase font-bold rounded-md flex-1 transition-all ${colorMode === 'bw' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}>MONO</button>
                    <button onClick={() => setColorMode('color')} className={`py-1.5 px-2 text-[9px] uppercase font-bold rounded-md flex-1 transition-all ${colorMode === 'color' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}>CMY</button>
                    <button onClick={() => setColorMode('cmyk')} className={`py-1.5 px-2 text-[9px] uppercase font-bold rounded-md flex-1 transition-all ${colorMode === 'cmyk' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}>CMYK</button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setAlgorithm('greedy')} className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${algorithm === 'greedy' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>Greedy Engine</button>
          <button onClick={() => setAlgorithm('genetic')} className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${algorithm === 'genetic' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'}`}>Genetic AI</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode('preview')} className={`py-1.5 px-3 text-xs font-medium rounded-lg border ${mode === 'preview' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Preview</button>
            <button onClick={() => setMode('final')} className={`py-1.5 px-3 text-xs font-medium rounded-lg border ${mode === 'final' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Final Export</button>
        </div>
        
        <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="sr-only" checked={autoStop} onChange={(e) => setAutoStop(e.target.checked)} />
                <div className={`relative block w-10 h-6 rounded-full transition-colors ${autoStop ? 'bg-blue-500' : 'bg-slate-700'}`}>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoStop ? 'translate-x-4' : ''}`}></div>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400">Smart Optimization</span>
                    <span className="text-[10px] text-slate-500 italic">Auto-stops once clear</span>
                </div>
            </label>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Settings size={16} /> Configuration
        </h2>

        <div className="space-y-2">
          <div className="flex justify-between"><label className="text-sm text-slate-300">Number of Nails</label><span className="text-sm font-mono text-blue-400">{numPins}</span></div>
          <input type="range" min="100" max="500" step="10" value={numPins} onChange={(e) => setNumPins(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>

        <div className="space-y-4 pt-2 border-b border-white/5 pb-4">
            <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="sr-only" checked={dynamicLimit} onChange={(e) => setDynamicLimit(e.target.checked)} />
                <div className={`relative block w-10 h-6 rounded-full transition-colors ${dynamicLimit ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${dynamicLimit ? 'translate-x-4' : ''}`}></div>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400">Dynamic Line Limit</span>
                    <span className="text-[10px] text-slate-500 italic">Ignores limit; stops when perfect</span>
                </div>
            </label>

            <div className={`space-y-2 transition-opacity duration-200 ${dynamicLimit ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex justify-between"><label className="text-sm text-slate-300">Max Lines (Per Color)</label><span className="text-sm font-mono text-blue-400">{numLines}</span></div>
                <input type="range" min="500" max="10000" step="100" value={numLines} onChange={(e) => setNumLines(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <label className="text-sm text-slate-300">Rope Thickness</label>
            <span className="text-sm font-mono text-blue-400">{(lineWeight / 10).toFixed(1)} mm</span>
          </div>
          <input type="range" min="1" max="50" step="1" value={lineWeight} onChange={(e) => setLineWeight(Number(e.target.value))} className="w-full accent-blue-500" />
          <p className="text-[10px] text-slate-500 italic">Adjusts the physical diameter of the thread/rope</p>
        </div>

        <div className="space-y-4 pt-2 border-t border-slate-700/30">
          <div className="flex items-center gap-2 text-sm text-slate-300">
              <Ruler size={14} className="text-emerald-400" />
              <span>Board Physical Dimensions</span>
          </div>
          
          <div className="space-y-3 pl-2">
              <div className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                      <span>Length (Width)</span>
                      <span className="text-emerald-400">{boardWidthCm} cm</span>
                  </div>
                  <input 
                      type="range" min="10" max="150" step="1" 
                      value={boardWidthCm} 
                      onChange={(e) => setBoardWidthCm(Number(e.target.value))} 
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                  />
              </div>

              <div className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                      <span>Breadth (Height)</span>
                      <span className="text-emerald-400">{boardHeightCm} cm</span>
                  </div>
                  <input 
                      type="range" min="10" max="150" step="1" 
                      value={boardHeightCm} 
                      onChange={(e) => setBoardHeightCm(Number(e.target.value))} 
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                  />
              </div>
          </div>

          {/* Smart Recommendation Section */}
          <div className="mt-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  <Zap size={12} /> Pro Suggestion
              </div>
              <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                      <div className="text-[11px] text-slate-200 font-semibold">
                          {(() => {
                              const maxDim = Math.max(boardWidthCm, boardHeightCm);
                              if (maxDim <= 35) return "Fine Sewing Thread";
                              if (maxDim <= 55) return "All-purpose Polyester";
                              if (maxDim <= 85) return "Heavy Duty / Upholstery";
                              if (maxDim <= 125) return "Cotton Twine / Fine Cord";
                              return "Paracord / Macrame Yarn";
                          })()}
                      </div>
                      <div className="text-[9px] text-slate-500 italic">Recommended for {Math.max(boardWidthCm, boardHeightCm)}cm scale</div>
                  </div>
                  <div className="text-right">
                      <div className="text-xs font-mono text-emerald-400 font-bold">
                          {(() => {
                              const maxDim = Math.max(boardWidthCm, boardHeightCm);
                              if (maxDim <= 35) return "0.1 - 0.2 mm";
                              if (maxDim <= 55) return "0.3 - 0.5 mm";
                              if (maxDim <= 85) return "0.6 - 0.9 mm";
                              if (maxDim <= 125) return "1.0 - 1.5 mm";
                              return "2.0 mm+";
                          })()}
                      </div>
                      <div className="text-[8px] text-slate-600 uppercase font-bold">Optimal Thick</div>
                  </div>
              </div>
              <button 
                onClick={() => {
                    const maxDim = Math.max(boardWidthCm, boardHeightCm);
                    let targetWeight = 10;
                    if (maxDim <= 35) targetWeight = 2;
                    else if (maxDim <= 55) targetWeight = 5;
                    else if (maxDim <= 85) targetWeight = 12;
                    else if (maxDim <= 125) targetWeight = 25;
                    else targetWeight = 40;
                    setLineWeight(targetWeight);
                }}
                className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase rounded-md transition-colors border border-emerald-500/20"
              >
                  Apply Suggested Thickness
              </button>
          </div>
          
          <p className="text-[10px] text-slate-500 italic px-1">Sets the scale for the multi-page printable template</p>
        </div>

        {colorMode === 'bw' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm text-slate-300">Thread</label><input type="color" value={threadColor} onChange={(e) => setThreadColor(e.target.value)} className="h-8 w-full cursor-pointer bg-slate-700 border-0 rounded" /></div>
              <div className="space-y-2"><label className="text-sm text-slate-300">Background</label><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-full cursor-pointer bg-slate-700 border-0 rounded" /></div>
            </div>
        )}
      </div>

      {/* Action Section */}
      <div className="pt-6 pb-12 border-t border-slate-700/50 flex flex-col items-center">
        <button 
          onClick={onGenerate}
          disabled={!imageFile || isGenerating}
          className={`w-full py-4 rounded-xl font-bold text-white flex flex-col items-center justify-center gap-1 shadow-xl
            ${(!imageFile || isGenerating) ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:scale-[1.01]'}`}
        >
          {isGenerating ? "GENERATING..." : "GENERATE THREAD ART"}
        </button>
        <div className="mt-4 flex flex-col items-center gap-1 opacity-60">
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400">
                <span>{algorithm}</span><span>•</span><span>{mode}</span><span>•</span><span>{shape}</span>
            </div>
            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                {colorMode === 'bw' ? 'Monochrome Engine' : 'CMYK Portrait Engine'}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
