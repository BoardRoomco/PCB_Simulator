import React from 'react';
import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms[2], // Use 2-connector transform for the art view
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw diode symbol
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(-scale, -scale/2);
    ctx.lineTo(-scale, scale/2);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(scale, -scale/2);
    ctx.lineTo(scale, scale/2);
    ctx.stroke();
  }
}; 