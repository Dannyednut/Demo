import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SentimentData } from "@shared/schema";

export function SentimentChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { data: sentimentHistory = [] } = useQuery<SentimentData[]>({
    queryKey: ['/api/sentiment/history'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sentimentHistory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    if (sentimentHistory.length < 2) return;

    // Prepare data
    const maxPoints = 24;
    const data = sentimentHistory.slice(-maxPoints);
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = padding + (chartWidth / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw sentiment line
    ctx.strokeStyle = '#06FFA5';
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - (point.marketSentiment * chartHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw fill area
    ctx.fillStyle = 'rgba(6, 255, 165, 0.1)';
    ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - (point.marketSentiment * chartHeight);
      
      if (index === 0) {
        ctx.moveTo(x, height - padding);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(padding + chartWidth, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw data points
    ctx.fillStyle = '#06FFA5';
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - (point.marketSentiment * chartHeight);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // White border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw Y-axis labels
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      const value = (100 - (i * 25));
      ctx.fillText(`${value}%`, padding - 10, y);
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const labelCount = Math.min(6, data.length);
    for (let i = 0; i < labelCount; i++) {
      const dataIndex = Math.floor((data.length - 1) * (i / (labelCount - 1)));
      const point = data[dataIndex];
      const x = padding + (chartWidth / (labelCount - 1)) * i;
      
      if (point.timestamp) {
        const time = new Date(point.timestamp).getHours() + ':00';
        ctx.fillText(time, x, height - padding + 10);
      }
    }

  }, [sentimentHistory]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
