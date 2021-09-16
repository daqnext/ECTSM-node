/*
 * @Author: your name
 * @Date: 2021-09-13 19:26:37
 * @LastEditTime: 2021-09-16 19:46:36
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/webpack.config.js
 */

const path = require("path")
const webpack = require("webpack");
const config ={
    mode:"production",
    entry:"./src/httpclient.js",
    output:{
        filename:"httpclient-min.js",
        path:path.resolve(__dirname,"dist")
    },
  //   optimization: {
  //     minimize: false
  // },
    resolve: {
        // https://github.com/babel/babel/issues/8462
        fallback: {
          crypto: require.resolve('crypto-browserify'),
          //path: require.resolve('path-browserify'),
          //url: require.resolve('url'),
          buffer: require.resolve('buffer/'),
          //util: require.resolve('util/'),
          stream: require.resolve('stream-browserify/'),
          //vm: require.resolve('vm-browserify')
        },
        // alias: {
          
        // }
      },
      plugins: [
        //new CleanWebpackPlugin(),
        // new HtmlWebpackPlugin({
        //   template: path.join(__dirname, "../src/index.html"),
        //   filename: "index.html"
        // }),
        // new webpack.DefinePlugin({
        //   "process.env.NODE_DEBUG": JSON.stringify(false)
        //   // Buffer: JSON.stringify(require("buffer/").Buffer)
        // }),
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"]
        })
      ]
}

module.exports=config