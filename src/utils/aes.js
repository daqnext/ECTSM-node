/*
 * @Author: your name
 * @Date: 2021-09-12 19:30:27
 * @LastEditTime: 2021-09-13 19:41:37
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/utils/aes.js
 */
const crypto = require("crypto-browserify")
var aes={} 

aes.AESEncrypt=function(data, key) {
    try {
        let a = JSON.stringify(data);
        const iv = key;
        const cipherChunks = [];
        const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
        cipher.setAutoPadding(true);
        cipherChunks.push(cipher.update(a, "utf8", "base64"));
        cipherChunks.push(cipher.final("base64"));
        return cipherChunks.join("");
    } catch (error) {
        console.error(error);
        return null;
    }
}

aes.AESDecrypt=function(crypted, key) {
    try {
        if (!crypted) {
            return "";
        }
        const iv = key;
        const cipherChunks = [];
        const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
        decipher.setAutoPadding(true);
        cipherChunks.push(decipher.update(crypted, "base64", "utf8"));
        cipherChunks.push(decipher.final("utf8"));
        return cipherChunks.join("");
    } catch (error) {
        console.error(error);
        return null;
    }
}


module.exports= {aes}