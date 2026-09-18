import React, { useRef, useState, useEffect } from 'react';

export const BoundingBoxOverlay = ({ imageSrc, defects = [], altText = "Vehicle panel" }) => {
  const imgRef = useRef(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const onImageLoad = (e) => {
    setNaturalSize({
      width: e.target.naturalWidth || 1,
      height: e.target.naturalHeight || 1
    });
  };

  // Only render defects with valid bounding box coordinates
  const validBoxDefects = defects.filter(
    (d) =>
      d.bbox_x !== null &&
      d.bbox_y !== null &&
      d.bbox_width !== null &&
      d.bbox_height !== null &&
      d.bbox_width > 0 &&
      d.bbox_height > 0
  );

  return (
    <div className="relative inline-block w-full max-w-full overflow-hidden rounded-md border border-slate-200 bg-slate-100">
      <img
        ref={imgRef}
        src={imageSrc}
        alt={altText}
        onLoad={onImageLoad}
        className="w-full h-auto object-contain block"
      />

      {/* SVG Overlay for responsive bounding boxes */}
      {naturalSize.width > 0 && validBoxDefects.length > 0 && (
        <svg
          viewBox={`0 0 ${naturalSize.width} ${naturalSize.height}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {validBoxDefects.map((defect, idx) => {
            const strokeColor = defect.severity === 'Major' 
              ? '#DC2626' 
              : defect.severity === 'Moderate' 
              ? '#EA580C' 
              : '#D97706';

            return (
              <g key={defect.id || idx}>
                {/* Bounding rectangle */}
                <rect
                  x={defect.bbox_x}
                  y={defect.bbox_y}
                  width={defect.bbox_width}
                  height={defect.bbox_height}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="4"
                  strokeDasharray={defect.severity === 'Minor' ? '6,4' : 'none'}
                />

                {/* Tag label banner */}
                <rect
                  x={defect.bbox_x}
                  y={Math.max(0, defect.bbox_y - 24)}
                  width={Math.min(defect.bbox_width, 180)}
                  height="24"
                  fill={strokeColor}
                />

                {/* Text identifier */}
                <text
                  x={defect.bbox_x + 6}
                  y={Math.max(16, defect.bbox_y - 8)}
                  fill="#FFFFFF"
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="Inter, sans-serif"
                >
                  {defect.defect_type} ({defect.severity})
                  {defect.confidence ? ` ${Math.round(defect.confidence * 100)}%` : ''}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};
