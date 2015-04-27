/// <reference path="typings/tsd.d.ts" />
'use strict';
var request = require('request');
var Bluebird = require('bluebird');
(function (IMoipMethod) {
    IMoipMethod[IMoipMethod["get"] = 0] = "get";
    IMoipMethod[IMoipMethod["put"] = 1] = "put";
    IMoipMethod[IMoipMethod["del"] = 2] = "del";
    IMoipMethod[IMoipMethod["post"] = 3] = "post";
})(exports.IMoipMethod || (exports.IMoipMethod = {}));
var IMoipMethod = exports.IMoipMethod;
(function (IMoipPaymentMethod) {
    IMoipPaymentMethod[IMoipPaymentMethod["ONLINE_BANK_DEBIT"] = 0] = "ONLINE_BANK_DEBIT";
    IMoipPaymentMethod[IMoipPaymentMethod["BOLETO"] = 1] = "BOLETO";
    IMoipPaymentMethod[IMoipPaymentMethod["CREDIT_CARD"] = 2] = "CREDIT_CARD";
})(exports.IMoipPaymentMethod || (exports.IMoipPaymentMethod = {}));
var IMoipPaymentMethod = exports.IMoipPaymentMethod;
var Moip = (function () {
    function Moip(token, key, production) {
        if (production === void 0) { production = false; }
        this.auth = 'Basic ' + (new Buffer(token + ':' + key)).toString('base64');
        this.production = production;
        if (production === true) {
            this.env = 'https://api.moip.com.br/v2';
        }
        else {
            this.env = 'https://test.moip.com.br/v2';
        }
    }
    Moip.prototype.js = function () {
        if (this.production) {
            return Moip.JS.prod;
        }
        return Moip.JS.dev;
    };
    Moip.prototype._request = function (method, uri, data) {
        var _this = this;
        return new Bluebird(function (resolve, reject) {
            switch (method) {
                case 2 /* del */:
                case 0 /* get */:
                case 1 /* put */:
                case 3 /* post */:
                    request({
                        method: IMoipMethod[method],
                        url: _this.env + uri,
                        strictSSL: true,
                        json: true,
                        body: data,
                        headers: {
                            Authorization: _this.auth
                        }
                    }, function (error, response, body) {
                        if (!error && response.statusCode >= 200 && response.statusCode < 300) {
                            resolve(body);
                        }
                        else if (error) {
                            reject(error);
                        }
                        else {
                            reject(body);
                        }
                    });
                    break;
                default:
                    reject(new Error('Invalid method'));
            }
        }).bind(this);
    };
    Moip.prototype.createCustomer = function (customer) {
        return this._request(3 /* post */, '/customers', customer);
    };
    Moip.prototype.getCustomer = function (customerId) {
        return this._request(0 /* get */, '/customers/' + customerId, {});
    };
    Moip.prototype.createOrder = function (order) {
        return this._request(3 /* post */, '/orders', order);
    };
    Moip.prototype.getOrder = function (orderId) {
        return this._request(0 /* get */, '/orders/' + orderId, {});
    };
    Moip.prototype.createPayment = function (payment, orderId) {
        payment.fundingInstrument.method = IMoipPaymentMethod[payment.fundingInstrument.method];
        return this._request(3 /* post */, '/orders/' + orderId + '/payments', payment);
    };
    Moip.prototype.getPayment = function (paymentId) {
        return this._request(0 /* get */, '/payments/' + paymentId, {});
    };
    Moip.JS = {
        dev: '//assets.moip.com.br/integration/moip.js',
        prod: '//assets.moip.com.br/integration/moip.min.js'
    };
    return Moip;
})();
exports.Moip = Moip;
