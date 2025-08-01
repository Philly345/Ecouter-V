import React from 'react';

export default function Logo({ size = 40, className = "" }) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 200 200" 
        className="flex-shrink-0"
      >
        <defs>
          <radialGradient id="meshGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{stopColor:"#ffffff", stopOpacity:0.9}}/>
            <stop offset="70%" style={{stopColor:"#ffffff", stopOpacity:0.6}}/>
            <stop offset="100%" style={{stopColor:"#ffffff", stopOpacity:0.2}}/>
          </radialGradient>
        </defs>
        
        {/* Outer ring */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="url(#meshGradient)" strokeWidth="2" opacity="0.8"/>
        
        {/* Wave patterns */}
        <path d="M 20 100 Q 50 80 80 100 T 140 100 T 180 100" fill="none" stroke="url(#meshGradient)" strokeWidth="1.5" opacity="0.7"/>
        <path d="M 20 110 Q 50 90 80 110 T 140 110 T 180 110" fill="none" stroke="url(#meshGradient)" strokeWidth="1.5" opacity="0.6"/>
        <path d="M 20 90 Q 50 70 80 90 T 140 90 T 180 90" fill="none" stroke="url(#meshGradient)" strokeWidth="1.5" opacity="0.6"/>
        
        {/* Vertical waves */}
        <path d="M 100 20 Q 120 50 100 80 T 100 140 T 100 180" fill="none" stroke="url(#meshGradient)" strokeWidth="1.5" opacity="0.7"/>
        <path d="M 90 20 Q 110 50 90 80 T 90 140 T 90 180" fill="none" stroke="url(#meshGradient)" strokeWidth="1.5" opacity="0.6"/>
        <path d="M 110 20 Q 130 50 110 80 T 110 140 T 110 180" fill="none" stroke="url(#meshGradient)" strokeWidth="1.5" opacity="0.6"/>
        
        {/* Diagonal waves */}
        <path d="M 30 30 Q 60 50 90 70 T 150 110 T 170 170" fill="none" stroke="url(#meshGradient)" strokeWidth="1.5" opacity="0.5"/>
        <path d="M 170 30 Q 140 50 110 70 T 50 110 T 30 170" fill="none" stroke="url(#meshGradient)" strokeWidth="1.5" opacity="0.5"/>
        
        {/* Inner mesh pattern */}
        <circle cx="100" cy="100" r="60" fill="none" stroke="url(#meshGradient)" strokeWidth="1" opacity="0.4"/>
        <circle cx="100" cy="100" r="40" fill="none" stroke="url(#meshGradient)" strokeWidth="1" opacity="0.3"/>
        <circle cx="100" cy="100" r="20" fill="none" stroke="url(#meshGradient)" strokeWidth="1" opacity="0.2"/>
        
        {/* Particle dots */}
        <circle cx="70" cy="70" r="1.5" fill="url(#meshGradient)" opacity="0.8"/>
        <circle cx="130" cy="70" r="1.5" fill="url(#meshGradient)" opacity="0.8"/>
        <circle cx="70" cy="130" r="1.5" fill="url(#meshGradient)" opacity="0.8"/>
        <circle cx="130" cy="130" r="1.5" fill="url(#meshGradient)" opacity="0.8"/>
        <circle cx="100" cy="50" r="1" fill="url(#meshGradient)" opacity="0.6"/>
        <circle cx="100" cy="150" r="1" fill="url(#meshGradient)" opacity="0.6"/>
        <circle cx="50" cy="100" r="1" fill="url(#meshGradient)" opacity="0.6"/>
        <circle cx="150" cy="100" r="1" fill="url(#meshGradient)" opacity="0.6"/>
      </svg>
    </div>
  );
}
