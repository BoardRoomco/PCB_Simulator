import React from 'react';
import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms[2], // Use 2-connector transform for the art view
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw op-amp triangle symbol
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(-scale, -scale);
    ctx.lineTo(-scale, scale);
    ctx.lineTo(scale, 0);
    ctx.closePath();
    ctx.stroke();
    
    // Draw + and - symbols
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'start';
    ctx.fillText('+', -scale + 2, -scale/2 + 4);
    ctx.fillText('−', -scale + 2, scale/2 + 4);
  }
}; 