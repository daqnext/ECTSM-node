/*
 * @Author: your name
 * @Date: 2021-09-12 19:30:27
 * @LastEditTime: 2021-09-15 16:59:20
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/utils/aes.js
 */
const crypto = require("crypto")
var aes={} 

// aes.AESEncrypt=function(data, key) {
//     try {
//         const iv = key;
//         const cipherChunks = [];
//         const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
//         cipher.setAutoPadding(true);
//         cipherChunks.push(cipher.update(data, "utf8", "base64"));
//         cipherChunks.push(cipher.final("base64"));
//         return cipherChunks.join("")
//     } catch (error) {
//         console.error(error);
//         return null;
//     }
// }

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
        console.error(error);
        return null;
    }
}

// aes.AESDecrypt=function(crypted, key) {
//     try {
//         if (!crypted) {
//             return "";
//         }
//         const iv = key;
//         const cipherChunks = [];
//         const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
//         decipher.setAutoPadding(true);
//         cipherChunks.push(decipher.update(crypted, "base64", "utf8"));
//         cipherChunks.push(decipher.final("utf8"));
//         return cipherChunks.join("")
//     } catch (error) {
//         console.error(error);
//         return null;
//     }
// }

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
        console.error(error);
        return null;
    }
}

module.exports= {aes}