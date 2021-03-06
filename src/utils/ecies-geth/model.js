"use strict";
/*
MIT License

Copyright (c) 2021 Cyril Dever

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
exports.__esModule = true;
exports.KeyPath = exports.Path = void 0;
exports.Path = function (account, scope, keyIndex) { return ({
    account: account,
    scope: scope,
    keyIndex: keyIndex
}); };
var parse = function (value) {
    var parts = value.split('/');
    if (parts.length !== 4 || parts[0] !== 'm') {
        throw new Error('invalid value for path');
    }
    return exports.Path(parts[1], parts[2], parts[3]);
};
var next = function (value, increment) {
    var parsed = parse(value);
    var index = parseInt(parsed.keyIndex);
    var actualIncrement = increment !== undefined && increment > 1 ? increment : 1;
    var newValue = 'm/' + parsed.account + '/' + parsed.scope + '/' + (index + actualIncrement).toString(10);
    return exports.KeyPath(newValue);
};
var setValue = function (value) {
    var parsed = parse(value);
    if (parseInt(parsed.account) > Math.pow(2, 16) - 1 || parseInt(parsed.scope) > Math.pow(2, 16) - 1 || parseInt(parsed.keyIndex) > Math.pow(2, 21) - 1) {
        throw new Error('invalid path with value exceeding its limits');
    }
    return value;
};
var valueOf = function (value) { return function () {
    var parsed = parse(value);
    return parseInt(parsed.account) * Math.pow(2, 37) + parseInt(parsed.scope) * Math.pow(2, 21) + parseInt(parsed.keyIndex);
}; };
/**
 * Build an immutable key path
 *
 * @param {string} value - The path string
 * @returns an instance of KeyPath
 * @throws invalid value for path
 * @throws invalid path with value exceeding its limits
 */
exports.KeyPath = function (value) { return ({
    value: setValue(value),
    parse: function () { return parse(value); },
    next: function (increment) { return next(value, increment); },
    valueOf: valueOf(value)
}); };
