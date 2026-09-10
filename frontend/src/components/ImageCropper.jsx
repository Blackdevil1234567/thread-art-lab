import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Check, X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'

const ImageCropper = ({ image, onCropDone, onCropCancel, shape = 'circle' }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleDone = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels)
      onCropDone(croppedImage)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Crop Your Image
          </h3>
          <button 
            onClick={onCropCancel}
            className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative flex-1 bg-black min-h-[400px]">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape={shape === 'circle' ? 'round' : 'rect'}
            showGrid={true}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 space-y-6 bg-slate-800 border-t border-slate-700">
          <div className="flex items-center gap-4">
            <ZoomOut size={18} className="text-slate-400" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <ZoomIn size={18} className="text-slate-400" />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCropCancel}
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <X size={18} /> Cancel
            </button>
            <button
              onClick={handleDone}
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              <Check size={18} /> Confirm Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Utility to generate the cropped image
 */
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (error) => reject(error))
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      // Create a file from the blob
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' })
      resolve(file)
    }, 'image/jpeg')
  })
}

export default ImageCropper
