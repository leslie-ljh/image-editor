/**
 * Image Processing Utilities
 * All operations are performed using Canvas API
 */

export interface ImageAdjustments {
  brightness: number;      // -100 to 100
  contrast: number;        // -100 to 100
  saturation: number;      // -100 to 100
  temperature: number;     // -100 to 100 (warm to cool)
  blur: number;            // 0 to 20
  sharpen: number;         // 0 to 100
  noise: number;           // 0 to 100
  clarity: number;         // 0 to 100
}

export interface FilterPreset {
  name: string;
  apply: (ctx: CanvasRenderingContext2D, imageData: ImageData) => ImageData;
}

/**
 * Apply brightness adjustment
 */
export function adjustBrightness(imageData: ImageData, value: number): ImageData {
  const data = imageData.data;
  const adjustment = (value / 100) * 255;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] + adjustment));     // R
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment)); // G
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment)); // B
  }
  
  return imageData;
}

/**
 * Apply contrast adjustment
 */
export function adjustContrast(imageData: ImageData, value: number): ImageData {
  const data = imageData.data;
  const factor = (259 * (value + 255)) / (255 * (259 - value));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
  }
  
  return imageData;
}

/**
 * Apply saturation adjustment
 */
export function adjustSaturation(imageData: ImageData, value: number): ImageData {
  const data = imageData.data;
  const adjustment = value / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
    
    data[i] = Math.max(0, Math.min(255, gray + adjustment * (r - gray) + (1 - adjustment) * (r - gray)));
    data[i + 1] = Math.max(0, Math.min(255, gray + adjustment * (g - gray) + (1 - adjustment) * (g - gray)));
    data[i + 2] = Math.max(0, Math.min(255, gray + adjustment * (b - gray) + (1 - adjustment) * (b - gray)));
  }
  
  return imageData;
}

/**
 * Apply color temperature adjustment
 * Positive values = warmer (more yellow/red)
 * Negative values = cooler (more blue)
 */
export function adjustTemperature(imageData: ImageData, value: number): ImageData {
  const data = imageData.data;
  const tempAdjust = value / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    if (tempAdjust > 0) {
      // Warmer: add red/yellow
      data[i] = Math.max(0, Math.min(255, data[i] + tempAdjust * 30));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + tempAdjust * 10));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] - tempAdjust * 20));
    } else {
      // Cooler: add blue
      data[i] = Math.max(0, Math.min(255, data[i] + tempAdjust * 20));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + tempAdjust * 5));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] - tempAdjust * 30));
    }
  }
  
  return imageData;
}

/**
 * Apply blur effect using box blur
 */
export function applyBlur(imageData: ImageData, radius: number): ImageData {
  if (radius <= 0) return imageData;
  
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  
  const size = Math.ceil(radius);
  const divider = (size * 2 + 1) ** 2;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      
      for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const idx = (ny * width + nx) * 4;
          
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          a += data[idx + 3];
        }
      }
      
      const idx = (y * width + x) * 4;
      output[idx] = r / divider;
      output[idx + 1] = g / divider;
      output[idx + 2] = b / divider;
      output[idx + 3] = a / divider;
    }
  }
  
  return new ImageData(output, width, height);
}

/**
 * Apply sharpen effect using unsharp masking
 */
export function applySharpen(imageData: ImageData, amount: number): ImageData {
  if (amount <= 0) return imageData;
  
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  
  // Sharpen kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  const factor = amount / 100;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const k = kernel[(ky + 1) * 3 + (kx + 1)];
          r += data[idx] * k;
          g += data[idx + 1] * k;
          b += data[idx + 2] * k;
        }
      }
      
      const idx = (y * width + x) * 4;
      output[idx] = Math.max(0, Math.min(255, data[idx] + (r - data[idx]) * factor));
      output[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + (g - data[idx + 1]) * factor));
      output[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + (b - data[idx + 2]) * factor));
      output[idx + 3] = data[idx + 3];
    }
  }
  
  return new ImageData(output, width, height);
}

/**
 * Add noise to image
 */
export function addNoise(imageData: ImageData, amount: number): ImageData {
  if (amount <= 0) return imageData;
  
  const data = imageData.data;
  const noiseLevel = amount * 2.55; // Scale to 0-255 range
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * noiseLevel;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  
  return imageData;
}

/**
 * Improve clarity (local contrast enhancement)
 */
export function improveClarity(imageData: ImageData, amount: number): ImageData {
  if (amount <= 0) return imageData;
  
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);
  
  const factor = amount / 100;
  const radius = 2;
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate local average
      let avgR = 0, avgG = 0, avgB = 0, count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          avgR += data[nIdx];
          avgG += data[nIdx + 1];
          avgB += data[nIdx + 2];
          count++;
        }
      }
      
      avgR /= count;
      avgG /= count;
      avgB /= count;
      
      // Enhance local contrast
      output[idx] = Math.max(0, Math.min(255, avgR + (data[idx] - avgR) * (1 + factor)));
      output[idx + 1] = Math.max(0, Math.min(255, avgG + (data[idx + 1] - avgG) * (1 + factor)));
      output[idx + 2] = Math.max(0, Math.min(255, avgB + (data[idx + 2] - avgB) * (1 + factor)));
      output[idx + 3] = data[idx + 3];
    }
  }
  
  return new ImageData(output, width, height);
}

