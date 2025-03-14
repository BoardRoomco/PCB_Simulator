import { TextAnnotation } from './TextAnnotation';
import Vector from 'immutable-vector2d';

export class AnnotationManager {
  constructor() {
    this.annotations = new Map();
    this.selectedAnnotation = null;
    this.lastClickTime = 0;
  }

  addTextAnnotation(position) {
    const text = prompt('Enter text:', 'Text');
    if (text === null) return null; // User cancelled
    
    const annotation = new TextAnnotation(text, Vector.fromObject(position));
    this.annotations.set(annotation.id, annotation);
    return annotation.id;
  }

  removeAnnotation(id) {
    this.annotations.delete(id);
    if (this.selectedAnnotation === id) {
      this.selectedAnnotation = null;
    }
  }

  render(ctx, theme) {
    for (const annotation of this.annotations.values()) {
      annotation.render(ctx, theme);
    }
  }

  handleMouseDown(position) {
    const point = Vector.fromObject(position);
    const now = Date.now();
    
    for (const [id, annotation] of this.annotations) {
      if (annotation.containsPoint(point)) {
        this.selectedAnnotation = id;
        
        // Check for double click (within 300ms)
        if (now - this.lastClickTime < 300) {
          // Show prompt to edit text
          const newText = prompt('Edit text:', annotation.text);
          if (newText !== null) {
            annotation.setText(newText);
          }
          return true;
        }
        
        this.lastClickTime = now;
        annotation.isDragging = true;
        return true;
      }
    }
    return false;
  }

  handleMouseMove(position) {
    if (this.selectedAnnotation && this.annotations.get(this.selectedAnnotation).isDragging) {
      this.annotations.get(this.selectedAnnotation).move(Vector.fromObject(position));
      return true;
    }
    return false;
  }

  handleMouseUp() {
    if (this.selectedAnnotation) {
      this.annotations.get(this.selectedAnnotation).isDragging = false;
    }
  }

  getSelectedAnnotation() {
    return this.selectedAnnotation ? this.annotations.get(this.selectedAnnotation) : null;
  }

  updateSelectedAnnotation(text, fontSize) {
    const annotation = this.getSelectedAnnotation();
    if (annotation) {
      if (text !== undefined) annotation.setText(text);
      if (fontSize !== undefined) annotation.setFontSize(fontSize);
    }
  }

  // New method to get annotations for saving
  getAnnotationsForSave() {
    const annotationsArray = [];
    for (const annotation of this.annotations.values()) {
      annotationsArray.push({
        id: annotation.id,
        text: annotation.text,
        position: {
          x: annotation.position.x || annotation.position.get('x'),
          y: annotation.position.y || annotation.position.get('y')
        },
        fontSize: annotation.fontSize || 24
      });
    }
    return annotationsArray;
  }

  // New method to load annotations
  loadAnnotations(annotationsData) {
    // Clear existing annotations
    this.annotations.clear();
    this.selectedAnnotation = null;

    if (!annotationsData || !Array.isArray(annotationsData)) return;

    // Load each annotation
    for (const data of annotationsData) {
      const position = Vector.fromObject(data.position);
      const annotation = new TextAnnotation(data.text, position);
      annotation.id = data.id;
      if (data.fontSize) annotation.fontSize = data.fontSize;
      this.annotations.set(annotation.id, annotation);
    }
  }
} 