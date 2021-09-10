const { ecc } = require('./src/index.js')
const crypto = require('crypto');
const ecies = require('ecies-geth');



(async () => {

    /////////////////
    var gen_key_pairs=ecc.GenSecp256k1KeyPair()
    console.log("gen_key_pairs pubkey:",ecc.PublicKeyToString(gen_key_pairs.pubKey));
    console.log("gen_key_pairs prikey:",ecc.PrivateKeyToString(gen_key_pairs.priKey));

    /////////////////

    var pubKeyStr = "BMveUrioxvhfjsJ+WqkwXRwpgm+NPwEOFlXPAkhW4+HrI7kMEuklEJjolFQjSBLYDQ76e050fQjybfvAofHtf8M="
    var prikey_string = "To6r0h//zNLAvl/NuS3KPmUhURJOJCt4hOb8K+/7R3s="

    const pubKey = ecc.StrBase64ToPublicKey(pubKeyStr)
    const priKey = ecc.StrBase64ToPrivateKey(prikey_string)

    var encryptedmsg = await ecc.ECCEncrypt(pubKey, Buffer.from('msg to b'));
    var encryptedmsg_base64=encryptedmsg.toString("base64");
    console.log("encrypted:", encryptedmsg_base64);


    var decryptedmsg = await ecc.ECCDecrypt(priKey, Buffer.from(encryptedmsg_base64, "base64"));
    console.log("decryptedmsg:", decryptedmsg.toString());


  


})();
