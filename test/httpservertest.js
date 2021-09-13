/*
 * @Author: your name
 * @Date: 2021-09-13 16:34:56
 * @LastEditTime: 2021-09-13 16:51:25
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/test/httpservertest.js
 */

// koa for example
const Koa =require("koa")
const Router =require("koa-router")
const koaBody =require("koa-body")

//ECTServer
const {ECTHttpServer,ecthttp} = require("../src/index")

const privateKeyBase64Str = "bhbb4EC96zx2uUsWDtSYivzaZUzdeDKMfn+dSV9VwUI=";
const publicKeyBase64Str = "BJJlxQFcPuVTjaB/PvbqmN0py98C2iScUQlvpRUm+kpAgqJmnofCely42Hczgb7cqwTZtFTfPwm2ImdmDtvFMH4=";
let hs = null;

function InitEctHttpServer() {
    hs = new ECTHttpServer(privateKeyBase64Str);
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
        const v = await hs.CheckHeader(ctx.headers);
        if (v == null) {
            ctx.status = 500;
            ctx.body = "decrypt header error";
            return;
        }

        //do something
        //...
        console.log("symmetricKey:", v.symmetricKey.toString("base64"));
        console.log("timeStamp:", v.timeStamp);

        //responseData example
        const data = {
            Status: 0,
            Msg: "post success",
            Data: null,
        };

        ctx.res.getHeaders;
        const sendData = ecthttp.SetECTResponse(ctx.res, data, v.symmetricKey);
        console.log("response data:", sendData);

        ctx.body = sendData;
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
        console.log("symmetricKey:", v.symmetricKey.toString("base64"));
        console.log("timeStamp:", v.timeStamp);
        console.log("decryptedBody:", v.decryptedBody);

        //responseData example
        const data = {
            Status: 0,
            Msg: "post success",
            Data: null,
        };
        const sendData = ecthttp.SetECTResponse(ctx.res, data, v.symmetricKey);
        console.log("response data:", sendData);

        ctx.body = sendData;
    });
    app.use(router.routes());
    app.listen(8080);
}

async function main() {
    //init EctHttpServer instance
    InitEctHttpServer();

    //start http server
    StartKoaServer();
}

main();
