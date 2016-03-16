'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var request = require('request');
var Bluebird = require('bluebird');
var util_1 = require('util');
var debug = require('debug')('moip2');
var debugFull = require('debug')('moip2:full');
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
function inspectObj(obj) {
    return util_1.inspect(obj, false, 10, true);
}
var Moip = (function () {
    function Moip(token, key, production, appId, appSecret) {
        if (production === void 0) { production = false; }
        this.appId = '';
        this.version = 'v2';
        this.appSecret = '';
        this.auth = 'Basic ' + (new Buffer(token + ':' + key)).toString('base64');
        this.production = production;
        if (production === true) {
            this.env = 'https://api.moip.com.br';
        }
        else {
            this.env = 'https://sandbox.moip.com.br';
        }
        if (appId) {
            this.setAppId(appId);
        }
        if (appSecret) {
            this.setAppSecret(appSecret);
        }
    }
    Moip.prototype.js = function () {
        if (this.production) {
            return Moip.JS.prod;
        }
        return Moip.JS.dev;
    };
    Moip.prototype.setAppId = function (id) {
        this.appId = id;
        return this;
    };
    Moip.prototype.setAppSecret = function (id) {
        this.appSecret = id;
        return this;
    };
    Moip.prototype.request = function (method, uri, data, options) {
        var _this = this;
        return new Bluebird(function (resolve, reject) {
            uri = '' + uri;
            var url = _this.env + (options && typeof options.version !== 'undefined' ? options.version : _this.version).replace(/^([^\/])/, '/$1');
            var headers = {
                Authorization: _this.auth
            };
            if (options && options.headers) {
                headers = options.headers;
            }
            switch (method) {
                case RequestMethod.delete:
                case RequestMethod.get:
                case RequestMethod.put:
                case RequestMethod.post:
                    request({
                        method: RequestMethod[method],
                        url: url + uri,
                        strictSSL: true,
                        json: true,
                        body: data || {},
                        headers: headers
                    }, function (error, response, body) {
                        if (debug.enabled) {
                            debug("\nmethod: ", RequestMethod[method], "\nurl: ", url + uri, "\ndata:", inspectObj(data), "\nbody:", inspectObj(body), "\nerror:", (error && error.stack));
                        }
                        if (debugFull.enabled) {
                            debugFull("\nmethod: ", RequestMethod[method], "\nurl: ", url + uri, "\nerror:", (error && error.stack), "\ndata:", inspectObj(data), _this.auth, "\nsocket:", response, "\nbody:", inspectObj(body));
                        }
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
        return this.request(RequestMethod.post, '/customers', customer);
    };
    Moip.prototype.getCustomer = function (customerId) {
        return this.request(RequestMethod.get, "/customers/" + customerId);
    };
    Moip.prototype.createOrder = function (order) {
        return this.request(RequestMethod.post, '/orders', order);
    };
    Moip.prototype.getOrder = function (orderId) {
        return this.request(RequestMethod.get, "/orders/" + orderId);
    };
    Moip.prototype.createPayment = function (payment, orderId) {
        return this.request(RequestMethod.post, "/orders/" + orderId + "/payments", payment);
    };
    Moip.prototype.getPayment = function (paymentId) {
        return this.request(RequestMethod.get, "/payments/" + paymentId);
    };
    Moip.prototype.setNotification = function (events, endpoint) {
        var Request = {
            events: events,
            media: 'WEBHOOK',
            target: endpoint
        };
        return this.request(RequestMethod.post, '/preferences/notifications', Request);
    };
    Moip.prototype.deleteNotification = function (id) {
        return this.request(RequestMethod.delete, "/preferences/notifications/" + id);
    };
    Moip.prototype.getNotifications = function () {
        return this.request(RequestMethod.get, '/preferences/notifications');
    };
    Moip.prototype.getOAuthUrl = function (redirectUri, scope) {
        return this.env + "/oauth/authorize?responseType=CODE&appId=" + this.appId + "&redirectUri=" + encodeURIComponent(redirectUri) + "&scope=" + scope.join('|');
    };
    Moip.JS = {
        dev: '//assets.moip.com.br/v2/moip.min.js',
        prod: '//assets.moip.com.br/v2/moip.min.js'
    };
    return Moip;
}());
exports.Moip = Moip;
var OAuth = (function () {
    function OAuth(parent) {
        this.parent = parent;
        this.scope = [];
        this.accessToken = '';
    }
    OAuth.factory = function (parent) {
        return new this(parent);
    };
    Object.defineProperty(OAuth.prototype, "headers", {
        get: function () {
            return {
                Authorization: "OAuth " + this.accessToken
            };
        },
        enumerable: true,
        configurable: true
    });
    OAuth.prototype.setCode = function (code) {
        this.code = code;
        return this;
    };
    OAuth.prototype.setScope = function (scope) {
        this.scope = scope.split(/[\+\| ]/g).map(function (value) {
            return value.toUpperCase();
        });
        return this;
    };
    OAuth.prototype.getAccount = function (id) {
        return this.parent.request(RequestMethod.get, "/accounts/" + id, {}, {
            headers: this.headers
        });
    };
    OAuth.prototype.createAccount = function (accountData) {
        return this.parent.request(RequestMethod.post, "/accounts", accountData, {
            headers: this.headers
        });
    };
    OAuth.prototype.createBankAccount = function (moipAccountId, bankAccount) {
        return this.parent.request(RequestMethod.post, "/accounts/" + moipAccountId + "/bankaccounts", bankAccount, {
            headers: this.headers
        });
    };
    OAuth.prototype.getBankAccount = function (bankAccountId) {
        return this.parent.request(RequestMethod.get, "/bankaccounts/" + bankAccountId, {}, {
            headers: this.headers
        });
    };
    OAuth.prototype.getBankAccounts = function (moipAccountId) {
        return this.parent.request(RequestMethod.get, "/accounts/" + moipAccountId + "/bankaccounts", {}, {
            headers: this.headers
        });
    };
    OAuth.prototype.deleteBankAccount = function (bankAccountId) {
        return this.parent.request(RequestMethod.delete, "/bankaccounts/" + bankAccountId, {}, {
            headers: this.headers
        });
    };
    OAuth.prototype.updateBankAccount = function (bankAccountId, partial) {
        return this.parent.request(RequestMethod.put, "/bankaccounts/" + bankAccountId, partial, {
            headers: this.headers
        });
    };
    OAuth.prototype.createTransfer = function (transfer) {
        return this.parent.request(RequestMethod.post, "/transfers", transfer, {
            headers: this.headers
        });
    };
    OAuth.prototype.extract = function (query) {
        if (typeof query === 'string') {
            var code = RegExp('code=([^&]{32})', 'i');
            var scope = RegExp('scope=([^&]+)', 'i');
            var matches;
            if ((matches = code.exec(query)) && matches[1]) {
                this.setCode(matches[1]);
            }
            if ((matches = scope.exec(query)) && matches[1]) {
                this.setScope(matches[1]);
            }
        }
        else if (typeof query === 'object') {
            if (typeof query['code'] !== 'undefined' && ('' + query['code']).length === 32) {
                this.setScope('' + query['code']);
            }
            if (typeof query['scope'] !== 'undefined' && ('' + query['scope'])) {
                this.setScope('' + query['scope']);
            }
        }
        return this;
    };
    OAuth.prototype.getAccessToken = function (redirectUri) {
        return this.parent.request(RequestMethod.post, '/oauth/accesstoken', {
            appId: this.parent.appId,
            appSecret: this.parent.appSecret,
            redirectUri: redirectUri,
            grantType: 'AUTHORIZATION_CODE',
            code: this.code
        }, {
            version: ''
        });
    };
    return OAuth;
}());
exports.OAuth = OAuth;
