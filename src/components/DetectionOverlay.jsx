import React, { useEffect, useRef } from "react";

export const DetectionOverlay = ({ detections, videoRef }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = Date.now();

    detections.forEach((prediction) => {
      const { x, y, width, height, class: className, firstSeen } = prediction;
      
      // Calculate progress (0 to 1 over 2 seconds)
      const timeDiff = now - (firstSeen || now);
      const progress = Math.min(timeDiff / 2000, 1);
      const isVerified = progress >= 1;

      const startX = x - width / 2;
      const startY = y - height / 2;

      // Logic: White when scanning, Neon Green when verified
      const color = isVerified ? "#22c55e" : "#ffffff";
      ctx.strokeStyle = color;
      ctx.lineWidth = isVerified ? 4 : 2;
      ctx.strokeRect(startX, startY, width, height);

      // Draw Circular Progress Loader
      if (!isVerified) {
        const radius = 12;
        const centerX = startX + width - 20;
        const centerY = startY + 20;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = color;
      ctx.font = "bold 14px Inter, sans-serif";
      const text = isVerified ? `✓ ${className}` : `Scanning ${className}...`;
      ctx.fillText(text, startX, startY - 10);
    });
  }, [detections, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    />
  );
};