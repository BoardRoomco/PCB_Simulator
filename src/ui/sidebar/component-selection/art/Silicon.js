import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms[1], // Use single connector transform for the art view
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw silicon board icon
    ctx.beginPath();
    ctx.strokeStyle = '#006633';
    ctx.fillStyle = '#006633';
    
    // Draw a simplified silicon board shape
    ctx.rect(-scale * 1.2, -scale * 1.5, scale * 2.4, scale * 3);
    ctx.fill();
    ctx.stroke();

    // Add some circuit pattern details
    ctx.beginPath();
    ctx.strokeStyle = '#90EE90';
    ctx.lineWidth = 0.5;
    
    // Draw some lines to represent circuit traces
    ctx.moveTo(-scale, -scale);
    ctx.lineTo(scale, -scale);
    ctx.moveTo(-scale, 0);
    ctx.lineTo(scale, 0);
    ctx.moveTo(-scale, scale);
    ctx.lineTo(scale, scale);
    
    // Draw some vertical connections
    ctx.moveTo(0, -scale);
    ctx.lineTo(0, scale);
    ctx.moveTo(-scale/2, -scale);
    ctx.lineTo(-scale/2, scale);
    ctx.moveTo(scale/2, -scale);
    ctx.lineTo(scale/2, scale);
    
    ctx.stroke();
  }
}; 