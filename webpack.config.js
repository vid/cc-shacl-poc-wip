/* eslint-disable import/no-extraneous-dependencies */
const path = require('path')
const config = require('./webpack.inc')

module.exports = (env, { mode }) => config({
  input: path.resolve(__dirname, './index.html'),
  output: path.resolve(__dirname, './dist/playground'),
  publicPath: mode === '' ? 'playground' : '',
})
