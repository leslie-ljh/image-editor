'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FiCrop, FiRotateCw, FiRotateCcw, FiRefreshCw, 
  FiSun, FiSliders, FiDroplet, FiThermometer,
  FiAperture, FiZap, FiCircle, FiLayers,
  FiDownload, FiUpload, FiTrash2, FiCheck, FiX,
  FiMove, FiSquare
} from 'react-icons/fi';
import {
  ImageAdjustments,
  filterPresets,
  rotateImage,
  flipImage,
  cropImage,
  exportImage,
  loadImageFromFile,
  createCanvasFromImage,
  adjustBrightness,
  adjustContrast,
  adjustSaturation,
  adjustTemperature,
  applyBlur,
  applySharpen,
  addNoise,
  improveClarity
} from '@/utils/imageProcessing';

type ActiveTab = 'adjust' | 'filters' | 'enhance' | 'transform';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageEditor() {
  // State
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('adjust');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  
  // Adjustments
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    blur: 0,
    sharpen: 0,
    noise: 0,
    clarity: 0
  });
  
  // Filters
  const [activeFilter, setActiveFilter] = useState<string>('none');
  
  // Transform
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  
  // Crop
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  
  // Export
  const [exportFormat, setExportFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  const [exportQuality, setExportQuality] = useState(92);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // File drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    try {
      setIsProcessing(true);
      const img = await loadImageFromFile(file);
      const newCanvas = createCanvasFromImage(img);
      
      setOriginalImage(img);
      setCanvas(newCanvas);
      
      // Reset all adjustments
      setAdjustments({
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        blur: 0,
        sharpen: 0,
        noise: 0,
        clarity: 0
      });
      setActiveFilter('none');
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setCropArea(null);
      setIsCropping(false);
    } catch (error) {
      console.error('Failed to load image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp']
    },
    maxFiles: 1
  });
  
  // Apply all adjustments
  const applyAllAdjustments = useCallback(async () => {
    if (!canvas || !displayCanvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      let workingCanvas = document.createElement('canvas');
      workingCanvas.width = canvas.width;
      workingCanvas.height = canvas.height;
      const ctx = workingCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, 0);
      
      // Apply rotation
      if (rotation !== 0) {
        workingCanvas = rotateImage(workingCanvas, rotation);
      }
      
      // Apply flips
      if (flipH) {
        workingCanvas = flipImage(workingCanvas, true);
      }
      if (flipV) {
        workingCanvas = flipImage(workingCanvas, false);
      }
      
      // Get image data for pixel manipulation
      const workingCtx = workingCanvas.getContext('2d')!;
      let imageData = workingCtx.getImageData(0, 0, workingCanvas.width, workingCanvas.height);
      
      // Apply filter first
      if (activeFilter !== 'none' && filterPresets[activeFilter]) {
        imageData = filterPresets[activeFilter].apply(workingCtx, imageData);
      }
      
      // Apply adjustments
      if (adjustments.brightness !== 0) {
        imageData = adjustBrightness(imageData, adjustments.brightness);
      }
      if (adjustments.contrast !== 0) {
        imageData = adjustContrast(imageData, adjustments.contrast);
      }
      if (adjustments.saturation !== 0) {
        imageData = adjustSaturation(imageData, adjustments.saturation);
      }
      if (adjustments.temperature !== 0) {
        imageData = adjustTemperature(imageData, adjustments.temperature);
      }
      if (adjustments.noise > 0) {
        imageData = addNoise(imageData, adjustments.noise);
      }
      if (adjustments.clarity > 0) {
        imageData = improveClarity(imageData, adjustments.clarity);
      }
      
      // Put the adjusted image data back
      workingCtx.putImageData(imageData, 0, 0);
      
      // Apply blur and sharpen (these work on canvas, not imageData)
      if (adjustments.blur > 0) {
        const blurredData = applyBlur(
          workingCtx.getImageData(0, 0, workingCanvas.width, workingCanvas.height),
          adjustments.blur
        );
        workingCtx.putImageData(blurredData, 0, 0);
      }
      
      if (adjustments.sharpen > 0) {
        const sharpenedData = applySharpen(
          workingCtx.getImageData(0, 0, workingCanvas.width, workingCanvas.height),
          adjustments.sharpen
        );
        workingCtx.putImageData(sharpenedData, 0, 0);
      }
      
      // Draw to display canvas
      const displayCtx = displayCanvasRef.current.getContext('2d')!;
      displayCtx.clearRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
      
      // Fit to container while maintaining aspect ratio
      const container = containerRef.current;
      if (container) {
        const maxWidth = container.clientWidth - 32;
        const maxHeight = container.clientHeight - 32;
        const scale = Math.min(maxWidth / workingCanvas.width, maxHeight / workingCanvas.height, 1);
        
        displayCanvasRef.current.width = workingCanvas.width * scale;
        displayCanvasRef.current.height = workingCanvas.height * scale;
        displayCtx.drawImage(workingCanvas, 0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
      }
    } catch (error) {
      console.error('Error applying adjustments:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [canvas, adjustments, activeFilter, rotation, flipH, flipV]);
  
  // Re-apply when adjustments change
  useEffect(() => {
    if (canvas) {
      const debounce = setTimeout(() => {
        applyAllAdjustments();
      }, 50);
      return () => clearTimeout(debounce);
    }
  }, [canvas, adjustments, activeFilter, rotation, flipH, flipV, applyAllAdjustments]);
  
  // Handle crop
  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!isCropping || !displayCanvasRef.current) return;
    
    const rect = displayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  };
  
  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isCropping || !cropStart || !displayCanvasRef.current) return;
    
    const rect = displayCanvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, displayCanvasRef.current.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, displayCanvasRef.current.height));
    
    setCropArea({
      x: Math.min(cropStart.x, x),
      y: Math.min(cropStart.y, y),
      width: Math.abs(x - cropStart.x),
      height: Math.abs(y - cropStart.y)
    });
  };
  
  const handleCropMouseUp = () => {
    setCropStart(null);
  };
  
  const applyCrop = () => {
    if (!canvas || !cropArea || !displayCanvasRef.current) return;
    
    // Calculate scale
    const scaleX = canvas.width / displayCanvasRef.current.width;
    const scaleY = canvas.height / displayCanvasRef.current.height;
    
    const actualCropArea = {
      x: Math.round(cropArea.x * scaleX),
      y: Math.round(cropArea.y * scaleY),
      width: Math.round(cropArea.width * scaleX),
      height: Math.round(cropArea.height * scaleY)
    };
    
    const croppedCanvas = cropImage(canvas, actualCropArea);
    setCanvas(croppedCanvas);
    setIsCropping(false);
    setCropArea(null);
  };
  
  // Handle export
  const handleExport = async () => {
    if (!canvas) return;
    
    setIsProcessing(true);
    try {
      // Create a working canvas with all adjustments applied
      let workingCanvas = document.createElement('canvas');
      workingCanvas.width = canvas.width;
      workingCanvas.height = canvas.height;
      const ctx = workingCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, 0);
      
      // Apply all current adjustments
      if (rotation !== 0) workingCanvas = rotateImage(workingCanvas, rotation);
      if (flipH) workingCanvas = flipImage(workingCanvas, true);
      if (flipV) workingCanvas = flipImage(workingCanvas, false);
      
      const workingCtx = workingCanvas.getContext('2d')!;
      let imageData = workingCtx.getImageData(0, 0, workingCanvas.width, workingCanvas.height);
      
      if (activeFilter !== 'none') {
        imageData = filterPresets[activeFilter].apply(workingCtx, imageData);
      }
      if (adjustments.brightness !== 0) imageData = adjustBrightness(imageData, adjustments.brightness);
      if (adjustments.contrast !== 0) imageData = adjustContrast(imageData, adjustments.contrast);
      if (adjustments.saturation !== 0) imageData = adjustSaturation(imageData, adjustments.saturation);
      if (adjustments.temperature !== 0) imageData = adjustTemperature(imageData, adjustments.temperature);
      if (adjustments.noise > 0) imageData = addNoise(imageData, adjustments.noise);
      if (adjustments.clarity > 0) imageData = improveClarity(imageData, adjustments.clarity);
      
      workingCtx.putImageData(imageData, 0, 0);
      
      if (adjustments.blur > 0) {
        const blurredData = applyBlur(workingCtx.getImageData(0, 0, workingCanvas.width, workingCanvas.height), adjustments.blur);
        workingCtx.putImageData(blurredData, 0, 0);
      }
      if (adjustments.sharpen > 0) {
        const sharpenedData = applySharpen(workingCtx.getImageData(0, 0, workingCanvas.width, workingCanvas.height), adjustments.sharpen);
        workingCtx.putImageData(sharpenedData, 0, 0);
      }
      
      const blob = await exportImage(workingCanvas, exportFormat, exportQuality / 100);
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-image.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Reset adjustments
  const resetAdjustments = () => {
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      blur: 0,
      sharpen: 0,
      noise: 0,
      clarity: 0
    });
    setActiveFilter('none');
  };
  
  // Reset transform
  const resetTransform = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };
  
  // Clear image
  const clearImage = () => {
    setOriginalImage(null);
    setCanvas(null);
    resetAdjustments();
    resetTransform();
    setCropArea(null);
    setIsCropping(false);
  };
  
  // Slider component
  const Slider = ({ 
    label, 
    value, 
    onChange, 
    min = -100, 
    max = 100, 
    icon: Icon,
    unit = ''
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void; 
    min?: number; 
    max?: number;
    icon?: React.ElementType;
    unit?: string;
  }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm text-gray-500 min-w-[60px] text-right">
          {value > 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      />
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <FiAperture className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ImageCraft</h1>
              <p className="text-xs text-gray-500">Online Image Editor</p>
            </div>
          </div>
          
          {canvas && (
            <div className="flex items-center gap-3">
              <button
                onClick={clearImage}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <FiTrash2 className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={handleExport}
                disabled={isProcessing}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FiDownload className="w-4 h-4" />
                Export
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto p-4 flex gap-4" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Left Sidebar - Tools */}
        {canvas && (
          <div className="w-80 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              {[
                { id: 'adjust', label: 'Adjust', icon: FiSliders },
                { id: 'filters', label: 'Filters', icon: FiLayers },
                { id: 'enhance', label: 'Enhance', icon: FiZap },
                { id: 'transform', label: 'Transform', icon: FiMove }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex-1 px-3 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                    activeTab === tab.id 
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'adjust' && (
                <div className="animate-fade-in">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Basic Adjustments</h3>
                  <Slider label="Brightness" value={adjustments.brightness} onChange={(v) => setAdjustments(a => ({ ...a, brightness: v }))} icon={FiSun} />
                  <Slider label="Contrast" value={adjustments.contrast} onChange={(v) => setAdjustments(a => ({ ...a, contrast: v }))} icon={FiSliders} />
                  <Slider label="Saturation" value={adjustments.saturation} onChange={(v) => setAdjustments(a => ({ ...a, saturation: v }))} icon={FiDroplet} />
                  <Slider label="Temperature" value={adjustments.temperature} onChange={(v) => setAdjustments(a => ({ ...a, temperature: v }))} icon={FiThermometer} />
                  
                  <button
                    onClick={resetAdjustments}
                    className="w-full mt-4 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              )}
              
              {activeTab === 'filters' && (
                <div className="animate-fade-in">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Filter Presets</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(filterPresets).map(([key, filter]) => (
                      <button
                        key={key}
                        onClick={() => setActiveFilter(key)}
                        className={`px-3 py-3 text-sm rounded-lg border-2 transition-all ${
                          activeFilter === key
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {filter.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'enhance' && (
                <div className="animate-fade-in">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Enhancement Tools</h3>
                  <Slider label="Blur" value={adjustments.blur} onChange={(v) => setAdjustments(a => ({ ...a, blur: v }))} min={0} max={20} icon={FiCircle} unit="px" />
                  <Slider label="Sharpen" value={adjustments.sharpen} onChange={(v) => setAdjustments(a => ({ ...a, sharpen: v }))} min={0} max={100} icon={FiZap} />
                  <Slider label="Noise" value={adjustments.noise} onChange={(v) => setAdjustments(a => ({ ...a, noise: v }))} min={0} max={100} icon={FiAperture} />
                  <Slider label="Clarity" value={adjustments.clarity} onChange={(v) => setAdjustments(a => ({ ...a, clarity: v }))} min={0} max={100} icon={FiCircle} />
                </div>
              )}
              
              {activeTab === 'transform' && (
                <div className="animate-fade-in">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Transform Tools</h3>
                  
                  {/* Rotation */}
                  <div className="mb-6">
                    <label className="text-sm text-gray-600 mb-2 block">Rotation</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRotation(r => r - 90)}
                        className="flex-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiRotateCcw className="w-4 h-4" />
                        -90°
                      </button>
                      <button
                        onClick={() => setRotation(r => r + 90)}
                        className="flex-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiRotateCw className="w-4 h-4" />
                        +90°
                      </button>
                    </div>
                    <div className="text-center text-sm text-gray-500 mt-2">{rotation}°</div>
                  </div>
                  
                  {/* Flip */}
                  <div className="mb-6">
                    <label className="text-sm text-gray-600 mb-2 block">Flip</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFlipH(!flipH)}
                        className={`flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          flipH ? 'bg-primary-100 text-primary-700 border-2 border-primary-500' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <FiRefreshCw className="w-4 h-4" style={{ transform: 'rotate(90deg)' }} />
                        Horizontal
                      </button>
                      <button
                        onClick={() => setFlipV(!flipV)}
                        className={`flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          flipV ? 'bg-primary-100 text-primary-700 border-2 border-primary-500' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <FiRefreshCw className="w-4 h-4" />
                        Vertical
                      </button>
                    </div>
                  </div>
                  
                  {/* Crop */}
                  <div className="mb-6">
                    <label className="text-sm text-gray-600 mb-2 block">Crop</label>
                    {!isCropping ? (
                      <button
                        onClick={() => setIsCropping(true)}
                        className="w-full px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiCrop className="w-4 h-4" />
                        Start Cropping
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={applyCrop}
                          disabled={!cropArea || cropArea.width < 10 || cropArea.height < 10}
                          className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <FiCheck className="w-4 h-4" />
                          Apply
                        </button>
                        <button
                          onClick={() => { setIsCropping(false); setCropArea(null); }}
                          className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <FiX className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={resetTransform}
                    className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reset Transform
                  </button>
                </div>
              )}
            </div>
            
            {/* Export Options */}
            <div className="border-t border-slate-200 p-4 bg-slate-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Export Options</h3>
              <div className="flex gap-2 mb-3">
                {(['jpeg', 'png', 'webp'] as const).map(format => (
                  <button
                    key={format}
                    onClick={() => setExportFormat(format)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      exportFormat === format
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
              {exportFormat !== 'png' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Quality:</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={exportQuality}
                    onChange={(e) => setExportQuality(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8">{exportQuality}%</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Main Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden flex items-center justify-center relative"
        >
          {!canvas ? (
            <div
              {...getRootProps()}
              className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragActive ? 'bg-primary-50' : 'hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FiUpload className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragActive ? 'Drop your image here' : 'Drag & drop an image'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <p className="text-xs text-gray-400">Supports: JPEG, PNG, WebP, GIF, BMP</p>
            </div>
          ) : (
            <div className="relative">
              <canvas
                ref={displayCanvasRef}
                className={`max-w-full max-h-full ${isCropping ? 'cursor-crosshair' : ''}`}
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
                onMouseLeave={handleCropMouseUp}
              />
              
              {/* Crop Overlay */}
              {isCropping && cropArea && cropArea.width > 0 && cropArea.height > 0 && (
                <div
                  className="absolute border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="border border-white/30" />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-600">Processing...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
