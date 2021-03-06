"use strict";
/*
MIT License

Copyright (c) 2019 Cyril Dever

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.decrypt = exports.encrypt = exports.derive = exports.verify = exports.sign = exports.getPublic = exports.kdf = void 0;
/**
 * Note: This module is based off the original eccrypto module.
 */
var crypto_1 = require("crypto-browserify");
var elliptic_1 = require("elliptic");
var secp256k1_1 = __importDefault(require("secp256k1"));
var ec = new elliptic_1.ec('secp256k1');
var sha256 = function (msg) {
    return crypto_1.createHash('sha256').update(msg).digest();
};
var hmacSha256 = function (key, msg) {
    return crypto_1.createHmac('sha256', key).update(msg).digest();
};
var aes128CtrEncrypt = function (iv, key, plaintext) {
    var cipher = crypto_1.createCipheriv('aes-128-ctr', key, iv);
    var firstChunk = cipher.update(plaintext);
    var secondChunk = cipher.final();
    return Buffer.concat([iv, firstChunk, secondChunk]);
};
var aes128CtrDecrypt = function (iv, key, ciphertext) {
    var cipher = crypto_1.createDecipheriv('aes-128-ctr', key, iv);
    var firstChunk = cipher.update(ciphertext);
    var secondChunk = cipher.final();
    return Buffer.concat([firstChunk, secondChunk]);
};
// Compare two buffers in constant time to prevent timing attacks
var equalConstTime = function (b1, b2) {
    if (b1.length !== b2.length) {
        return false;
    }
    var res = 0;
    for (var i = 0; i < b1.length; i++) { // eslint-disable-line no-loops/no-loops
        res |= b1[i] ^ b2[i];
    }
    return res === 0;
};
var pad32 = function (msg) {
    if (msg.length < 32) {
        var buff = Buffer.alloc(32).fill(0);
        msg.copy(buff, 32 - msg.length);
        return buff;
    }
    else
        return msg;
};
// The KDF as implemented in Parity mimics Geth's implementation
exports.kdf = function (secret, outputLength) { return new Promise(function (resolve) {
    var ctr = 1;
    var written = 0;
    var result = Buffer.from('');
    while (written < outputLength) { // eslint-disable-line no-loops/no-loops
        var ctrs = Buffer.from([ctr >> 24, ctr >> 16, ctr >> 8, ctr]);
        var hashResult = sha256(Buffer.concat([ctrs, secret]));
        result = Buffer.concat([result, hashResult]);
        written += 32;
        ctr += 1;
    }
    resolve(result);
}); };
/**
 * Compute the public key for a given private key.
 *
 * @param {Buffer} privateKey - A 32-byte private key
 * @return {Promise<Buffer>} A promise that resolve with the 65-byte public key or reject on wrong private key.
 * @function
 */
exports.getPublic = function (privateKey) { return new Promise(function (resolve, reject) {
    return privateKey.length !== 32
        ? reject(new Error('Private key should be 32 bytes long'))
        : resolve(Buffer.from(secp256k1_1["default"].publicKeyConvert(secp256k1_1["default"].publicKeyCreate(privateKey), false)));
} // See https://github.com/wanderer/secp256k1-node/issues/46
); };
/**
 * Create an ECDSA signature.
 *
 * @param {Buffer} privateKey - A 32-byte private key
 * @param {Buffer} msg - The message being signed, no more than 32 bytes
 * @return {Promise.<Buffer>} A promise that resolves with the signature and rejects on bad key or message.
 */
exports.sign = function (privateKey, msg) { return new Promise(function (resolve, reject) {
    if (privateKey.length !== 32) {
        reject(new Error('Private key should be 32 bytes long'));
    }
    else if (msg.length <= 0) {
        reject(new Error('Message should not be empty'));
    }
    else if (msg.length > 32) {
        reject(new Error('Message is too long (max 32 bytes)'));
    }
    else {
        var padded = pad32(msg);
        var signed = secp256k1_1["default"].ecdsaSign(padded, privateKey).signature;
        resolve(Buffer.from(secp256k1_1["default"].signatureExport(signed)));
    }
}); };
/**
 * Verify an ECDSA signature.
 *
 * @param {Buffer} publicKey - A 65-byte public key
 * @param {Buffer} msg - The message being verified
 * @param {Buffer} sig - The signature
 * @return {Promise.<true>} A promise that resolves on correct signature and rejects on bad key or signature
 */
exports.verify = function (publicKey, msg, sig) { return new Promise(function (resolve, reject) {
    if (publicKey.length !== 65) {
        reject(new Error('Public key should 65 bytes long'));
    }
    else if (msg.length <= 0) {
        reject(new Error('Message should not be empty'));
    }
    else if (msg.length > 32) {
        reject(new Error('Message is too long (max 32 bytes)'));
    }
    else {
        var passed = pad32(msg);
        try {
            var signed = secp256k1_1["default"].signatureImport(sig);
            if (secp256k1_1["default"].ecdsaVerify(signed, passed, publicKey)) {
                resolve(true);
            }
            else {
                reject(new Error('Bad signature'));
            }
        }
        catch (e) {
            reject(new Error('Invalid signature'));
        }
    }
}); };
/**
 * Derive shared secret for given private and public keys.
 *
 * @param {Buffer} privateKey - Sender's private key (32 bytes)
 * @param {Buffer} publicKey - Recipient's public key (65 bytes)
 * @return {Promise.<Buffer>} A promise that resolves with the derived shared secret (Px, 32 bytes) and rejects on bad key
 */
