import { renderMultimeter } from '../tools/Multimeter';

export default function renderTools({ctx, theme, tools}) {
  // Save the canvas state
  ctx.save();

  // Render multimeter if it exists in tools
  if (tools && tools.multimeter) {
    renderMultimeter({
      ctx,
      theme,
      multimeter: tools.multimeter
    });
  }

  // Restore the canvas state
  ctx.restore();
} 