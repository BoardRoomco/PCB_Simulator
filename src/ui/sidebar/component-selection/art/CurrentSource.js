import transforms from '../../../diagram/render/transforms';

export default {
  transform: transforms.currentSource,
  
  render: (ctx, props) => {
    const { width = 20, height = 20 } = props;
    const scale = Math.min(width, height) / 3;
    
    // Draw circle
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.arc(0, 0, scale, 0, Math.PI * 2);
    ctx.stroke();

    // Draw arrow
    ctx.beginPath();
    const arrowWidth = scale/2;
    const arrowHead = scale/4;
    ctx.moveTo(-arrowWidth, 0);
    ctx.lineTo(arrowWidth, 0);
    ctx.moveTo(arrowWidth - arrowHead, -arrowHead);
    ctx.lineTo(arrowWidth, 0);
    ctx.lineTo(arrowWidth - arrowHead, arrowHead);
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