exports.derive = function (privateKey, publicKey) { return new Promise(function (resolve, reject) {
    if (privateKey.length !== 32) {
        reject(new Error("Bad private key, it should be 32 bytes but it's actually " + privateKey.length + " bytes long"));
    }
    else if (publicKey.length !== 65) {
        reject(new Error("Bad public key, it should be 65 bytes but it's actually " + publicKey.length + " bytes long"));
    }
    else if (publicKey[0] !== 4) {
        reject(new Error('Bad public key, a valid public key would begin with 4'));
    }
    else {
        var keyA = ec.keyFromPrivate(privateKey);
        var keyB = ec.keyFromPublic(publicKey);
        var Px = keyA.derive(keyB.getPublic()); // BN instance
        resolve(Buffer.from(Px.toArray()));
    }
}); };
/**
 * Encrypt message for given recepient's public key.
 *
 * @param {Buffer} publicKeyTo - Recipient's public key (65 bytes)
 * @param {Buffer} msg - The message being encrypted
 * @param {?{?iv: Buffer, ?ephemPrivateKey: Buffer}} opts - You may also specify initialization vector (16 bytes) and ephemeral private key (32 bytes) to get deterministic results.
 * @return {Promise.<Buffer>} - A promise that resolves with the ECIES structure serialized
 */
exports.encrypt = function (publicKeyTo, msg, opts) { return __awaiter(void 0, void 0, void 0, function () {
    var ephemPrivateKey;
    return __generator(this, function (_a) {
        /* eslint-disable @typescript-eslint/strict-boolean-expressions */
        opts = opts || {};
        ephemPrivateKey = opts.ephemPrivateKey || crypto_1.randomBytes(32);
        return [2 /*return*/, exports.derive(ephemPrivateKey, publicKeyTo)
                .then(function (sharedPx) { return exports.kdf(sharedPx, 32); })
                .then(function (hash) { return __awaiter(void 0, void 0, void 0, function () {
                var encryptionKey, iv, macKey, cipherText, HMAC;
                return __generator(this, function (_a) {
                    encryptionKey = hash.slice(0, 16);
                    iv = opts.iv || crypto_1.randomBytes(16) // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    ;
                    macKey = sha256(hash.slice(16));
                    cipherText = aes128CtrEncrypt(iv, encryptionKey, msg);
                    HMAC = hmacSha256(macKey, cipherText);
                    return [2 /*return*/, exports.getPublic(ephemPrivateKey).then(function (ephemPublicKey) {
                            return Buffer.concat([ephemPublicKey, cipherText, HMAC]);
                        })];
                });
            }); })
            /* eslint-enable @typescript-eslint/strict-boolean-expressions */
        ];
    });
}); };
var metaLength = 1 + 64 + 16 + 32;
/**
 * Decrypt message using given private key.
 *
 * @param {Buffer} privateKey - A 32-byte private key of recepient of the message
 * @param {Ecies} encrypted - ECIES serialized structure (result of ECIES encryption)
 * @return {Promise.<Buffer>} - A promise that resolves with the plaintext on successful decryption and rejects on failure
 */
exports.decrypt = function (privateKey, encrypted) { return new Promise(function (resolve, reject) {
    if (encrypted.length < metaLength) {
        reject(new Error("Invalid Ciphertext. Data is too small. It should ba at least " + metaLength));
    }
    else if (encrypted[0] !== 4) {
        reject(new Error("Not a valid ciphertext. It should begin with 4 but actually begin with " + encrypted[0]));
    }
    else {
        // deserialize
        var ephemPublicKey = encrypted.slice(0, 65);
        var cipherTextLength = encrypted.length - metaLength;
        var iv_1 = encrypted.slice(65, 65 + 16);
        var cipherAndIv_1 = encrypted.slice(65, 65 + 16 + cipherTextLength);
        var ciphertext_1 = cipherAndIv_1.slice(16);
        var msgMac_1 = encrypted.slice(65 + 16 + cipherTextLength);
        // check HMAC
        resolve(exports.derive(privateKey, ephemPublicKey)
            .then(function (sharedPx) { return exports.kdf(sharedPx, 32); })
            .then(function (hash) {
            var encryptionKey = hash.slice(0, 16);
            var macKey = sha256(hash.slice(16));
            var currentHMAC = hmacSha256(macKey, cipherAndIv_1);
            if (!equalConstTime(currentHMAC, msgMac_1)) {
                return Promise.reject(new Error('Incorrect MAC'));
            }
            // decrypt message
            var plainText = aes128CtrDecrypt(iv_1, encryptionKey, ciphertext_1);
            return Buffer.from(new Uint8Array(plainText));
        }));
    }
}); };
__exportStar(require("./model"), exports);


exports.__esModule = true;
module.exports = require('./node');