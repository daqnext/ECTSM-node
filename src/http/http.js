/*
 * @Author: your name
 * @Date: 2021-09-13 16:31:18
 * @LastEditTime: 2021-09-17 14:56:42
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/http/http.js
 */

const {aes} =require("../utils/aes")

const allowRequestTimeGapSec = 180;
const allowServerClientTimeGap = 30;

class ECTResponse{
    Rs
	DecryptedBody
	Err

    constructor(rs,decryptedBody,err){
        this.Rs=rs
        this.DecryptedBody=decryptedBody
        this.Err=err
    }

    ToString(){
        if (!this.DecryptedBody) {
            return null
        }
        return this.DecryptedBody.toString()
    }

    ToJson(){
        if (!this.DecryptedBody) {
            return null
        }
        try {
            return JSON.parse(this.DecryptedBody.toString())
        } catch (error) {
            return null
        }
    }
    
}

class ECTRequest{
    Token
    SymmetricKey
    DecryptedBody
    Err

    constructor(token,symmetricKey,decryptedBody,err){
        this.Token=token
        this.SymmetricKey=symmetricKey
        this.DecryptedBody=decryptedBody
        this.Err=err
    }

    GetToken(){
        if(!this.Token){
            return this.Token.toString();
        }
        return null;
    }

    GetSymmetricKey(){
        if(!this.SymmetricKey){
            return this.SymmetricKey.toString()
        }
        return null;
    }

    ToString(){
        if (!this.DecryptedBody) {
            return null
        }
        return this.DecryptedBody.toString()
    }

    ToJson(){
        if (!this.DecryptedBody) {
            return null
        }
        try {
            return JSON.parse(this.DecryptedBody.toString())
        } catch (error) {
            return null
        }
    }
}


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

}

module.exports = { ecthttp, allowRequestTimeGapSec, allowServerClientTimeGap ,ECTResponse,ECTRequest};
