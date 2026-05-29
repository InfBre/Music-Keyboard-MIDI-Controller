import React, { useRef, useEffect, useState } from 'react';

interface KnobProps {
  key?: string;
  id: string;
  name: string;
  value: number; // 0.0 to 1.0 (gain volume)
  isActive: boolean;
  color: string; // Hex color or styling string
  glowColor: string; // RGBA shadow string
  onValueChange: (val: number) => void;
  onToggleActive: () => void;
}

export default function Knob({
  id,
  name,
  value,
  isActive,
  color,
  glowColor,
  onValueChange,
  onToggleActive,
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartValue = useRef(0);
  const hasMoved = useRef(false);

  // Degrees of rotation: -135deg (min volume) to 135deg (max volume)
  const angle = (value * 270) - 135;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartValue.current = value;
    hasMoved.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      setIsDragging(true);
      dragStartY.current = e.touches[0].clientY;
      dragStartValue.current = value;
      hasMoved.current = false;
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = dragStartY.current - e.clientY; // Up = positive
      if (Math.abs(deltaY) > 3) {
        hasMoved.current = true;
      }
      const sensitivity = 0.005; // Adjust drag speed
      const newValue = Math.min(Math.max(dragStartValue.current + deltaY * sensitivity, 0.0), 1.0);
      onValueChange(newValue);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      
      const deltaY = dragStartY.current - e.touches[0].clientY; // Up = positive
      if (Math.abs(deltaY) > 3) {
        hasMoved.current = true;
      }
      const sensitivity = 0.005; // Adjust drag speed
      const newValue = Math.min(Math.max(dragStartValue.current + deltaY * sensitivity, 0.0), 1.0);
      onValueChange(newValue);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        if (!hasMoved.current) {
          onToggleActive();
        }
      }
    };

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        if (!hasMoved.current) {
          onToggleActive();
        }
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, onValueChange, onToggleActive]);

  // SVG parameters for the volume arc ring
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  // Arc only goes 270 degrees (3/4 of a circle)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = circumference - (value * arcLength);

  return (
    <div className="flex flex-col items-center select-none group w-full max-w-[130px]">
      <div className="relative w-28 h-28 flex items-center justify-center">
        
        {/* Glow Halo behind the knob when Active (Matches look in the reference image) */}
        <div 
          className="absolute inset-1 rounded-full transition-all duration-300"
          style={{
            background: isActive ? `radial-gradient(circle, ${color}33 0%, ${color}00 70%)` : 'transparent',
            boxShadow: isActive ? `0 0 45px 15px ${glowColor}` : 'none',
            transform: isActive ? 'scale(1.15)' : 'scale(0.95)',
            opacity: isActive ? 1 : 0,
            zIndex: 1,
          }}
        />

        {/* Rotary Progress Arc Circle (SVG) */}
        <svg 
          className="absolute inset-0 w-full h-full -rotate-225" // Rotating start of arc
          viewBox="0 0 100 100"
          style={{ zIndex: 2 }}
        >
          {/* Track under-ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#262626"
            strokeWidth="3.5"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active styled progress ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={isActive ? color : '#525252'}
            strokeWidth={isActive ? "4.5" : "3.5"}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-colors duration-200"
            style={{
              filter: isActive ? `drop-shadow(0 0 3px ${color})` : 'none',
            }}
          />
        </svg>

        {/* Center tactile plastic button */}
        <div 
          ref={knobRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`absolute w-16 h-16 rounded-full cursor-ns-resize flex items-center justify-center transition-all duration-200 ${
            isActive 
              ? 'bg-gradient-to-tr from-neutral-200 to-white shadow-lg border border-white/40' 
              : 'bg-gradient-to-tr from-neutral-700 to-neutral-500 shadow-md border border-neutral-600'
          }`}
          style={{ zIndex: 3 }}
          title="Drag up/down to adjust, click to toggle"
        >
          {/* Inner bezel lines */}
          <div className="absolute inset-1.5 rounded-full border border-neutral-400/20 shadow-inner" />

          {/* Indicator Dot (Rotates based on volume value) */}
          <div 
            className="absolute top-1.5 w-1.5 h-1.5 rounded-full transition-transform duration-75"
            style={{
              backgroundColor: isActive ? '#000000' : '#ffffff',
              transform: `rotate(${angle}deg)`,
              transformOrigin: '50% 30px', // Anchor rotation around the center
            }}
          />
        </div>
        
      </div>

      {/* Label Box (Exact Styling in Style Image) */}
      <span 
        onClick={onToggleActive}
        className={`mt-2.5 px-3 py-1 rounded-md text-[11px] font-mono tracking-wide font-black uppercase text-center select-none transition-all cursor-pointer ${
          isActive 
            ? 'bg-neutral-900 border border-neutral-800 text-white shadow-md' 
            : 'bg-neutral-950 border border-neutral-900/60 text-neutral-500 hover:text-neutral-300'
        }`}
        style={{
          boxShadow: isActive ? `inset 0 0 10px ${color}1a` : 'none'
        }}
      >
        {name}
      </span>
      
      {/* Volume Percentage Indicator */}
      <span className="text-[9px] font-mono mt-1 text-neutral-600 font-bold">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
