'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var request = require('request');
var Bluebird = require('bluebird');
var debug = require('debug')('moip2');
var MoipError = (function (_super) {
    __extends(MoipError, _super);
    function MoipError(errors, code) {
        _super.call(this);
        this.errors = errors;
        this.code = code;
        var err = Error;
        err.captureStackTrace(this, MoipError);
        this.name = 'MoipError';
        var errStrs = [];
        if (typeof errors === 'object' && errors.length) {
            this.errors.forEach(function (error) {
                errStrs.push(error.code + " [" + error.path + "]: " + error.description);
            });
        }
        else {
            this.errors = [this.errors];
        }
        this.message = errStrs.join("\n") || ('' + this.errors);
    }
    return MoipError;
}(Error));
exports.MoipError = MoipError;
Object.defineProperty(MoipError.prototype, 'constructor', {
    value: MoipError,
    configurable: true
});
(function (RequestMethod) {
    RequestMethod[RequestMethod["get"] = 0] = "get";
    RequestMethod[RequestMethod["put"] = 1] = "put";
    RequestMethod[RequestMethod["delete"] = 2] = "delete";
    RequestMethod[RequestMethod["post"] = 3] = "post";
})(exports.RequestMethod || (exports.RequestMethod = {}));
var RequestMethod = exports.RequestMethod;
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
                case RequestMethod.delete:
                case RequestMethod.get:
                case RequestMethod.put:
                case RequestMethod.post:
                    request({
                        method: RequestMethod[method],
                        url: _this.env + String(uri),
                        strictSSL: true,
                        json: true,
                        body: data,
                        headers: {
                            Authorization: _this.auth
                        }
                    }, function (error, response, body) {
                        debug(method, RequestMethod[method], _this.env + String(uri), error, data, _this.auth, response, body);
                        if (!error && response.statusCode >= 200 && response.statusCode < 300) {
                            resolve(body);
                        }
                        else if (body && body.errors && body.errors.length) {
                            reject(new MoipError(body.errors, response.statusCode));
                        }
                        else if (error) {
                            reject(error instanceof Error ? error : new Error(error));
                        }
                        else if (body && body.ERROR) {
                            reject(new MoipError([{
                                    code: '?',
                                    path: '?',
                                    description: body.ERROR
                                }], response.statusCode));
                        }
                        else {
                            reject(new Error(body ? body : response.statusCode));
                        }
                    });
                    break;
                default:
                    reject(new Error('Invalid method'));
            }
        }).bind(this);
    };
    Moip.prototype.createCustomer = function (customer) {
        return this._request(RequestMethod.post, '/customers', customer);
    };
    Moip.prototype.getCustomer = function (customerId) {
        return this._request(RequestMethod.get, "/customers/" + customerId, {});
    };
    Moip.prototype.createOrder = function (order) {
        return this._request(RequestMethod.post, '/orders', order);
    };
    Moip.prototype.getOrder = function (orderId) {
        return this._request(RequestMethod.get, "/orders/" + orderId, {});
    };
    Moip.prototype.createPayment = function (payment, orderId) {
        return this._request(RequestMethod.post, "/orders/" + orderId + "/payments", payment);
    };
    Moip.prototype.getPayment = function (paymentId) {
        return this._request(RequestMethod.get, "/payments/" + paymentId, {});
    };
    Moip.prototype.setNotification = function (events, endpoint) {
        var Request = {
            events: events,
            media: 'WEBHOOK',
            target: endpoint
        };
        return this._request(RequestMethod.post, '/preferences/notifications', Request);
    };
    Moip.prototype.deleteNotification = function (id) {
        return this._request(RequestMethod.delete, "/preferences/notifications/" + id, {});
    };
    Moip.prototype.getNotifications = function () {
        return this._request(RequestMethod.get, '/preferences/notifications', {});
    };
    Moip.JS = {
        dev: '//assets.moip.com.br/integration/moip.min.js',
        prod: '//assets.moip.com.br/integration/moip.min.js'
    };
    return Moip;
}());
exports.Moip = Moip;
