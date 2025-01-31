import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms.ground,
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw ground symbol
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(0, -scale);
    ctx.lineTo(0, 0);
    ctx.moveTo(-scale, 0);
    ctx.lineTo(scale, 0);
    ctx.moveTo(-scale/2, scale/2);
    ctx.lineTo(scale/2, scale/2);
    ctx.moveTo(-scale/4, scale);
    ctx.lineTo(scale/4, scale);
    ctx.stroke();
  }
}; 