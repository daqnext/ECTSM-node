/*
 * @Author: your name
 * @Date: 2021-09-13 17:12:04
 * @LastEditTime: 2021-09-15 22:00:38
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/http/client/client.js
 */

const axios = require("axios");
const { utils } = require("../../utils/common");
const { ecc } = require("../../utils/ecc");
const { ecthttp, allowServerClientTimeGap } = require("../http");

class ECTHttpClient {
    PublicKeyUrl;
    SymmetricKey; //Buffer
    EcsKey; //Buffer
    PublicKey; //Buffer

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
            this.SymmetricKey = Buffer.from(utils.GenSymmetricKey());

            const encryptedEcs = await ecc.ECCEncrypt(this.PublicKey, this.SymmetricKey);
            if (encryptedEcs == null) {
                return false;
            }

            this.EcsKey = encryptedEcs;
            return true;
        } catch (error) {
            console.error(error);
            return false
        }
    }

    // return(axios response,decryptBody,err)
    async ECTGet(url, token = "", axiosConfig = {}) {
        try {
            //header
            const {header,err} = ecthttp.EncryptAndSetECTMHeader(this.EcsKey, this.SymmetricKey,Buffer.from(token));
            if (err!=null) {
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
            //console.log(response);

            if (response.status != 200) {
                return {
                    reqResp: response,
                    decryptBody: null,
                    err: null,
                };
            }

            //check response timestamp
            {
            const {err} = ecthttp.DecryptECTMHeader(response.headers, this.SymmetricKey);
            if (err!=null) {
                return {
                    reqResp: response,
                    decryptBody: null,
                    err: err,
                };
            }
        }

            //decrypt response body
            //console.log("response data:",response.data);
            let dataBuf = ecthttp.DecryptBody(Buffer.from(response.data,"base64"), this.SymmetricKey);

            return {
                reqResp: response,
                decryptBody: dataBuf,
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

    // return(axios response,decryptBody,err)
    async ECTPost(url, dataString, token = "", axiosConfig = {}) {
        try {
            //header
            const {header,err} = ecthttp.EncryptAndSetECTMHeader(this.EcsKey, this.SymmetricKey,Buffer.from(token));
            if (err!=null) {
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
            
            
            const EncryptedBody= ecthttp.EncryptBody(Buffer.from(dataString), this.SymmetricKey)
            if (!EncryptedBody) {
                return {
                    reqResp: null,
                    decryptBody: null,
                    err: "EncryptBody error",
                };
            }

            //
            axiosConfig.method = "post";
            axiosConfig.url = url;
            axiosConfig.headers["Content-Type"] = "text/plain";
            axiosConfig.data = EncryptedBody.toString("base64");

            const response = await axios(axiosConfig);
            if (response.status != 200) {
                return {
                    reqResp: response,
                    decryptBody: null,
                    err: null,
                };
            }

            //check response timestamp
            {
            const {err} = ecthttp.DecryptECTMHeader(response.headers, this.SymmetricKey);
            if (err!=null) {
                return {
                    reqResp: response,
                    decryptBody: null,
                    err: err,
                };
            }
        }

            //decrypt response body
            let dataBuf = ecthttp.DecryptBody(Buffer.from(response.data,"base64"), this.SymmetricKey);

            return {
                reqResp: response,
                decryptBody: dataBuf,
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
