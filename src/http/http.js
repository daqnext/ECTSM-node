/*
 * @Author: your name
 * @Date: 2021-09-13 16:31:18
 * @LastEditTime: 2021-09-15 17:27:05
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/http/http.js
 */

const { aes } = require("../utils/aes");

const allowRequestTimeGapSec = 180;
const allowServerClientTimeGap = 30;

class ecthttp {
    //return {header,err}
    static EncryptAndSetECTMHeader(EcsKey, symmetricKey, token,res=null) {
        const header = {};
        //set the ecs key only for request to server
        if (EcsKey && EcsKey.length != 0) {
            if (res) {
                res.setHeader("ectm_key",EcsKey.toString("base64"))
            }else{
                header["ectm_key"]= EcsKey.toString("base64");
            }
            
        }

        //set the time
        const nowTimeStr = Math.floor(Date.now() / 1000) + "";
        const encrypted_time_byte = aes.AESEncrypt(Buffer.from(nowTimeStr), symmetricKey);
        if (!encrypted_time_byte) {
            return {
                header:header,
                err:"encrypt timestamp error"
            };
        }
        if (res) {
            res.setHeader("ectm_time",encrypted_time_byte.toString("base64"))
        }else{
            header["ectm_time"]=encrypted_time_byte.toString("base64");
        }
        

        //set token
        if (token && token.length != 0) {
            const encrypted_token_byte = aes.AESEncrypt(token, symmetricKey);
            if (!encrypted_token_byte) {
                return {
                    header:header,
                    err:"encrypt token error"
                };
            }
            if (res) {
                res.setHeader("ectm_token",encrypted_token_byte.toString("base64"))
            }else{
                header["ectm_token"]=encrypted_token_byte.toString("base64");
            }
        }
        return {
            header:header,
            err:null
        };
    }

    static DecryptECTMHeader(header, symmetricKey) {
        /////check time //////////
        const timeS = header["ectm_time"] || header["Ectm_time"];
        if (!timeS) {
            return {
                token: null,
                err: "timestamp not exist",
            };
        }
        let timeStampBase64Str = "";
        if (typeof timeS == "string" && timeS != "") {
            timeStampBase64Str = timeS;
        } else if (typeof timeS == "object" && timeS.length > 0 && timeS[0] != "") {
            timeStampBase64Str = timeS[0];
        } else {
            return {
                token: null,
                err: "get timestamp header exist",
            };
        }

        const timeDecrypted = aes.AESDecrypt(Buffer.from(timeStampBase64Str, "base64"), symmetricKey);
        if (timeDecrypted == null) {
            return {
                token: null,
                err: "decrypt timestamp error",
            };
        }

        const timeStamp = parseInt(timeDecrypted);
        if (timeStamp == NaN) {
            return {
                token: null,
                err: "timestamp ParseInt error",
            };
        }

        const timeGap = Math.floor(Date.now() / 1000) - timeStamp;
        if (timeGap < -allowRequestTimeGapSec || timeGap > allowRequestTimeGapSec) {
            return {
                token: null,
                err: "time Gap error",
            };
        }

        ///check token [optional]
        const tokenS = header["ectm_token"] || header["Ectm_token"];
        if (tokenS) {
            let tokenBase64Str = "";
            if (typeof tokenS == "string" && tokenS != "") {
                tokenBase64Str = tokenS;
            } else if (typeof tokenS == "object" && tokenS.length > 0 && tokenS[0] != "") {
                tokenBase64Str = tokenS[0];
            } else {
                return {
                    token: null,
                    err: "get ectm_token header error",
                };
            }
            const tokenDecrypted = aes.AESDecrypt(Buffer.from(tokenBase64Str, "base64"), symmetricKey);
            return {
                token: tokenDecrypted,
                err: null,
            };
        }

        return {
            token: null,
            err: null,
        };
    }

    static EncryptBody(dataByte, symmetricKey) {
        const encryptedByte = aes.AESEncrypt(dataByte, symmetricKey);
        if (!encryptedByte) {
            return null;
        }
        return encryptedByte;
    }

