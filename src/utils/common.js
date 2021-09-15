/*
 * @Author: your name
 * @Date: 2021-09-13 16:26:06
 * @LastEditTime: 2021-09-15 14:33:51
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/utils/common.js
 */

var utils={}
utils.GenSymmetricKey=()=>{
    const len = 16;
    const chars = "1234567890abcdefghijklmnopqrstuvwxyz";
    var maxPos = chars.length;
    var str = "";
    for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return str;
}

module.exports= {utils}