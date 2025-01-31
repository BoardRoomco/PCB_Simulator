import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms.voltageSource,
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw circle
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.arc(0, 0, scale, 0, Math.PI * 2);
    ctx.stroke();

    // Draw plus and minus symbols
    ctx.beginPath();
    ctx.moveTo(-scale/2, 0);
    ctx.lineTo(scale/2, 0);
    ctx.moveTo(0, -scale/2);
    ctx.lineTo(0, scale/2);
    ctx.stroke();

    // Draw connecting wires
    ctx.beginPath();
    ctx.moveTo(-scale*1.5, 0);
    ctx.lineTo(-scale, 0);
    ctx.moveTo(scale, 0);
    ctx.lineTo(scale*1.5, 0);
    ctx.stroke();
  }
}; 