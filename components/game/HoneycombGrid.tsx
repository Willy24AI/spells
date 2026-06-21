// components/game/HoneycombGrid.tsx
"use client";

import React from 'react';

interface HoneycombGridProps {
  centerLetter: string;
  outerLetters: string[];
  onLetterClick: (letter: string) => void;
}

// Flat-top hexagon clip path.
const HEX_CLIP = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

// Offsets for the six outer hexagons, in multiples of the hex width (--hw).
// Geometry: horizontal step 0.80, vertical step 0.46 (diagonals) / 0.92 (top &
// bottom). These are slightly larger than a perfect tessellation so there's a
// small gap between cells — much easier to tap on a phone.
const POSITIONS: [number, number][] = [
  [0, -0.92],     // top
  [0.8, -0.46],   // upper right
  [0.8, 0.46],    // lower right
  [0, 0.92],      // bottom
  [-0.8, 0.46],   // lower left
  [-0.8, -0.46]   // upper left
];

const COLORS = [
  'bg-blue-100 hover:bg-blue-200',
  'bg-green-100 hover:bg-green-200',
  'bg-purple-100 hover:bg-purple-200',
  'bg-pink-100 hover:bg-pink-200',
  'bg-orange-100 hover:bg-orange-200',
  'bg-teal-100 hover:bg-teal-200'
];

interface HexProps {
  letter: string;
  isCenter?: boolean;
  colorClass?: string;
  onClick: () => void;
  transform: string;
}

const Hex: React.FC<HexProps> = ({ letter, isCenter, colorClass, onClick, transform }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`Letter ${letter.toUpperCase()}`}
    className={`absolute left-1/2 top-1/2 flex items-center justify-center select-none
                font-bold text-2xl sm:text-3xl text-gray-900
                transition-transform duration-100 active:scale-90
                ${isCenter ? 'bg-yellow-400 hover:bg-yellow-500' : colorClass}`}
    style={{
      width: 'var(--hw)',
      height: 'calc(var(--hw) * 0.866)',
      transform,
      clipPath: HEX_CLIP,
      WebkitClipPath: HEX_CLIP
    }}
  >
    {letter.toUpperCase()}
  </button>
);

export function HoneycombGrid({ centerLetter, outerLetters, onLetterClick }: HoneycombGridProps) {
  const handleLetterClick = (letter: string) => onLetterClick(letter.toUpperCase());

  const containerStyle = {
    // Responsive hexagon width: scales with the viewport on phones, capped on desktop.
    '--hw': 'clamp(66px, 20vw, 94px)',
    width: 'calc(var(--hw) * 2.9)',
    height: 'calc(var(--hw) * 2.9)'
  } as React.CSSProperties;

  return (
    <div className="relative mx-auto" style={containerStyle}>
      <Hex
        letter={centerLetter}
        isCenter
        onClick={() => handleLetterClick(centerLetter)}
        transform="translate(-50%, -50%)"
      />

      {outerLetters.map((letter, index) => {
        const [fx, fy] = POSITIONS[index] ?? [0, 0];
        return (
          <Hex
            key={index}
            letter={letter}
            colorClass={COLORS[index % COLORS.length]}
            onClick={() => handleLetterClick(letter)}
            transform={`translate(calc(-50% + var(--hw) * ${fx}), calc(-50% + var(--hw) * ${fy}))`}
          />
        );
      })}
    </div>
  );
}
