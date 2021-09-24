/*
 * @Author: your name
 * @Date: 2021-09-13 16:34:56
 * @LastEditTime: 2021-09-24 09:34:30
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/test/httpservertest.js
 */
// koa for example
const Koa = require("koa");
const Router = require("koa-router");
const cors = require("koa2-cors");
const os = require("os");

//ECTServer
const { ECTHttpServer } = require("../src/index");

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
            data = Buffer.concat([data, chunk]);
        });
        ctx.req.on("end", () => {
            if (data.length == 0) {
                console.log("no body");
                resolve(null);
            } else {
                resolve(data);
                console.log("body", data); 
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
