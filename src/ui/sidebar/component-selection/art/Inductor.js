import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms.inductor,
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw semi-circles
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.arc(-scale, 0, scale/2, Math.PI, 0);
    ctx.arc(0, 0, scale/2, Math.PI, 0);
    ctx.arc(scale, 0, scale/2, Math.PI, 0);
    ctx.stroke();

    // Draw connecting wires
    ctx.beginPath();
    ctx.moveTo(-scale*2, 0);
    ctx.lineTo(-scale*1.5, 0);
    ctx.moveTo(scale*1.5, 0);
    ctx.lineTo(scale*2, 0);
    ctx.stroke();
  }
}; 