import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms.wire,
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw wire
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(-scale, 0);
    ctx.lineTo(scale, 0);
    ctx.stroke();
  }
}; 