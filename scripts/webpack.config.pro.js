const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, '..', 'dist'),
    filename: 'showcase.js',
    library: 'Showcase',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
  module: {
    rules: [
      { test: /\.glsl$/, use: 'raw-loader' },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          // options: {
          //   presets: ['@babel/preset-env'],
          // },
        },
      },
    ],
  },
};
