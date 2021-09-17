/*
 * @Author: your name
 * @Date: 2021-09-12 19:49:52
 * @LastEditTime: 2021-09-17 14:41:28
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECT-http-node/src/server/server.ts
 */

const {ecc} =require("../../utils/ecc")
const NodeCache =require("node-cache")
const { ecthttp, ECTRequest } =require("../http");

class ECTHttpServer {
    PrivateKey;
    Cache;

    constructor(privateKeyBase64Str) {
        const privkey = ecc.StrBase64ToPrivateKey(privateKeyBase64Str);
        if (!privkey) {
            return null;
        }
        this.PrivateKey = privkey;
        this.Cache = new NodeCache();
    }

    //return (symmetricKey Buffer, token Buffer, e string)
    async HandleGet(header) {
        const ecs = header["ectm_key"] || header["Ectm_key"];
        if (!ecs) {
            return new ECTRequest(null,null,null,"ecs not exist")
            
        }
        let ecsBase64Str = "";
        if (typeof ecs == "string" && ecs != "") {
            ecsBase64Str = ecs;
        } else if (typeof ecs == "object" && ecs.length > 0 && ecs[0] != "") {
            ecsBase64Str = ecs[0];
        } else {
            return new ECTRequest(null,null,null,"ecs not exist")
        }

        //try to get from cache
        let symmetricKey = this.Cache.get(ecsBase64Str);
        if (!symmetricKey) {
            //not in cache
            symmetricKey = await ecc.ECCDecrypt(this.PrivateKey, Buffer.from(ecsBase64Str, "base64"));
            //check correct
            if (!symmetricKey) {
                return new ECTRequest(null,null,null,"ecs Decrypt error")
            }
            //set to cache
            this.Cache.set(ecsBase64Str, symmetricKey, 3600);
        }

        //check header
        const { token, err } = ecthttp.DecryptECTMHeader(header, symmetricKey);
        if (err != null) {
            return new ECTRequest(null,null,null,err)
        }

        return new ECTRequest(token,symmetricKey,null,null)
    }

    //return (symmetricKey Buffer, decryptedBody Buffer, token Buffer, e string)
    async HandlePost(header, body) {
        const ecs = header["ectm_key"] || header["Ectm_key"];
        if (!ecs) {
            return new ECTRequest(null,null,null,"ecs not exist")
        }
        let ecsBase64Str = "";
        if (typeof ecs == "string" && ecs != "") {
            ecsBase64Str = ecs;
        } else if (typeof ecs == "object" && ecs.length > 0 && ecs[0] != "") {
            ecsBase64Str = ecs[0];
        } else {
            return new ECTRequest(null,null,null,"ecs not exist")
        }

        //try to get from cache
        let symmetricKey = this.Cache.get(ecsBase64Str);
        if (!symmetricKey) {
            //not in cache
            symmetricKey = await ecc.ECCDecrypt(this.PrivateKey, Buffer.from(ecsBase64Str, "base64"));
            //check correct
            if (!symmetricKey) {
                return new ECTRequest(null,null,null,"ecs Decrypt error")
            }
            //set to cache
            this.Cache.set(ecsBase64Str, symmetricKey, 3600);
        }

        //check header
        const { token, err } = ecthttp.DecryptECTMHeader(header, symmetricKey);
        if (err != null) {
            return new ECTRequest(null,symmetricKey,null,"ecs Decrypt error")
        }

        const decryptBody = ecthttp.DecryptBody(body, symmetricKey);
        if (!decryptBody) {
            return new ECTRequest(token,symmetricKey,null,"decrypt body error")
        }

        return new ECTRequest(token,symmetricKey,decryptBody,null)
    }

    static ECTSendBack(res, symmetricKey, data){
        const v = ecthttp.EncryptAndSetECTMHeader(null, symmetricKey, null,res);
        if (v.err!=null) {
            return {
                encryptedBodyBuffer:null,
                err:"encrypt response header error"
            }
        }

        let EncryptedBody
        let toEncrypt

        if (!data) {
            toEncrypt=null
            EncryptedBody=null
        }else{
            switch (typeof data) {
                case "string":
                    toEncrypt=Buffer.from(data)
                    break;
                default:
                    if (Buffer.isBuffer(data)) {
                        toEncrypt=data
                    }else{
                        toEncrypt=Buffer.from(JSON.stringify(data))
                    }
                    break;
            }
            //body encrypt
            EncryptedBody = ecthttp.EncryptBody(toEncrypt, symmetricKey);
            if (!EncryptedBody) {
                return {
                    encryptedBodyBuffer:null,
                    err:"encrypt response data error"
                }
            }
        }

        return {
            encryptedBodyBuffer:EncryptedBody,
            err:null
        }
    }

}

module.exports = { ECTHttpServer };
