import Vector from 'immutable-vector2d';

export class TextAnnotation {
  constructor(text = 'Text', position = new Vector(0, 0), fontSize = 24) {
    this.text = text;
    this.position = position;
    this.fontSize = fontSize;
    this.id = Math.random().toString(36).substr(2, 9);
    this.isDragging = false;
  }

  render(ctx, theme) {
    ctx.save();
    
    // Set font
    ctx.font = `${this.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate text dimensions
    const textWidth = ctx.measureText(this.text).width;
    const textHeight = this.fontSize;
    const padding = 10;  // Padding around text
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';  // Translucent black
    ctx.fillRect(
      this.position.x - (textWidth/2 + padding),
      this.position.y - (textHeight/2 + padding/2),
      textWidth + padding * 2,
      textHeight + padding
    );
    
    // Draw text
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.fillText(this.text, this.position.x, this.position.y);
    
    ctx.restore();
  }

  containsPoint(point) {
    // Simple hit detection - create a rectangle around the text
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${this.fontSize}px Arial`;
    const width = ctx.measureText(this.text).width;
    const height = this.fontSize;
    
    // Add padding to hit detection area
    const padding = 5;
    return Math.abs(point.x - this.position.x) < (width / 2 + padding) &&
           Math.abs(point.y - this.position.y) < (height / 2 + padding);
  }

  move(newPosition) {
    this.position = newPosition;
  }

  setText(newText) {
    this.text = newText;
  }

  setFontSize(newSize) {
    this.fontSize = newSize;
  }
} 