/*
 * @Author: your name
 * @Date: 2021-09-12 19:39:13
 * @LastEditTime: 2021-09-14 12:46:47
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/http/server/server.js
 */

const { ecc } = require("../../utils/ecc");
const NodeCache = require( "node-cache" );
const {ecthttp ,allowRequestTimeGapSec}= require("../http")

class ECTHttpServer {
    PrivateKey
    Cache

    constructor(privateKeyBase64Str) {
        const privkey= ecc.StrBase64ToPrivateKey(privateKeyBase64Str);
        if (!privkey) {
            console.error("init private key error");
            return null
        }
        this.PrivateKey = privkey
        this.Cache = new NodeCache();
    }

    async CheckHeader(header) {
        try {
            //ecs
            const ecs = header["ecs"];
            if (!ecs) {
                console.error("ecs not exist");
                return null;
            }

            let ecsBase64Str = "";
            if (typeof ecs == "string" && ecs != "") {
                ecsBase64Str = ecs;
            } else if (typeof ecs == "object" && ecs.length > 0 && ecs[0] != "") {
                ecsBase64Str = ecs[0];
            } else {
                console.error("ecs error");
                return null;
            }

            //try to get from cache
            let symmetricKey = this.Cache.get(ecsBase64Str);
            if (symmetricKey == undefined) {
                //not in cache
                symmetricKey = await ecc.ECCDecrypt(this.PrivateKey, Buffer.from(ecsBase64Str, "base64"));
                //check correct
                if (!symmetricKey) {
                    return null;
                }
                //set to cache
                this.Cache.set(ecsBase64Str, symmetricKey, 3600);
            }

            const timeStamp = ecthttp.DecryptTimestamp(header, symmetricKey);
            if (timeStamp == null) {
                return null;
            }
            const nowTime = Math.floor(Date.now() / 1000);
            const timeGap = nowTime - timeStamp;
            if (timeGap < -allowRequestTimeGapSec || timeGap > allowRequestTimeGapSec) {
                console.error("timestamp error, timeout");
                return null;
            }

            return {
                symmetricKey: symmetricKey,
                timeStamp: timeStamp,
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async HandlePost(header, body) {
        //header
        const v = await this.CheckHeader(header);
        if (v == null) {
            return null;
        }
        const symmetricKey = v.symmetricKey;
        const timeStamp = v.timeStamp;

        const decryptedBody = ecthttp.DecryptBody(body, symmetricKey);

        return {
            symmetricKey: symmetricKey,
            timeStamp: timeStamp,
            decryptedBody: decryptedBody,
        };
    }
}

module.exports= {ECTHttpServer}
