import R from 'ramda';

import renderViews from './components';
import renderConnectors from './connectors';
import renderDragPoints from './dragPoints';
import renderLabels from './labels';
import renderCurrent from './current';
import renderTools from './tools';

import {LINE_WIDTH} from '../Constants';

export const clearCanvas = ctx => {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  ctx.clearRect(0, 0, width, height);
};

export const initCanvas = (ctx, theme) => {
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = theme.COLORS.base;
  ctx.fillStyle = theme.COLORS.base;
};

export default (store, ctx, theme) => {
  const render = () => {
    const {
      views,
      tools,
      circuit: {
        components: circuitState,
        volts2RGB
      },
      componentCounters
    } = store.getState();

    clearCanvas(ctx);

    const viewsList = R.values(views);

    renderViews({ctx, theme, volts2RGB, circuitState, components: viewsList});
    renderConnectors({ctx, theme, components: viewsList});
    renderDragPoints({ctx, theme, components: viewsList});
    renderLabels({ctx, theme, components: viewsList, componentCounters});
    renderCurrent({ctx, theme, circuitState, components: viewsList});
    renderTools({ctx, theme, tools, store});
  };

  initCanvas(ctx, theme);

  return render;
};
