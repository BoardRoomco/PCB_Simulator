import React from 'react';

export default function Multimeter() {
  return (
    <g transform="translate(0,0)">
      <circle cx="10" cy="10" r="8" stroke="black" strokeWidth="2" fill="none"/>
      <text x="6" y="14" fontSize="10">V</text>
      <line x1="2" y1="18" x2="18" y2="2" stroke="red" strokeWidth="2"/>
    </g>
  );
} 