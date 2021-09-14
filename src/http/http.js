/*
 * @Author: your name
 * @Date: 2021-09-13 16:31:18
 * @LastEditTime: 2021-09-14 17:24:39
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/http/http.js
 */


const {aes} = require("../utils/aes")

const allowRequestTimeGapSec = 180;
const allowServerClientTimeGap = 30;

class ecthttp {

    static GenECTHeader(token, ecsKey, symmetricKey) {
        const header = {};
        if (token && token != "") {
            header["Authorization"] = token;
        }

        //ecsKey
        if (ecsKey != "") {
            header["ecs"] = ecsKey;
        }

        //time stamp
        const timeStampEncrypt = this.GenECTTimestamp(symmetricKey);
        if (timeStampEncrypt!=null) {
            header["ecttimestamp"]=timeStampEncrypt
        }

        return header;
    }

    static ECTResponse(res, data, symmetricKey) {
        //set response header timestamp
        const timeStampEncrypt = this.GenECTTimestamp(symmetricKey);
        if (timeStampEncrypt!=null) {
            res.setHeader("ecttimestamp",timeStampEncrypt)
        }

        //response data encrypt
        const sendData = this.EncryptBody(data, symmetricKey);
        if (!sendData) {
            console.error("EncryptBody error,data:",data);
            return null;
        }
        return sendData;
    }

    static GenECTTimestamp( symmetricKey) {
        const nowTime = Math.floor(Date.now() / 1000);
        const encrypted = aes.AESEncrypt(nowTime + "", symmetricKey.toString());
        if (!encrypted) {
            return null;
        }
        return encrypted;
    }

    static DecryptTimestamp(header, symmetricKey) {
        //timeStamp
        let timeS = header["Ecttimestamp"]||header["ecttimestamp"];
        if (!timeS) {
            console.error("ecttimestamp not exist");
            return null;
        }

        let timeStampBase64Str = "";
        if (typeof timeS == "string" && timeS != "") {
            timeStampBase64Str = timeS;
        } else if (typeof timeS == "object"&&timeS.length >0 &&timeS[0] != "") {
            timeStampBase64Str = timeS[0];
        }else{
            console.error("ecttimestamp error");
            return null;
        }

        const timeStamp = aes.AESDecrypt(timeStampBase64Str, symmetricKey.toString());
        if (timeStamp==null) {
            console.error("AESDecrypt ecttimestamp error");
            return null;
        }
        const sendTime = parseInt(timeStamp);
        return sendTime;
    }

    static DecryptBody(body, symmetricKey) {
        if (body==null||body=="") {
            //console.error("body not exist");
            return null;
        }
        //decrypt
        const bufDecrypted = aes.AESDecrypt(body, symmetricKey.toString());
        if (bufDecrypted == null) {
            console.error("AESDecrypt postbody error");
            return null;
        }
        return bufDecrypted;
    }

    static EncryptBody(body, symmetricKey) {
        if (body==null) {
            return null;
        }
        const data = JSON.stringify(body);
        if (!data) {
            return null;
        }

        const sendData = aes.AESEncrypt(data, symmetricKey.toString());
        if (!sendData) {
            console.error("AESEncrypt postbody error");
            return null;
        }
        return sendData;
    }
}

module.exports= {ecthttp,allowRequestTimeGapSec,allowServerClientTimeGap}