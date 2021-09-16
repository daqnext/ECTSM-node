/*
 * @Author: your name
 * @Date: 2021-09-13 16:34:56
 * @LastEditTime: 2021-09-16 17:41:48
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
const { ECTHttpServer, ecthttp } = require("../src/index");

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
async function GetRawBody(ctx,next){
    let data=Buffer.from("")

    ctx.rawBody=await new Promise((resolve,reject)=>{
        ctx.req.on("data", (chunk) => {
            //data+=chunk; // 将接收到的数据暂时保存起来
            data=Buffer.concat([data,chunk])
        });
        ctx.req.on("end", () => {
            if (data.length == 0) {
                console.log("no body");
                resolve(null)
            } else {
                //console.log(Buffer.from(data[0]));
                resolve(data)
                console.log("body",data); // 数据传输完，打印数据的内容
            }
        });
    })

    await next()
    
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
        // symmetricKey: null,
        //         token: null,
        //         err: "ecs not exist",
        const { symmetricKey, token, err } = await hs.HandleGet(ctx.headers);
        if (err != null) {
            ctx.status = 500;
            ctx.body = Buffer.from("decrypt header error");
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
            ctx.body = Buffer.from(ECTResponseObj.err);
            return;
        }
        //console.log("response data:", ECTResponseObj.encryptedBody);
        //console.log("response data to string:", ECTResponseObj.encryptedBody.toString());
        console.log("response data:", ECTResponseObj.encryptedBodyBuffer);

        ctx.body = ECTResponseObj.encryptedBodyBuffer;
    });

    //user GetRawBody to get body buffer
    //this example in ctx.rawBody
    router.post("/test/post",GetRawBody, async (ctx) => {

        //check header
        const v = await hs.HandlePost(ctx.headers, ctx.rawBody);
        if (v == null) {
            ctx.status = 500;
            ctx.body = Buffer.from("decrypt header error");
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
