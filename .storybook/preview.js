// The catalogue renders straight from the GENERATED outputs of the pipeline:
//   build/css/variables.css  -> the actual --nk-* custom properties (drive the visuals)
//   build/ts/tokens.ts       -> the typed token tree (labels + values)
// Both are produced by `npm run build:tokens`; the storybook scripts run it first.
import '../build/css/variables.css';

/** @type { import('@storybook/html').Preview } */
const preview = {
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i } },
  },
};
export default preview;
