/*
 * @Author: your name
 * @Date: 2021-09-12 19:39:13
 * @LastEditTime: 2021-09-16 15:13:19
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/http/server/server.js
 */

const { ecc } = require("../../utils/ecc");
const NodeCache = require("node-cache");
const { ecthttp } = require("../http");

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
            return {
                symmetricKey: null,
                token: null,
                err: "ecs not exist",
            };
        }
        let ecsBase64Str = "";
        if (typeof ecs == "string" && ecs != "") {
            ecsBase64Str = ecs;
        } else if (typeof ecs == "object" && ecs.length > 0 && ecs[0] != "") {
            ecsBase64Str = ecs[0];
        } else {
            return {
                symmetricKey: null,
                token: null,
                err: "ecs not exist",
            };
        }

        //try to get from cache
        let symmetricKey = this.Cache.get(ecsBase64Str);
        if (!symmetricKey) {
            //not in cache
            symmetricKey = await ecc.ECCDecrypt(this.PrivateKey, Buffer.from(ecsBase64Str, "base64"));
            //check correct
            if (!symmetricKey) {
                return {
                    symmetricKey: null,
                    token: null,
                    err: "ecs Decrypt error",
                };
            }
            //set to cache
            this.Cache.set(ecsBase64Str, symmetricKey, 3600);
        }

        //check header
        const { token, err } = ecthttp.DecryptECTMHeader(header, symmetricKey);
        if (err != null) {
            return {
                symmetricKey: symmetricKey,
                token: null,
                err: err,
            };
        }

        return {
            symmetricKey: symmetricKey,
            token: token,
            err: null,
        };
    }

    //return (symmetricKey Buffer, decryptedBody Buffer, token Buffer, e string)
    async HandlePost(header, body) {
        const ecs = header["ectm_key"] || header["Ectm_key"];
        if (!ecs) {
            return {
                symmetricKey: null,
                decryptedBody: null,
                token: null,
                err: "ecs not exist",
            };
        }
        let ecsBase64Str = "";
        if (typeof ecs == "string" && ecs != "") {
            ecsBase64Str = ecs;
        } else if (typeof ecs == "object" && ecs.length > 0 && ecs[0] != "") {
            ecsBase64Str = ecs[0];
        } else {
            return {
                symmetricKey: null,
                decryptedBody: null,
                token: null,
                err: "ecs not exist",
            };
        }

        //try to get from cache
        let symmetricKey = this.Cache.get(ecsBase64Str);
        if (!symmetricKey) {
            //not in cache
            symmetricKey = await ecc.ECCDecrypt(this.PrivateKey, Buffer.from(ecsBase64Str, "base64"));
            //check correct
            if (!symmetricKey) {
                return {
                    symmetricKey: null,
                    decryptedBody: null,
                    token: null,
                    err: "ecs Decrypt error",
                };
            }
            //set to cache
            this.Cache.set(ecsBase64Str, symmetricKey, 3600);
        }

        //check header
        const { token, err } = ecthttp.DecryptECTMHeader(header, symmetricKey);
        if (err != null) {
            return {
                symmetricKey: symmetricKey,
                decryptedBody: null,
                token: null,
                err: err,
            };
        }

        const decryptBody = ecthttp.DecryptBody(body, symmetricKey);
        if (!decryptBody) {
            return {
                symmetricKey: symmetricKey,
                decryptedBody: null,
                token: token,
                err: "decrypt body error",
            };
        }

        return {
            symmetricKey: symmetricKey,
            decryptedBody: decryptBody,
            token: token,
            err: null,
        };
    }

}

module.exports = { ECTHttpServer };
