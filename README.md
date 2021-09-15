<!--
 * @Author: your name
 * @Date: 2021-09-12 19:27:27
 * @LastEditTime: 2021-09-15 21:51:54
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/README.md
-->
# ECTSM-node
js version implementation of ECTSM

## use in html
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <script src="https://cdn.jsdelivr.net/npm/ectsm-node/dist/httpclient-min.js"></script>
    <script>
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
                const { reqResp, decryptBody, err } = await hc.ECTGet(url, "usertoken", {
                    timeout: 30000
                });

                if (err != null) {
                    console.log("err", err);
                }else{
                    console.log("status", reqResp.status);
                    console.log("get request reponse", decryptBody);
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
                const { reqResp, decryptBody, err} = await hc.ECTPost(url, sendData, "usertoken");

                if (err != null) {
                    console.log("err", err);
                }else{
                    console.log("status", reqResp.status);
                    console.log("get request reponse", decryptBody);
                }      
            }
        }

        HttpRequest();
    </script>
</body>

</html>
```

## use in nodejs
```
npm install --save ectsm-node
```

### client example
```js
const { ECTHttpClient } = require("ectsm-node");
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
```

### server example(use koa)
```js
// koa for example
const Koa =require("koa")
const Router =require("koa-router")
const koaBody =require("koa-body")
const cors =require('koa2-cors')
const os =require("os")

//ECTServer
const {ECTHttpServer,ecthttp} = require("ectsm-node")

const privateKeyBase64Str = "bhbb4EC96zx2uUsWDtSYivzaZUzdeDKMfn+dSV9VwUI=";
const publicKeyBase64Str = "BJJlxQFcPuVTjaB/PvbqmN0py98C2iScUQlvpRUm+kpAgqJmnofCely42Hczgb7cqwTZtFTfPwm2ImdmDtvFMH4=";
let hs = null;

function InitEctHttpServer() {
    console.log("InitEctHttpServer");
    hs = new ECTHttpServer(privateKeyBase64Str);
    if (hs == null) {
        console.log("InitEctHttpServer error");
        os.exit(1);
    }
}

function StartKoaServer() {
    const app = new Koa();
    const router = new Router();

    router.get("/ectminfo", async (ctx) => {
        console.log("GET /ectminfo");

        ctx.body = {
            UnixTime: Math.floor(Date.now() / 1000),
            PublicKey: publicKeyBase64Str,
        };
    });

    router.get("/test/get", async (ctx) => {
        //check header
        // symmetricKey: null,
        //         token: null,
        //         err: "ecs not exist",
        const { symmetricKey, token, err } = await hs.HandleGet(ctx.headers);
        if (err != null) {
            ctx.status = 500;
            ctx.body = "decrypt header error";
            return;
        }

        //do something
        //...
        console.log("symmetricKey:", symmetricKey.toString());
        console.log("token:", token.toString());

        //responseData example
        const data = {
            Status: 0,
            Msg: "post success",
            Data: null,
        };
        const sendStr = JSON.stringify(data);

        const ECTResponseObj = ecthttp.ECTResponse(ctx.res, symmetricKey, Buffer.from(sendStr));
        if (ECTResponseObj.err != null) {
            ctx.status = 500;
            ctx.body = ECTResponseObj.err;
            return;
        }
        //console.log("response data:", ECTResponseObj.encryptedBody);
        //console.log("response data to string:", ECTResponseObj.encryptedBody.toString());
        console.log("response data base64:", ECTResponseObj.encryptedBodyBase64);

        ctx.body = ECTResponseObj.encryptedBodyBase64;
    });

    router.post("/test/post", koaBody(), async (ctx) => {
        //console.log("body1",ctx.request.body)

        //check header
        const v = await hs.HandlePost(ctx.headers, ctx.request.body);
        if (v == null) {
            ctx.status = 500;
            ctx.body = "decrypt header error";
            return;
        }

        //do something
        //...
        console.log("symmetricKey:", v.symmetricKey.toString());
        console.log("token:", v.token.toString());
        console.log("decryptedBody:", v.decryptedBody.toString());

        //responseData example
        const data = {
            Status: 0,
            Msg: "post success",
            Data: null,
        };
        const sendStr = JSON.stringify(data);

        const ECTResponseObj = ecthttp.ECTResponse(ctx.res, v.symmetricKey, Buffer.from(sendStr));
        if (ECTResponseObj.err != null) {
            ctx.status = 500;
            ctx.body = ECTResponseObj.err;
            return;
        }
        console.log("response data:", ECTResponseObj.encryptedBodyBase64);

        ctx.body = ECTResponseObj.encryptedBodyBase64;
    });

    //cors for html use
    app.use(
        cors({
            exposeHeaders: ["Ectm_key", "ectm_key", "Ectm_time", "ectm_time", "Ectm_token", "ectm_token"],
        })
    );

    app.use(router.routes());
    app.listen(8080);
    console.log("server start:8080");
}

async function main() {
    //init EctHttpServer instance
    InitEctHttpServer();

    //start http server
    StartKoaServer();
}

main();
```