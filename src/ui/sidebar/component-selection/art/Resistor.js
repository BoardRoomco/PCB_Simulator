import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms.resistor,
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw resistor box
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.rect(-scale, -scale/2, scale*2, scale);
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