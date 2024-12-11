const W = 50;  // Match ArtWrapper's constants
const H = W;

const Silicon = {
    typeID: 'silicon', // Unique identifier for this component
    numOfVoltages: 2, // Including implicit ground (always 0V)
    numOfCurrentPaths: 1, // Number of current paths
    numOfConnectors: 1, // Number of connectors
  
    dragPoint: (minLength, maxLength) => (coords) => {
      // Dragging functionality for Silicon
      return {
        x: Math.max(minLength, Math.min(maxLength, coords.x)),
        y: coords.y,
      };
    },
  
    transform: {
      transformCanvas(ctx, props, renderFn) {
        ctx.save();
        // For the sidebar preview, we want to center it
        ctx.translate(W/2, H/2);
        renderFn();
        ctx.restore();
      },
      
      getTransformedConnectors(dragPoints) {
        // ArtWrapper expects this to transform dragPoints into connectors
        return dragPoints.map(point => ({
          x: point.x,
          y: point.y
        }));
      },
      
      transformConnector(props, connector) {
        return connector;
      }
    },
  
    getBoundingBox: (length) => ({
      x: -length / 2,
      y: -length / 2,
      width: length,
      height: length,
    }),
  
    render(ctx, props) {
      const size = { width: W * 0.6, height: H * 0.6 }; // Scale relative to canvas size
      
      // Draw a simple square for the preview
      ctx.fillStyle = 'green';
      ctx.fillRect(
        -size.width/2,
        -size.height/2,
        size.width,
        size.height
      );
    },
  
    getCurrents: (props, state) => {
      const {
        currents = [0]
      } = state;
  
      return currents;
    },
  
    renderCurrent: (props, state, renderBetween) => {
      const {
        tConnectors: [c],
        currentOffsets: [offset]
      } = props;
  
      // Positive current goes in opposite direction of drag
      renderBetween({x: 0, y: 0}, c, offset);
    }
  };
  
  export default Silicon;
  