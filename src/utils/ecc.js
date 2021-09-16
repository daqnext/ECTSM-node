/*
 * @Author: your name
 * @Date: 2021-09-12 19:27:27
 * @LastEditTime: 2021-09-16 21:31:32
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ECTSM-node/src/utils/ecc.js
 */
const secp256k1= require('secp256k1')
const crypto = require('crypto-browserify');
const ecies = require('./node.js');

var ecc={} 

ecc.GenSecp256k1KeyPair=function() {
	var ecdh=  crypto.createECDH("secp256k1");
	ecdh.generateKeys();
	return {
		"pubKey":ecdh.getPublicKey(),
		"priKey":ecdh.getPrivateKey()
	}
}

ecc.PublicKeyToString=function(publicKey){
	return publicKey.toString("base64")
}

ecc.PrivateKeyToString=function(PrivateKey){
	 return PrivateKey.toString("base64");
}


ecc.StrBase64ToPrivateKey=function(priKeyStrBase64) {
	try {
		return Buffer.from(priKeyStrBase64, "base64")
	} catch (error) {
		return null;
	}
}

ecc.StrBase64ToPublicKey=function(pubKeyStrBase64) {
	try {
		var bufferKey=Buffer.from(pubKeyStrBase64, "base64")
		return Buffer.from(secp256k1.publicKeyConvert(bufferKey, false)) //uncompressed
	} catch (error) {
		return null;
	}
}

ecc.ECCEncrypt=async function(publicKey,buffer) {
	var encrypted = await ecies.encrypt(publicKey, buffer) ;
	return encrypted;
}

ecc.ECCDecrypt=async function(privateKey,buffer) {
	var decrypted = await ecies.decrypt(privateKey, buffer);
	return decrypted;
}


module.exports= {ecc}

 