/*
 * @Author: your name
 * @Date: 2021-09-13 17:12:04
 * @LastEditTime: 2021-09-14 17:10:15
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/http/client/client.js
 */

const axios = require("axios");
const { utils } = require("../../utils/common");
const { ecc } = require("../../utils/ecc");
const { ecthttp, allowRequestTimeGapSec, allowServerClientTimeGap } = require("../http");

class ECTHttpClient {
    PublicKeyUrl;
    SymmetricKey;
    PublicKey;
    EcsKey;

    async Init(publicKeyUrl) {
        try {
            this.PublicKeyUrl = publicKeyUrl;

            const response = await axios.get(publicKeyUrl);

            //time
            const nowTime = Math.floor(Date.now() / 1000);
            const timeGap = nowTime - response.data.UnixTime;
            if (timeGap < -allowServerClientTimeGap || timeGap > allowServerClientTimeGap) {
                return false;
            }

            //pubKey
            let publicKey = ecc.StrBase64ToPublicKey(response.data.PublicKey);
            if (publicKey == null) {
                return false;
            }
            this.PublicKey = publicKey;

            //randKey
            this.SymmetricKey = Buffer.from(utils.GenRandomKey());

            const encrypted = await ecc.ECCEncrypt(this.PublicKey, this.SymmetricKey);
            if (encrypted == null) {
                return false;
            }

            this.EcsKey = encrypted.toString("base64");
            return true;
        } catch (error) {
            console.error(error);
            return false
        }
    }

    async ECTGet(url, token = undefined, axiosConfig = {}) {
        try {
            //header
            const header = ecthttp.GenECTHeader(this.EcsKey, this.SymmetricKey,token);
            if (header == null) {
                return {
                    reqResp: null,
                    decryptBody: null,
                    err: "GenEctHeader header error",
                };
            }

            const headerObj = {};
            Object.assign(headerObj, axiosConfig.headers, header);
            axiosConfig.headers = headerObj;

            if (!axiosConfig.timeout) {
                axiosConfig.timeout = 30000;
            }

            const response = await axios.get(url, axiosConfig);

            if (response.status != 200) {
                return {
                    reqResp: response,
                    decryptBody: null,
                    err: null,
                };
            }

            //check response timestamp
            const timeStamp = ecthttp.DecryptTimestamp(response.headers, this.SymmetricKey);
            if (timeStamp == null) {
                return {
                    reqResp: response,
                    decryptBody: null,
                    err: "Decrypt timeStamp error",
                };
            }

            const nowTime = Math.floor(Date.now() / 1000);
            const timeGap = nowTime - timeStamp;
            if (timeGap < -allowRequestTimeGapSec || timeGap > allowRequestTimeGapSec) {
                return {
                    reqResp: response,
                    decryptBody: null,
                    err: "timestamp error, timeout",
                };
            }

            //decrypt response body
            const data = ecthttp.DecryptBody(response.data, this.SymmetricKey);
            return {
                reqResp: response,
                decryptBody: data,
                err: null,
            };
        } catch (error) {
            return {
                reqResp: null,
                decryptBody: null,
                err: error,
            };
        }
    }

    async ECTPost(url, obj, token = undefined, axiosConfig = {}) {
        try {
            //header
            const header = ecthttp.GenECTHeader(this.EcsKey, this.SymmetricKey,token);
            if (header == null) {
                return {
                    reqResp: null,
                    decryptBody: null,
                    err: "GenEctHeader header error",
                };
            }

            const bodySend = ecthttp.EncryptBody(obj, this.SymmetricKey);
            if (bodySend == null) {
                return {
                    reqResp: null,
                    decryptBody: null,
                    err: "EncryptBody error",
                };
            }

            const headerObj = {};
            Object.assign(headerObj, axiosConfig.headers, header);
            axiosConfig.headers = headerObj;

            if (!axiosConfig.timeout) {
                axiosConfig.timeout = 30000;
            }

            //
            axiosConfig.method = "post";
            axiosConfig.url = url;
            axiosConfig.headers["Content-Type"] = "text/plain";
            axiosConfig.data = bodySend;

            const response = await axios(axiosConfig);
            if (response.status != 200) {
                return {
                    reqResp: response,
                    decryptBody: null,
                    err: null,
                };
            }

            //check response timestamp
            const timeStamp = ecthttp.DecryptTimestamp(response.headers, this.SymmetricKey);
            if (timeStamp == null) {
                return {
                    reqResp: response,
                    decryptBody: null,
                    err: "Decrypt timeStamp error",
                };
            }
            const nowTime = Math.floor(Date.now() / 1000);
            const timeGap = nowTime - timeStamp;
            if (timeGap < -allowRequestTimeGapSec || timeGap > allowRequestTimeGapSec) {
                return {
                    reqResp: response,
                    decryptBody: null,
                    err: "timestamp error, timeout",
                };
            }

            //decrypt response body
            const data = ecthttp.DecryptBody(response.data, this.SymmetricKey);
            return {
                reqResp: response,
                decryptBody: data,
                err: null,
            };
        } catch (error) {
            return {
                reqResp: null,
                decryptBody: null,
                err: error,
            };
        }
    }
}

module.exports = { ECTHttpClient };
