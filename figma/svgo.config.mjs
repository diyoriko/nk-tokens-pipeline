export default { multipass: true, plugins: [
  { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
  { name: 'cleanupNumericValues', params: { floatPrecision: 2 } },
  { name: 'convertPathData', params: { floatPrecision: 2 } },
]};
