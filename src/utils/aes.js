/*
 * @Author: your name
 * @Date: 2021-09-12 19:30:27
 * @LastEditTime: 2021-09-16 21:28:15
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/utils/aes.js
 */
const crypto = require("crypto-browserify")
var aes={} 



aes.AESEncrypt=function(originBuf, keyBuf) {
    try {
        if (!originBuf||originBuf.length==0) {
            return null;
        }
        const key=keyBuf.toString()
        const iv = key;
        const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
        cipher.setAutoPadding(true);
        let encryptBufA=cipher.update(originBuf);
        let encryptBufB=cipher.final()
        let encryptBuf=Buffer.concat([encryptBufA,encryptBufB],encryptBufA.length+encryptBufB.length)
        return encryptBuf;
    } catch (error) {
        console.error(error.stack);
        return null;
    }
}



aes.AESDecrypt=function(cryptedBuf, keyBuf) {
    try {
        if (!cryptedBuf) {
            return null;
        }
        const key=keyBuf.toString()
        const iv = key;
        const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
        decipher.setAutoPadding(true);
        let bufA=decipher.update(cryptedBuf);
        let bufB=decipher.final()
        let buf=Buffer.concat([bufA,bufB],bufA.length+bufB.length)
        return buf;
    } catch (error) {
        console.error(error.stack);
        return null;
    }
}

module.exports= {aes}