/*
 * @Author: your name
 * @Date: 2021-09-12 19:27:27
 * @LastEditTime: 2021-09-13 16:49:58
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/index.js
 */
//const {ecc} =require('./utils/ecc.js')
const {ECTHttpServer} = require("./http/server/server")
const {ecthttp} = require("./http/http")

module.exports= {ECTHttpServer,ecthttp}
