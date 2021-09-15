/*
 * @Author: your name
 * @Date: 2021-09-13 16:34:56
 * @LastEditTime: 2021-09-15 18:06:07
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/test/httpservertest.js
 */

// koa for example
const Koa =require("koa")
const Router =require("koa-router")
const koaBody =require("koa-body")
const cors =require('koa2-cors')
const os =require("os")

//ECTServer
const {ECTHttpServer,ecthttp} = require("../src/index")

const privateKeyBase64Str = "bhbb4EC96zx2uUsWDtSYivzaZUzdeDKMfn+dSV9VwUI=";
const publicKeyBase64Str = "BJJlxQFcPuVTjaB/PvbqmN0py98C2iScUQlvpRUm+kpAgqJmnofCely42Hczgb7cqwTZtFTfPwm2ImdmDtvFMH4=";
let hs = null;

function InitEctHttpServer() {
    console.log("InitEctHttpServer");
    hs = new ECTHttpServer(privateKeyBase64Str);
    if (hs==null) {
        console.log("InitEctHttpServer error");
        os.exit(1)
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
        const {symmetricKey,token,err} = await hs.HandleGet(ctx.headers);
        if (err!=null) {
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
        const sendStr=JSON.stringify(data)

        const ECTResponseObj = ecthttp.ECTResponse(ctx.res, symmetricKey,Buffer.from(sendStr));
        if (ECTResponseObj.err!=null) {
            ctx.status = 500;
            ctx.body = ECTResponseObj.err;
            return;
        }
        console.log("response data:", ECTResponseObj.encryptedBody);

        ctx.body = ECTResponseObj.encryptedBody.toString("base64");
    });

    router.post("/test/post", koaBody(), async (ctx) => {
        console.log("body1",ctx.request.body)

        //check header
        const v = await hs.HandlePost(ctx.headers,Buffer.from(ctx.request.body,"base64"));
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
        const sendStr=JSON.stringify(data)

        const ECTResponseObj = ecthttp.ECTResponse(ctx.res, v.symmetricKey,Buffer.from(sendStr));
        if (ECTResponseObj.err!=null) {
            ctx.status = 500;
            ctx.body = ECTResponseObj.err;
            return;
        }
        console.log("response data:", ECTResponseObj.encryptedBody);

        ctx.body = ECTResponseObj.encryptedBody.toString("base64");
    });

    //cors for html use
    app.use(cors({
        exposeHeaders: ['ecttimestamp', 'ecs','Ecttimestamp', 'Ecs'],
    }))
    
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
