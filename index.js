'use strict';
const request = require('request');
const Bluebird = require('bluebird');
const util_1 = require('util');
var debug = require('debug')('moip2');
var debugFull = require('debug')('moip2:full');
class MoipError extends Error {
    constructor(errors, code) {
        super();
        this.errors = errors;
        this.code = code;
        var err = Error;
        err.captureStackTrace(this, MoipError);
        this.name = 'MoipError';
        var errStrs = [];
        if (typeof errors === 'object' && errors.length) {
            this.errors.forEach((error) => {
                errStrs.push(`${error.code} [${error.path}]: ${error.description}`);
            });
        }
        else {
            this.errors = [this.errors];
        }
        this.message = errStrs.join("\n") || ('' + this.errors);
    }
}
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
class Moip {
    constructor(token, key, production = false, appId, appSecret) {
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
    js() {
        if (this.production) {
            return Moip.JS.prod;
        }
        return Moip.JS.dev;
    }
    setAppId(id) {
        this.appId = id;
        return this;
    }
    setAppSecret(id) {
        this.appSecret = id;
        return this;
    }
    request(method, uri, data, options) {
        return new Bluebird((resolve, reject) => {
            uri = '' + uri;
            let url = this.env + (options && typeof options.version !== 'undefined' ? options.version : this.version).replace(/^([^\/])/, '/$1');
            let headers = {
                Authorization: this.auth
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
                    }, (error, response, body) => {
                        if (debug.enabled) {
                            debug("\nmethod: ", RequestMethod[method], "\nurl: ", url + uri, "\ndata:", inspectObj(data), "\nbody:", inspectObj(body), "\nerror:", (error && error.stack));
                        }
                        if (debugFull.enabled) {
                            debugFull("\nmethod: ", RequestMethod[method], "\nurl: ", url + uri, "\nerror:", (error && error.stack), "\ndata:", inspectObj(data), this.auth, "\nsocket:", response, "\nbody:", inspectObj(body));
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
    }
    createCustomer(customer) {
        return this.request(RequestMethod.post, '/customers', customer);
    }
    getCustomer(customerId) {
        return this.request(RequestMethod.get, `/customers/${customerId}`);
    }
    createOrder(order) {
        return this.request(RequestMethod.post, '/orders', order);
    }
    getOrder(orderId) {
        return this.request(RequestMethod.get, `/orders/${orderId}`);
    }
    createPayment(payment, orderId) {
        return this.request(RequestMethod.post, `/orders/${orderId}/payments`, payment);
    }
    getPayment(paymentId) {
        return this.request(RequestMethod.get, `/payments/${paymentId}`);
    }
    resendWebhook(resourceId, event) {
        let Request = {
            resourceId
        };
        if (event) {
            Request.event = event;
        }
        return this.request(RequestMethod.post, '/webhooks/', Request);
    }
    setNotification(events, endpoint) {
        let Request = {
            events: events,
            media: 'WEBHOOK',
            target: endpoint
        };
        return this.request(RequestMethod.post, '/preferences/notifications', Request);
    }
    deleteNotification(id) {
        return this.request(RequestMethod.delete, `/preferences/notifications/${id}`);
    }
    getNotifications() {
        return this.request(RequestMethod.get, '/preferences/notifications');
    }
    getOAuthUrl(redirectUri, scope) {
        return `${this.env}/oauth/authorize?responseType=CODE&appId=${this.appId}&redirectUri=${encodeURIComponent(redirectUri)}&scope=${scope.join('|')}`;
    }
    getOAuthInstance() {
        return OAuth.factory(this);
    }
}
Moip.JS = {
    dev: '//assets.moip.com.br/v2/moip.min.js',
    prod: '//assets.moip.com.br/v2/moip.min.js'
};
exports.Moip = Moip;
class Subscription {
    constructor(token, key, production = false, appId, appSecret) {
        this.appId = '';
        this.version = 'v1';
        this.appSecret = '';
        this.auth = 'Basic ' + (new Buffer(token + ':' + key)).toString('base64');
        this.production = production;
        if (production === true) {
            this.env = 'https://api.moip.com.br/assinaturas';
        }
        else {
            this.env = 'https://sandbox.moip.com.br/assinaturas';
        }
        if (appId) {
            this.setAppId(appId);
        }
        if (appSecret) {
            this.setAppSecret(appSecret);
        }
    }
    js() {
        if (this.production) {
            return Moip.JS.prod;
        }
        return Moip.JS.dev;
    }
    setAppId(id) {
        this.appId = id;
        return this;
    }
    setAppSecret(id) {
        this.appSecret = id;
        return this;
    }
    request(method, uri, data, options) {
        return new Bluebird((resolve, reject) => {
            uri = '' + uri;
            let url = this.env + (options && typeof options.version !== 'undefined' ? options.version : this.version).replace(/^([^\/])/, '/$1');
            let headers = {
                Authorization: this.auth
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
                    }, (error, response, body) => {
                        if (debug.enabled) {
                            debug("\nmethod: ", RequestMethod[method], "\nurl: ", url + uri, "\ndata:", inspectObj(data), "\nbody:", inspectObj(body), "\nerror:", (error && error.stack));
                        }
                        if (debugFull.enabled) {
                            debugFull("\nmethod: ", RequestMethod[method], "\nurl: ", url + uri, "\nerror:", (error && error.stack), "\ndata:", inspectObj(data), this.auth, "\nsocket:", response, "\nbody:", inspectObj(body));
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
    }
    createPlan(plan) {
        return this.request(RequestMethod.post, '/plans', plan);
    }
    getPlans() {
        return this.request(RequestMethod.get, `/plans`);
    }
    getPlan(planId) {
        return this.request(RequestMethod.get, `/plans/${planId}`);
    }
    activatePlan(planId) {
        return this.request(RequestMethod.put, `/plans/${planId}/activate`);
    }
    inactivatePlan(planId) {
        return this.request(RequestMethod.put, `/plans/${planId}/inactivate`);
    }
    updatePlan(planId, plan) {
        return this.request(RequestMethod.put, `/plans/${planId}`, plan);
    }
    createCustomer(customer, isNew) {
        return this.request(RequestMethod.post, '/customers?new_vault=${isNew}', customer);
    }
    getCustomers() {
        return this.request(RequestMethod.get, `/customers`);
    }
    getCustomer(customerId) {
        return this.request(RequestMethod.get, `/customers/${customerId}`);
    }
    updateCustomer(customerId, customer) {
        return this.request(RequestMethod.put, `/customers/${customerId}`, customer);
    }
    updateCustomerBilling(customerId, customerBilling) {
        return this.request(RequestMethod.put, `/customers/${customerId}/billing_infos`, customerBilling);
    }
    createCustomerSubscription(subscription, isNew) {
        return this.request(RequestMethod.post, '/subscriptions?new_customer=${isNew}', subscription);
    }
    getSubscriptions() {
        return this.request(RequestMethod.get, `/subscriptions`);
    }
    getSubscription(subscriptionId) {
        return this.request(RequestMethod.get, `/subscriptions/${subscriptionId}`);
    }
    suspendSubscription(subscriptionId) {
        return this.request(RequestMethod.put, `/subscriptions/${subscriptionId}/suspend`);
    }
    activateSubscription(subscriptionId) {
        return this.request(RequestMethod.put, `/subscriptions/${subscriptionId}/activate`);
    }
    cancelSubscription(subscriptionId) {
        return this.request(RequestMethod.put, `/subscriptions/${subscriptionId}/cancel`);
    }
    updateSubscription(subscriptionId, subscription) {
        return this.request(RequestMethod.put, `/subscriptions/${subscriptionId}`, subscription);
    }
    getSubscriptionInvoices(subscriptionId) {
        return this.request(RequestMethod.get, `/subscriptions/${subscriptionId}/invoices`);
    }
    getInvoice(invoiceId) {
        return this.request(RequestMethod.get, `/invoices/${invoiceId}`);
    }
    getInvoicePayments(invoiceId) {
        return this.request(RequestMethod.get, `/invoices/${invoiceId}/payments`);
    }
    getPayment(paymentId) {
        return this.request(RequestMethod.get, `/payments/${paymentId}`);
    }
    getOAuthUrl(redirectUri, scope) {
        return `${this.env}/oauth/authorize?responseType=CODE&appId=${this.appId}&redirectUri=${encodeURIComponent(redirectUri)}&scope=${scope.join('|')}`;
    }
    getOAuthInstance() {
        return OAuth.factory(this);
    }
}
exports.Subscription = Subscription;
class OAuth {
    constructor(parent) {
        this.parent = parent;
        this.scope = [];
        this.accessToken = '';
    }
    static factory(parent) {
        return new this(parent);
    }
    get headers() {
        return {
            Authorization: `OAuth ${this.accessToken}`
        };
    }
    setCode(code) {
        this.code = code;
        return this;
    }
    setScope(scope) {
        this.scope = scope.split(/[\+\| ]/g).map((value) => {
            return value.toUpperCase();
        });
        return this;
    }
    getAccount(id) {
        return this.parent.request(RequestMethod.get, `/accounts/${id}`, {}, {
            headers: this.headers
        });
    }
    createAccount(accountData) {
        return this.parent.request(RequestMethod.post, `/accounts`, accountData, {
            headers: this.headers
        });
    }
    createBankAccount(moipAccountId, bankAccount) {
        return this.parent.request(RequestMethod.post, `/accounts/${moipAccountId}/bankaccounts`, bankAccount, {
            headers: this.headers
        });
    }
    getBankAccount(bankAccountId) {
        return this.parent.request(RequestMethod.get, `/bankaccounts/${bankAccountId}`, {}, {
            headers: this.headers
        });
    }
    getBankAccounts(moipAccountId) {
        return this.parent.request(RequestMethod.get, `/accounts/${moipAccountId}/bankaccounts`, {}, {
            headers: this.headers
        });
    }
    deleteBankAccount(bankAccountId) {
        return this.parent.request(RequestMethod.delete, `/bankaccounts/${bankAccountId}`, {}, {
            headers: this.headers
        });
    }
    updateBankAccount(bankAccountId, partial) {
        return this.parent.request(RequestMethod.put, `/bankaccounts/${bankAccountId}`, partial, {
            headers: this.headers
        });
    }
    createTransfer(transfer) {
        return this.parent.request(RequestMethod.post, `/transfers`, transfer, {
            headers: this.headers
        });
    }
    extract(query) {
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
    }
    getAccessToken(redirectUri) {
        return this.parent.request(RequestMethod.post, '/oauth/accesstoken', {
            appId: this.parent.appId,
            appSecret: this.parent.appSecret,
            redirectUri: redirectUri,
            grantType: 'AUTHORIZATION_CODE',
            code: this.code
        }, {
                version: ''
            });
    }
}
exports.OAuth = OAuth;