/**
 * Filter presets
 */
export const filterPresets: Record<string, FilterPreset> = {
  none: {
    name: 'None',
    apply: (_, imageData) => imageData
  },
  
  grayscale: {
    name: 'Black & White',
    apply: (_, imageData) => {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      return imageData;
    }
  },
  
  sepia: {
    name: 'Vintage',
    apply: (_, imageData) => {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      return imageData;
    }
  },
  
  lomo: {
    name: 'LOMO',
    apply: (_, imageData) => {
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          
          // Calculate vignette
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const vignette = 1 - (dist / maxDist) * 0.5;
          
          // High contrast
          const r = Math.max(0, Math.min(255, (data[idx] - 128) * 1.2 + 128));
          const g = Math.max(0, Math.min(255, (data[idx + 1] - 128) * 1.2 + 128));
          const b = Math.max(0, Math.min(255, (data[idx + 2] - 128) * 1.2 + 128));
          
          // Apply vignette and slight color shift
          data[idx] = r * vignette * 1.1;
          data[idx + 1] = g * vignette;
          data[idx + 2] = b * vignette * 0.9;
        }
      }
      return imageData;
    }
  },
  
  warm: {
    name: 'Warm',
    apply: (_, imageData) => {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.1);
        data[i + 1] = Math.min(255, data[i + 1] * 1.05);
        data[i + 2] = Math.max(0, data[i + 2] * 0.9);
      }
      return imageData;
    }
  },
  
  cool: {
    name: 'Cool',
    apply: (_, imageData) => {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, data[i] * 0.9);
        data[i + 1] = Math.min(255, data[i + 1] * 1.05);
        data[i + 2] = Math.min(255, data[i + 2] * 1.15);
      }
      return imageData;
    }
  },
  
  vintage: {
    name: 'Retro',
    apply: (_, imageData) => {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Fade colors
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Add slight sepia and reduce contrast
        data[i] = Math.min(255, (r * 0.9 + 30) + g * 0.05);
        data[i + 1] = Math.min(255, (g * 0.85 + 20));
        data[i + 2] = Math.min(255, (b * 0.7 + 30));
      }
      return imageData;
    }
  },
  
  dramatic: {
    name: 'Dramatic',
    apply: (_, imageData) => {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // High contrast
        data[i] = Math.max(0, Math.min(255, (data[i] - 128) * 1.5 + 128));
        data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * 1.5 + 128));
        data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * 1.5 + 128));
      }
      return imageData;
    }
  },
  
  faded: {
    name: 'Faded',
    apply: (_, imageData) => {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Lift shadows
        data[i] = Math.min(255, data[i] * 0.9 + 25);
        data[i + 1] = Math.min(255, data[i + 1] * 0.9 + 25);
        data[i + 2] = Math.min(255, data[i + 2] * 0.9 + 25);
      }
      return imageData;
    }
  }
};

/**
 * Rotate image
 */
export function rotateImage(
  canvas: HTMLCanvasElement,
  angle: number
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const output = document.createElement('canvas');
  const outputCtx = output.getContext('2d')!;
  
  const radians = (angle * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  
  output.width = canvas.width * cos + canvas.height * sin;
  output.height = canvas.width * sin + canvas.height * cos;
  
  outputCtx.translate(output.width / 2, output.height / 2);
  outputCtx.rotate(radians);
  outputCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  
  return output;
}

/**
 * Flip image
 */
export function flipImage(
  canvas: HTMLCanvasElement,
  horizontal: boolean
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const output = document.createElement('canvas');
  const outputCtx = output.getContext('2d')!;
  
  output.width = canvas.width;
  output.height = canvas.height;
  
  if (horizontal) {
    outputCtx.translate(output.width, 0);
    outputCtx.scale(-1, 1);
  } else {
    outputCtx.translate(0, output.height);
    outputCtx.scale(1, -1);
  }
  
  outputCtx.drawImage(canvas, 0, 0);
  
  return output;
}

/**
 * Crop image
 */
export function cropImage(
  canvas: HTMLCanvasElement,
  cropArea: { x: number; y: number; width: number; height: number }
): HTMLCanvasElement {
  const output = document.createElement('canvas');
  const outputCtx = output.getContext('2d')!;
  
  output.width = cropArea.width;
  output.height = cropArea.height;
  
  outputCtx.drawImage(
    canvas,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );
  
  return output;
}

/**
 * Compress and export image
 */
export async function exportImage(
  canvas: HTMLCanvasElement,
  format: 'jpeg' | 'png' | 'webp',
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = `image/${format}`;
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to export image'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Load image from file
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Create canvas from image
 */
export function createCanvasFromImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  return canvas;
}
