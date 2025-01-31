import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms.capacitor,
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw capacitor plates
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(-scale/4, -scale);
    ctx.lineTo(-scale/4, scale);
    ctx.moveTo(scale/4, -scale);
    ctx.lineTo(scale/4, scale);
    ctx.stroke();

    // Draw connecting wires
    ctx.beginPath();
    ctx.moveTo(-scale*1.5, 0);
    ctx.lineTo(-scale/4, 0);
    ctx.moveTo(scale/4, 0);
    ctx.lineTo(scale*1.5, 0);
    ctx.stroke();
  }
}; 