    static DecryptBody(dataByte, symmetricKey) {
        if (dataByte.length == 0) {
            return null;
        }
        const bufDecrypted = aes.AESDecrypt(dataByte, symmetricKey);
        if (!bufDecrypted) {
            return null;
        }
        return bufDecrypted;
    }

    static ECTResponse(res, symmetricKey, data) {
        const v = this.EncryptAndSetECTMHeader(null, symmetricKey, null,res);
        if (v.err!=null) {
            return {
                encryptedBody:null,
                err:"encrypt response header error"
            }
        }
        //body encrypt
        const encryptedBody = this.EncryptBody(data, symmetricKey);
        if (!encryptedBody) {
            return {
                encryptedBody:null,
                err:"encrypt response data error"
            }
        }
        return {
            encryptedBody:encryptedBody,
            err:null
        }
    }

    // static GenECTHeader(ecsKey, symmetricKey, token) {
    //     const header = {};

    //     if (!ecsKey || !symmetricKey) {
    //         return null;
    //     }

    //     header["ecs"] = ecsKey;
    //     const timeStampEncrypt = this.GenECTTimestamp(symmetricKey);
    //     if (timeStampEncrypt != null) {
    //         header["ecttimestamp"] = timeStampEncrypt;
    //     } else {
    //         return null;
    //     }

    //     if (token && token != "") {
    //         header["Authorization"] = token;
    //     }

    //     return header;
    // }

    // static ECTResponse(res, dataString, symmetricKey) {
    //     //set response header timestamp
    //     const timeStampEncrypt = this.GenECTTimestamp(symmetricKey);
    //     if (timeStampEncrypt != null) {
    //         res.setHeader("ecttimestamp", timeStampEncrypt);
    //     }

    //     //response data encrypt
    //     const sendData = this.EncryptBody(dataString, symmetricKey);
    //     if (!sendData) {
    //         return null;
    //     }
    //     return sendData;
    // }

    // static GenECTTimestamp(symmetricKey) {
    //     const nowTime = Math.floor(Date.now() / 1000);
    //     const encrypted = aes.AESEncrypt(nowTime + "", symmetricKey.toString());
    //     if (!encrypted) {
    //         return null;
    //     }
    //     return encrypted;
    // }

    // static DecryptTimestamp(header, symmetricKey) {
    //     //timeStamp
    //     let timeS = header["Ecttimestamp"] || header["ecttimestamp"];
    //     if (!timeS) {
    //         return null;
    //     }

    //     let timeStampBase64Str = "";
    //     if (typeof timeS == "string" && timeS != "") {
    //         timeStampBase64Str = timeS;
    //     } else if (typeof timeS == "object" && timeS.length > 0 && timeS[0] != "") {
    //         timeStampBase64Str = timeS[0];
    //     } else {
    //         return null;
    //     }

    //     const timeStamp = aes.AESDecrypt(timeStampBase64Str, symmetricKey.toString());
    //     if (timeStamp == null) {
    //         return null;
    //     }
    //     const sendTime = parseInt(timeStamp);
    //     return sendTime;
    // }

    // static DecryptBody(bodyStr, symmetricKey) {
    //     if (bodyStr == null || bodyStr == "") {
    //         return null;
    //     }
    //     //decrypt
    //     const bufDecrypted = aes.AESDecryptBuffer(Buffer.from(bodyStr), symmetricKey.toString());
    //     if (bufDecrypted == null) {
    //         return null;
    //     }
    //     return bufDecrypted;
    // }

    // static EncryptBody(dataString, symmetricKey) {
    //     const sendData = aes.AESEncryptBuffer(Buffer.from(dataString), symmetricKey.toString());
    //     if (!sendData) {
    //         return null;
    //     }
    //     return sendData;
    // }
}

module.exports = { ecthttp, allowRequestTimeGapSec, allowServerClientTimeGap };
