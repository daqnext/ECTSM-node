/*
 * @Author: your name
 * @Date: 2021-09-13 18:50:48
 * @LastEditTime: 2021-09-15 21:04:21
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/test/httpclienttest.js
 */

const { ECTHttpClient } = require("../src/index");
const hc = new ECTHttpClient();

async function HttpRequest() {
    //new ecthttpclient instance as a global single instance
    //publicKeyUrl endpoint to get unix time and public key form server

    let success=await hc.Init("http://127.0.0.1:8080/ectminfo");
    if (success == false) {
        console.error("new ECTHttpClient error");
        return
    }

    //get
    {
        const url = "http://127.0.0.1:8080/test/get";
        //send request with default timeout and token 'usertoken'
        const { reqResp, decryptBody, err } = await hc.ECTGet(url, "usertoken", { timeout: 30000 });

        if (err != null) {
            console.log("err", err);
        }
        console.log("status", reqResp.status);
        console.log("get request reponse", decryptBody.toString());
    }

    //post
    {
        const sendData = {
            Name: "Jack",
            Email: "jack@gmail.com",
            Phone: "123456789",
            Age: 18,
        };
        let sendDataStr=JSON.stringify(sendData)

        const url = "http://127.0.0.1:8080/test/post";
        const { reqResp, decryptBody, err } = await hc.ECTPost(url, Buffer.from(sendDataStr), "usertoken");

        if (err != null) {
            console.log("err", err);
        }
        console.log("status", reqResp.status);
        console.log("get request reponse", decryptBody.toString());
    }
}

HttpRequest();
