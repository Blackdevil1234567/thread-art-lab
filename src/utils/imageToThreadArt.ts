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

const getImageData = (image: HTMLImageElement): ImageData => {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.fillStyle = 'hsl(250, 35%, 12%)';
  ctx.fillRect(0, 0, 600, 600);
  
  const scale = Math.min(600 / image.width, 600 / image.height);
  const x = (600 - image.width * scale) / 2;
  const y = (600 - image.height * scale) / 2;
  
  ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
  
  return ctx.getImageData(0, 0, 600, 600);
};

const getPixelBrightness = (imageData: ImageData, x: number, y: number): number => {
  const index = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
  const r = imageData.data[index];
  const g = imageData.data[index + 1];
  const b = imageData.data[index + 2];
  return (r + g + b) / 3 / 255;
};

const getPixelColor = (imageData: ImageData, x: number, y: number, colors: string[]): string => {
  const index = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
  const r = imageData.data[index];
  const g = imageData.data[index + 1];
  const b = imageData.data[index + 2];
  
  // Find closest color from the palette
  let minDistance = Infinity;
  let closestColor = colors[0];
  
  colors.forEach(color => {
    const rgb = hexToRgb(color);
    const distance = Math.sqrt(
      Math.pow(r - rgb.r, 2) +
      Math.pow(g - rgb.g, 2) +
      Math.pow(b - rgb.b, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  });
  
  return closestColor;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const convertImageToThreadArt = (
  image: HTMLImageElement,
  pins: Pin[],
  selectedColors: string[],
  threadWidth: number,
  density: number = 0.3
): Thread[] => {
  const imageData = getImageData(image);
  const threads: Thread[] = [];
  const maxThreads = Math.floor(pins.length * pins.length * density);
  
  // Use greedy algorithm to create threads
  let currentPin = 0;
  const usedConnections = new Set<string>();
  
  for (let i = 0; i < maxThreads; i++) {
    let bestScore = -1;
    let bestTarget = -1;
    let bestColor = selectedColors[0];
    
    // Try all possible connections from current pin
    for (let j = 0; j < pins.length; j++) {
      if (j === currentPin) continue;
      
      const connectionKey = `${Math.min(currentPin, j)}-${Math.max(currentPin, j)}`;
      if (usedConnections.has(connectionKey)) continue;
      
      // Sample pixels along the line
      const fromPin = pins[currentPin];
      const toPin = pins[j];
      const samples = 20;
      let darkness = 0;
      let colorMatch = selectedColors[0];
      
      for (let s = 0; s < samples; s++) {
        const t = s / samples;
        const x = fromPin.x + (toPin.x - fromPin.x) * t;
        const y = fromPin.y + (toPin.y - fromPin.y) * t;
        
        if (x >= 0 && x < 600 && y >= 0 && y < 600) {
          darkness += 1 - getPixelBrightness(imageData, x, y);
          if (selectedColors.length > 1) {
            colorMatch = getPixelColor(imageData, x, y, selectedColors);
          }
        }
      }
      
      const score = darkness;
      if (score > bestScore) {
        bestScore = score;
        bestTarget = j;
        bestColor = colorMatch;
      }
    }
    
    if (bestTarget !== -1 && bestScore > 2) {
      const connectionKey = `${Math.min(currentPin, bestTarget)}-${Math.max(currentPin, bestTarget)}`;
      usedConnections.add(connectionKey);
      
      threads.push({
        from: pins[currentPin].id,
        to: pins[bestTarget].id,
        color: bestColor,
        width: threadWidth
      });
      
      currentPin = bestTarget;
    } else {
      // Jump to a random pin if no good connection found
      currentPin = Math.floor(Math.random() * pins.length);
    }
  }
  
  return threads;
};
