'use strict';
var request = require('request');
var Bluebird = require('bluebird');
var util = require('util');
var MoipError = (function () {
    function MoipError(errors, code) {
        this.errors = errors;
        this.code = code;
        var err = Error;
        err.captureStackTrace(this, MoipError);
        this.name = 'MoipError';
        var errStrs = [];
        if (typeof errors === 'object') {
            this.errors.forEach(function (error) {
                errStrs.push(error.code + " [" + error.path + "]: " + error.description);
            });
        }
        else {
            this.errors = [this.errors];
        }
        this.message = errStrs.join("\n");
    }
    return MoipError;
})();
exports.MoipError = MoipError;
util.inherits(MoipError, Error);
(function (IMoipMethod) {
    IMoipMethod[IMoipMethod["get"] = 0] = "get";
    IMoipMethod[IMoipMethod["put"] = 1] = "put";
    IMoipMethod[IMoipMethod["del"] = 2] = "del";
    IMoipMethod[IMoipMethod["post"] = 3] = "post";
})(exports.IMoipMethod || (exports.IMoipMethod = {}));
var IMoipMethod = exports.IMoipMethod;
(function (IMoipOrderStatus) {
    IMoipOrderStatus[IMoipOrderStatus["CREATED"] = 'CREATED'] = "CREATED";
    IMoipOrderStatus[IMoipOrderStatus["WAITING"] = 'WAITING'] = "WAITING";
    IMoipOrderStatus[IMoipOrderStatus["PAID"] = 'PAID'] = "PAID";
    IMoipOrderStatus[IMoipOrderStatus["NOT_PAID"] = 'NOT_PAID'] = "NOT_PAID";
    IMoipOrderStatus[IMoipOrderStatus["REVERTED"] = 'REVERTED'] = "REVERTED";
})(exports.IMoipOrderStatus || (exports.IMoipOrderStatus = {}));
var IMoipOrderStatus = exports.IMoipOrderStatus;
(function (IMoipPaymentStatus) {
    IMoipPaymentStatus[IMoipPaymentStatus["WAITING"] = 'WAITING'] = "WAITING";
    IMoipPaymentStatus[IMoipPaymentStatus["AUTHORIZED"] = 'AUTHORIZED'] = "AUTHORIZED";
    IMoipPaymentStatus[IMoipPaymentStatus["IN_ANALYSIS"] = 'IN_ANALYSIS'] = "IN_ANALYSIS";
    IMoipPaymentStatus[IMoipPaymentStatus["CANCELLED"] = 'CANCELLED'] = "CANCELLED";
    IMoipPaymentStatus[IMoipPaymentStatus["REFUNDED"] = 'REFUNDED'] = "REFUNDED";
})(exports.IMoipPaymentStatus || (exports.IMoipPaymentStatus = {}));
var IMoipPaymentStatus = exports.IMoipPaymentStatus;
(function (IMoipPaymentMethod) {
    IMoipPaymentMethod[IMoipPaymentMethod["ONLINE_BANK_DEBIT"] = 'ONLINE_BANK_DEBIT'] = "ONLINE_BANK_DEBIT";
    IMoipPaymentMethod[IMoipPaymentMethod["BOLETO"] = 'BOLETO'] = "BOLETO";
    IMoipPaymentMethod[IMoipPaymentMethod["CREDIT_CARD"] = 'CREDIT_CARD'] = "CREDIT_CARD";
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
            this.env = 'https://sandbox.moip.com.br/v2';
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
                case IMoipMethod.del:
                case IMoipMethod.get:
                case IMoipMethod.put:
                case IMoipMethod.post:
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
                        else if (body.errors) {
                            reject(new MoipError(body.errors, response.statusCode));
                        }
                        else if (error) {
                            reject(error);
                        }
                        else if (body.ERROR) {
                            reject(new MoipError([{
                                    code: '?',
                                    path: '?',
                                    description: body.ERROR
                                }], response.statusCode));
                        }
                        else {
                            reject(new Error(body));
                        }
                    });
                    break;
                default:
                    reject(new Error('Invalid method'));
            }
        }).bind(this);
    };
    Moip.prototype.createCustomer = function (customer) {
        return this._request(IMoipMethod.post, '/customers', customer);
    };
    Moip.prototype.getCustomer = function (customerId) {
        return this._request(IMoipMethod.get, '/customers/' + customerId, {});
    };
    Moip.prototype.createOrder = function (order) {
        return this._request(IMoipMethod.post, '/orders', order);
    };
    Moip.prototype.getOrder = function (orderId) {
        return this._request(IMoipMethod.get, '/orders/' + orderId, {});
    };
    Moip.prototype.createPayment = function (payment, orderId) {
        return this._request(IMoipMethod.post, '/orders/' + orderId + '/payments', payment);
    };
    Moip.prototype.getPayment = function (paymentId) {
        return this._request(IMoipMethod.get, '/payments/' + paymentId, {});
    };
    Moip.JS = {
        dev: '//assets.moip.com.br/integration/moip.min.js',
        prod: '//assets.moip.com.br/integration/moip.min.js'
    };
    return Moip;
})();
exports.Moip = Moip;
