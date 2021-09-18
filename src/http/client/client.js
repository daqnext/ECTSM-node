/*
 * @Author: your name
 * @Date: 2021-09-13 10:25:08
 * @LastEditTime: 2021-09-17 15:31:49
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECT-http-node/src/http/client/client.ts
 */

const axios =require("axios")
const {utils} =require("../../utils/common")
const { ecc } =require("../../utils/ecc");
const { ecthttp, allowServerClientTimeGap, ECTResponse } =require("../http");

const DefaultTimeout = 30000;

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
            //console.error(error);
            return false;
        }
    }

    // return(axios response,decryptBody,err)
    async ECTGet(url, token = "", axiosConfig = {}) {
        if(token===null){ token=""}

        try {
            //header
            const { header, err } = ecthttp.EncryptAndSetECTMHeader(this.EcsKey, this.SymmetricKey, Buffer.from(token));
            if (err != null) {
                return new ECTResponse(null, null, "GenEctHeader header error");
            }

            const headerObj = {};
            Object.assign(headerObj, axiosConfig.headers, header);
            axiosConfig.headers = headerObj;

            if (!axiosConfig.timeout) {
                axiosConfig.timeout = DefaultTimeout;
            }

            axiosConfig.responseType = "arraybuffer";
            const response = await axios.get(url, axiosConfig);
            //check response timestamp
            {
                const { err } = ecthttp.DecryptECTMHeader(response.headers, this.SymmetricKey);
                if (err != null) {
                    return new ECTResponse(response, null, err);
                }
            }

            //decrypt response body
            let dataBuf = ecthttp.DecryptBody(Buffer.from(response.data), this.SymmetricKey);

            return new ECTResponse(response, dataBuf, null);
        } catch (error) {
            return new ECTResponse(null, null, error.stack);
        }
    }

    // return(axios response,decryptBody,err)
    async ECTPost(url, data, token = "", axiosConfig = {}) {
        if(token===null){ token=""}
        try {
            //header
            const { header, err } = ecthttp.EncryptAndSetECTMHeader(this.EcsKey, this.SymmetricKey, Buffer.from(token));
            if (err != null) {
                return new ECTResponse(null, null, "GenEctHeader header error");
            }

            const headerObj = {};
            Object.assign(headerObj, axiosConfig.headers, header);
            axiosConfig.headers = headerObj;

            if (!axiosConfig.timeout) {
                axiosConfig.timeout = DefaultTimeout;
            }

            let EncryptedBody;
            let toEncrypt;

            if (!data) {
                toEncrypt = null;
                EncryptedBody = null;
            } else {
                switch (typeof data) {
                    case "string":
                        toEncrypt = Buffer.from(data);
                        break;
                    default:
                        if (Buffer.isBuffer(data)) {
                            toEncrypt = data;
                        } else {
                            toEncrypt = Buffer.from(JSON.stringify(data));
                        }
                        break;
                }
                
                //body encrypt
                EncryptedBody = ecthttp.EncryptBody(toEncrypt, this.SymmetricKey);
                if (!EncryptedBody) {
                    return new ECTResponse(null, null, "encrypt response data error");
                }
            }

            //
            axiosConfig.method = "post";
            axiosConfig.url = url;
            axiosConfig.headers["Content-Type"] = "application/octet-stream";
            axiosConfig.data = EncryptedBody;
            axiosConfig.responseType = "arraybuffer";

            const response = await axios(axiosConfig);

            //check response timestamp
            {
                const { err } = ecthttp.DecryptECTMHeader(response.headers, this.SymmetricKey);
                if (err != null) {
                    return new ECTResponse(response, null, err);
                }
            }

            //decrypt response body
            //ArrayBuffer=>Buffer
            let dataBuf = ecthttp.DecryptBody(Buffer.from(response.data), this.SymmetricKey);

            return new ECTResponse(response, dataBuf, null);
        } catch (error) {
            return new ECTResponse(null, null, error.stack);
        }
    }
}

module.exports = { ECTHttpClient };
