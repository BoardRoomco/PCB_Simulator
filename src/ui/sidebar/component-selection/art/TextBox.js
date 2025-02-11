import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms[1], // Use single connector transform for the art view
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw text box icon
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.rect(-scale, -scale/2, scale*2, scale);
    ctx.stroke();

    // Draw text lines to represent content
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.moveTo(-scale*0.8, -scale*0.2);
    ctx.lineTo(scale*0.8, -scale*0.2);
    ctx.moveTo(-scale*0.8, scale*0.2);
    ctx.lineTo(scale*0.8, scale*0.2);
    ctx.stroke();
  }
}; 