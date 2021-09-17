<!--
 * @Author: your name
 * @Date: 2021-09-12 19:27:27
 * @LastEditTime: 2021-09-17 15:48:39
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
            await hc.Init("http://127.0.0.1:8080/ectminfo");
            if (hc == null) {
                console.error("new ECTHttpClient error");
            }

            //get
            {
                const url = "http://127.0.0.1:8080/test/get";
                //send request with default timeout and token 'usertoken'
                const result = await hc.ECTGet(url, "usertoken");
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
```

### server example(use koa)
```js
// koa for example
const Koa =require("koa")
const Router =require("koa-router")
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

//use as middleware to get body buffer
async function GetRawBody(ctx, next) {
    let data = Buffer.from("");

    ctx.rawBody = await new Promise((resolve, reject) => {
        ctx.req.on("data", (chunk) => {
            //data+=chunk; // 将接收到的数据暂时保存起来
            data = Buffer.concat([data, chunk]);
        });
        ctx.req.on("end", () => {
            if (data.length == 0) {
                console.log("no body");
                resolve(null);
            } else {
                //console.log(Buffer.from(data[0]));
                resolve(data);
                console.log("body", data); // 数据传输完，打印数据的内容
            }
        });
    });

    await next();
}

function StartKoaServer() {
    const app = new Koa();
    const router = new Router();

    //cors for html use
    app.use(
        cors({
            exposeHeaders: ["Ectm_key", "ectm_key", "Ectm_time", "ectm_time", "Ectm_token", "ectm_token"],
        })
    );

    app.use(router.routes());

    router.get("/ectminfo", async (ctx) => {
        console.log("GET /ectminfo");

        ctx.body = {
            UnixTime: Math.floor(Date.now() / 1000),
            PublicKey: publicKeyBase64Str,
        };
    });

    router.get("/test/get", async (ctx) => {
        //check header
        const ectReq = await hs.HandleGet(ctx.headers);
        if (ectReq.Err != null) {
            ctx.status = 500;
            ctx.body = Buffer.from("decrypt header error");
            return;
        }

        //do something
        //...
        console.log("symmetricKey:", ectReq.GetSymmetricKey());
        console.log("token:", ectReq.GetToken());

        //responseData example
        const data = {
            Status: 0,
            Msg: "get success",
            Data: null,
        };

        const ECTResponseObj = ECTHttpServer.ECTSendBack(ctx.res, ectReq.SymmetricKey, data);
        if (ECTResponseObj.err != null) {
            ctx.status = 500;
            ctx.body = Buffer.from(ECTResponseObj.err);
            return;
        }

        console.log("response data:", ECTResponseObj.encryptedBodyBuffer);

        ctx.body = ECTResponseObj.encryptedBodyBuffer;
    });

    //user GetRawBody to get body buffer
    //this example in ctx.rawBody
    router.post("/test/post", GetRawBody, async (ctx) => {
        //check header
        const ectReq = await hs.HandlePost(ctx.headers, ctx.rawBody);
        if (ectReq.Err != null) {
            ctx.status = 500;
            ctx.body = Buffer.from("decrypt header error");
            return;
        }

        //do something
        //...
        console.log("symmetricKey:", ectReq.GetSymmetricKey());
        console.log("token:", ectReq.GetToken());
        console.log("decryptedBody string:", ectReq.ToString());
        console.log("decryptedBody json:", ectReq.ToJson());


        //responseData example
        const data = {
            Status: 0,
            Msg: "post success",
            Data: null,
        };

        const ECTResponseObj = ECTHttpServer.ECTSendBack(ctx.res, ectReq.SymmetricKey, data);
        if (ECTResponseObj.err != null) {
            ctx.status = 500;
            ctx.body = Buffer.from(ECTResponseObj.err);
            return;
        }

        console.log("response data:", ECTResponseObj.encryptedBodyBuffer);

        ctx.body = ECTResponseObj.encryptedBodyBuffer;
    });

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