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

    static GenECTHeader(ecsKey, symmetricKey,token) {

        const header = {};

        if(!ecsKey||!symmetricKey){
            return null;
        }

        header["ecs"] = ecsKey;
        const timeStampEncrypt = this.GenECTTimestamp(symmetricKey);
        if (timeStampEncrypt!=null) {
            header["ecttimestamp"]=timeStampEncrypt;
        }else{
            return null;
        }

        if (token && token != "") {
            header["Authorization"] = token;
        }

        return header;
    }

    static ECTResponse(res, data, symmetricKey) {
        //set response header timestamp
        const timeStampEncrypt = this.GenECTTimestamp(symmetricKey);
        if (timeStampEncrypt!=null) {
            res.setHeader("ecttimestamp",timeStampEncrypt)
        }

        let datastr="";
        if (typeof data === 'string' || data instanceof String){
            datastr=data;
        }else{
            datastr=JSON.stringify(data)
        }

        //response data encrypt
        const sendData = this.EncryptBody(datastr, symmetricKey);
        if (!sendData) {
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
            return null;
        }

        let timeStampBase64Str = "";
        if (typeof timeS == "string" && timeS != "") {
            timeStampBase64Str = timeS;
        } else if (typeof timeS == "object"&&timeS.length >0 &&timeS[0] != "") {
            timeStampBase64Str = timeS[0];
        }else{
            return null;
        }

        const timeStamp = aes.AESDecrypt(timeStampBase64Str, symmetricKey.toString());
        if (timeStamp==null) {
            return null;
        }
        const sendTime = parseInt(timeStamp);
        return sendTime;
    }

    
    static DecryptBody(body, symmetricKey) {
        if (body==null||body=="") {
            return null;
        }
        //decrypt
        const bufDecrypted = aes.AESDecrypt(body, symmetricKey.toString());
        if (bufDecrypted == null) {
            return null;
        }
        return bufDecrypted;
    }

    //input body must be string type
    static EncryptBody(body, symmetricKey) {
        if (body==null) {
            return null;
        }
        // const data = JSON.stringify(body);
        // if (!data) {
        //     return null;
        // }

        const sendData = aes.AESEncrypt(body, symmetricKey.toString());
        if (!sendData) {
            return null;
        }
        return sendData;
    }
}

module.exports= {ecthttp,allowRequestTimeGapSec,allowServerClientTimeGap}