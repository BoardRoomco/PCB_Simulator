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
    
    // Measure text for highlight
    const metrics = ctx.measureText(this.text);
    const textWidth = metrics.width;
    const textHeight = this.fontSize;
    
    // Draw yellow highlight
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';  // Semi-transparent yellow
    ctx.fillRect(
      this.position.x - textWidth/2 - 5,  // Add padding
      this.position.y - textHeight/2 - 5,
      textWidth + 10,
      textHeight + 10
    );
    
    // Draw text
    ctx.fillStyle = theme.COLORS.base;
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