"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCw, Move } from "lucide-react";

interface ImageEditorProps {
  image: string;
  aspectRatio?: number;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ 
  image, 
  aspectRatio = 1, 
  onSave, 
  onCancel 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    img.onload = () => {
      imgRef.current = img;
      render();
    };
  }, [image]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const containerWidth = Math.min(canvas.parentElement?.clientWidth || 350, 400);
    const containerHeight = containerWidth / aspectRatio;
    canvas.width = containerWidth * window.devicePixelRatio;
    canvas.height = containerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, containerWidth, containerHeight);
    ctx.save();
    ctx.translate(containerWidth / 2 + offset.x, containerHeight / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const imgAspect = img.width / img.height;
    let drawWidth, drawHeight;
    if (imgAspect > aspectRatio) {
      drawHeight = containerHeight;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = containerWidth;
      drawHeight = drawWidth / imgAspect;
    }

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }, [zoom, rotation, offset, aspectRatio]);

  useEffect(() => { render(); }, [render]);

  const handleMouseDown = (e: any) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setLastPos({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setOffset(prev => ({ x: prev.x + (clientX - lastPos.x), y: prev.y + (clientY - lastPos.y) }));
    setLastPos({ x: clientX, y: clientY });
  };

  const handleExport = () => {
    const canvas = document.createElement("canvas");
    const img = imgRef.current;
    if (!img) return;
    const exportWidth = 1080;
    const exportHeight = exportWidth / aspectRatio;
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, exportWidth, exportHeight);
    ctx.save();
    const ratio = exportWidth / (canvasRef.current?.offsetWidth || 1);
    ctx.translate(exportWidth / 2 + offset.x * ratio, exportHeight / 2 + offset.y * ratio);
    ctx.rotate((rotation * Math.PI) / 180);
    const imgAspect = img.width / img.height;
    let drawWidth, drawHeight;
    if (imgAspect > aspectRatio) {
      drawHeight = exportHeight;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = exportWidth;
      drawHeight = drawWidth / imgAspect;
    }
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    canvas.toBlob(b => b && onSave(b), "image/jpeg", 0.9);
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-md bg-white dark:bg-[#0B1120] rounded-[2rem] p-5 shadow-2xl border border-gray-100 dark:border-white/5 relative z-[100]">
      <div 
        className="relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-black/20 cursor-move touch-none"
        style={{ aspectRatio }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={() => setIsDragging(false)}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <ZoomOut size={14} className="text-muted-foreground" />
          <Slider value={[zoom]} min={1} max={3} step={0.01} onValueChange={([v]) => setZoom(v)} className="flex-1" />
          <ZoomIn size={14} className="text-muted-foreground" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setRotation(r => r - 90)} className="h-9 w-9 rounded-lg"><RotateCw className="rotate-180" size={16} /></Button>
            <Button variant="outline" size="icon" onClick={() => setRotation(r => r + 90)} className="h-9 w-9 rounded-lg"><RotateCw size={16} /></Button>
            <Button variant="outline" size="icon" onClick={() => setOffset({ x: 0, y: 0 })} className="h-9 w-9 rounded-lg"><Move size={16} /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;