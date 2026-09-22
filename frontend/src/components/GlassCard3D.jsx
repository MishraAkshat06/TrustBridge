import React, { useRef } from 'react';

/**
 * GlassCard3D Component
 * Applies 3D perspective tilt physics, mouse spotlight tracking,
 * and liquid specular glass aesthetics.
 */
export default function GlassCard3D({ 
  children, 
  className = '', 
  variant = 'liquid', // 'liquid' | 'transparent' | 'spotlight'
  maxTilt = 8,
  onClick,
  ...props 
}) {
  const cardRef = useRef(null);

  const handlePointerMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize from -0.5 to 0.5
    const normX = (x / rect.width) - 0.5;
    const normY = (y / rect.height) - 0.5;

    // Calculate rotation angles
    const rotateY = normX * maxTilt * 2;
    const rotateX = -normY * maxTilt * 2;

    card.style.setProperty('--rotate-x', `${rotateX.toFixed(2)}deg`);
    card.style.setProperty('--rotate-y', `${rotateY.toFixed(2)}deg`);
    card.style.setProperty('--mouse-x', `${x.toFixed(1)}px`);
    card.style.setProperty('--mouse-y', `${y.toFixed(1)}px`);
  };

  const handlePointerLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rotate-x', '0deg');
    card.style.setProperty('--rotate-y', '0deg');
  };

  const variantClass = variant === 'liquid' 
    ? 'liquid-glass spotlight-card'
    : variant === 'transparent'
    ? 'glass-transparent spotlight-card'
    : 'spotlight-card';

  return (
    <div className="perspective-stage">
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={onClick}
        className={`card-tilt-3d ${variantClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}
