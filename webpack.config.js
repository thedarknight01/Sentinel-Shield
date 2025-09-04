const path = require('path');

module.exports = {
  mode: 'production', // or 'development' for debugging
  entry: {
    popup: './popup/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'popup'),
    filename: 'popup.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ '@babel/preset-env', '@babel/preset-react' ]
          }
        }
      },
      {
        test: /\.css$/i,
        use: [ 'style-loader', 'css-loader' ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
