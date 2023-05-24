const path = require('path');

module.exports = {
  entry: './public/global-js-animations',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/dist'),
  },
  mode: 'development',
};
