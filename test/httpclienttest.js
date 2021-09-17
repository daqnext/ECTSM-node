/*
 * @Author: your name
 * @Date: 2021-09-13 11:54:49
 * @LastEditTime: 2021-09-17 14:19:38
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECT-http-node/test/httpclienttest.ts
 */

const { ECTHttpClient } = require("../src/index");

async function HttpRequest() {
    //new ecthttpclient instance as a global single instance
    //publicKeyUrl endpoint to get unix time and public key form server
    const hc = new ECTHttpClient();
    await hc.Init("http://127.0.0.1:8080/ectminfo");
    if (hc == null) {
        console.error("new ECTHttpClient error");
    }

    //get
    {
        const url = "http://127.0.0.1:8080/test/get";
        //send request with default timeout and token 'usertoken'
        const result = await hc.ECTGet(url, "usertoken", { timeout: 30000 });
        if (result.Err != null) {
            console.log("err", result.Err);
        } else {
            console.log("status", result.Rs.status);
            console.log("get request reponse string", result.ToString());
            console.log("get request reponse json", result.ToJson());
        }
    }

    //post
    {
        const sendData = {
            Name: "Jack",
            Email: "jack@gmail.com",
            Phone: "123456789",
            Age: 18,
        };

        const url = "http://127.0.0.1:8080/test/post";
        const result = await hc.ECTPost(url, sendData, "token");
        if (result.Err != null) {
            console.log("err", result.Err);
        } else {
            console.log("status", result.Rs.status);
            console.log("get request reponse string", result.ToString());
            console.log("get request reponse json", result.ToJson());
        }
    }
}

HttpRequest();
