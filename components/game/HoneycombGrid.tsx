import React from 'react';

interface HexagonCellProps {
  letter: string;
  isCenter: boolean;
  onClick: () => void;
  colorClass?: string;
}

interface HoneycombGridProps {
  centerLetter: string;
  outerLetters: string[];
  onLetterClick: (letter: string) => void;
}

const HexagonCell: React.FC<HexagonCellProps> = ({ letter, isCenter, onClick, colorClass }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-28 h-28
        flex items-center justify-center
        text-4xl font-bold
        rounded-2xl
        shadow-lg
        transition-all duration-200
        ${isCenter 
          ? 'bg-yellow-400 hover:bg-yellow-500 text-black' 
          : colorClass || 'bg-gray-100 hover:bg-gray-200 text-black'}
      `}
    >
      {letter}
    </button>
  );
};

const HoneycombGrid: React.FC<HoneycombGridProps> = ({ centerLetter, outerLetters, onLetterClick }) => {
  const positions = [
    { top: -100, left: 0 },     // Top
    { top: -50, left: 85 },     // Top Right
    { top: 50, left: 85 },      // Bottom Right
    { top: 100, left: 0 },      // Bottom
    { top: 50, left: -85 },     // Bottom Left
    { top: -50, left: -85 }     // Top Left
  ];

  const colors = [
    'bg-blue-100 hover:bg-blue-200',
    'bg-green-100 hover:bg-green-200',
    'bg-purple-100 hover:bg-purple-200',
    'bg-pink-100 hover:bg-pink-200',
    'bg-orange-100 hover:bg-orange-200',
    'bg-teal-100 hover:bg-teal-200'
  ];

  return (
    <div className="relative w-96 h-96 mx-auto">  
      {/* Center letter */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <HexagonCell
          letter={centerLetter}
          isCenter={true}
          onClick={() => onLetterClick(centerLetter)}
        />
      </div>

      {/* Outer letters */}
      {outerLetters.map((letter, index) => (
        <div
          key={letter}
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(calc(-50% + ${positions[index].left}px), calc(-50% + ${positions[index].top}px))`
          }}
        >
          <HexagonCell
            letter={letter}
            isCenter={false}
            onClick={() => onLetterClick(letter)}
            colorClass={colors[index]}
          />
        </div>
      ))}
    </div>
  );
};

export default HoneycombGrid;