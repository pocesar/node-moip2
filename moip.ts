'use strict';

import crypto = require('crypto');
import request = require('request');
import Bluebird = require('bluebird');
import util = require('util');

export interface IMoipCustomError extends Error {
    errors: IMoipError[];
    code: number;
}

export class MoipError implements IMoipCustomError {
    public name: string;
    public message: string;

    constructor(public errors: IMoipError[], public code: number) {
        var err: any = Error;
        err.captureStackTrace(this, MoipError);
        this.name = 'MoipError';

        var errStrs: string[] = [];

        if (typeof errors === 'object') {

            this.errors.forEach((error) => {
                errStrs.push(`${error.code} [${error.path}]: ${error.description}`);
            });

        } else {
            this.errors = <any>[this.errors];
        }

        this.message = errStrs.join("\n");
    }
}

util.inherits(MoipError, Error);

export enum IMoipMethod {
    get,
    put,
    del,
    post
}

export interface IMoipError {
    code: string;
    path: string;
    description: string;
}

export interface IMoipHATEOAS {
    title?: string;
    href?: string;
    redirectHref?: string;
}

export interface IMoipLinks {
    [index: string]: IMoipHATEOAS|{[index: string]: IMoipHATEOAS};
    self: IMoipHATEOAS;
}

export interface IMoipResponse<T> {
    id: string;
    ownId: string;
    createdAt?: string;
    updatedAt?: string;
    _links?: T;
}

export interface IMoipCustomerResponse extends IMoipResponse<IMoipLinks>, IMoipCustomer {

}

export interface IMoipCheckoutLinks {
    payOnlineBankDebitItau?: IMoipHATEOAS;
    payOnlineBankDebitBB?: IMoipHATEOAS;
    payCreditCard?: IMoipHATEOAS;
    payOnlineBankDebitBradesco?: IMoipHATEOAS;
    payBoleto?: IMoipHATEOAS;
    payOnlineBankDebitBanrisul?: IMoipHATEOAS;
}

export interface IMoipOrderLinks extends IMoipLinks {
    checkout: IMoipCheckoutLinks;
}

export interface IMoipEvents {
    events: IMoipEvent[];
}

export interface IMoipOrderResponse extends IMoipResponse<IMoipOrderLinks>, IMoipOrder, IMoipEvents {
    status: string;
    amount: IMoipOrderAmount;
    payments: any[];
    refunds: any[];
    entries: any[];
    receivers: IMoipReceiver[];
    shippingAddress: IMoipShippingAddress;
}

export interface IMoipPaymentLinks extends IMoipCheckoutLinks {
    order: IMoipHATEOAS;
    checkout: IMoipCheckoutLinks;
}

export interface IMoipFee {
    type: string;
    amount: number;
}

export interface IMoipPaymentResponse extends IMoipResponse<IMoipPaymentLinks>, IMoipPayment, IMoipEvents {
    status: string;
    fees: IMoipFee[];
    fundingInstrument: IMoipFundingInstrument;
}

export enum IMoipOrderStatus {
    CREATED=<any>'CREATED',
    WAITING=<any>'WAITING',
    PAID=<any>'PAID',
    NOT_PAID=<any>'NOT_PAID',
    REVERTED=<any>'REVERTED'
}

export enum IMoipPaymentStatus {
    WAITING = <any>'WAITING',
    AUTHORIZED = <any>'AUTHORIZED',
    IN_ANALYSIS = <any>'IN_ANALYSIS',
    CANCELLED = <any>'CANCELLED',
    REFUNDED = <any>'REFUNDED'
}

export interface IMoipEventResourceBase extends IMoipEvents {
    id: string;
    amount: IMoipAmount;
    createdAt: string;
    updatedAt: string;
}

export interface IMoipEventResourceOrder extends IMoipEventResourceBase {
    status: IMoipOrderStatus;
}

export interface IMoipEventResourcePayment extends IMoipEventResourceBase, IMoipFundingInstrumentCreditCard {
    status: IMoipPaymentStatus;
}

export interface IMoipEventResource {
    order?: IMoipEventResourceOrder;
    payment?: IMoipEventResourcePayment;
}

export interface IMoipWebhook {
    event?: string;
    createdAt?: string;
    resource?: IMoipEventResource;
}

export interface IMoipEvent {
    createdAt: string;
    description: string;
    type: string;
}

export interface IMoipReceiver {
    amount: {
        fees: number;
        refunds: number;
        total: number;
    };
    moipAccount: {
        fullname: string;
        login: string;
        id: string;
    };
    type: string;
}


export interface IMoipFundingInstrumentCreditCardHolder {
    fullname: string;
    birthDate: string;
    taxDocument: IMoipTaxDocument;
    phone: IMoipPhone;
}

export interface IMoipFundingInstrumentBoleto {
    expirationDate: string;
    instructionLines: {
        first: string;
        second: string;
        third: string;
    };
    logoUri?: string;
    lineCode?: string;
}

export interface IMoipFundingInstrumentDebit {
    bankNumber: string;
    expirationDate: string;
    returnUri: string;
}

export interface IMoipFundingInstrumentCreditCard {
    hash: string;
    holder: IMoipFundingInstrumentCreditCardHolder;
}

export enum IMoipPaymentMethod {
    ONLINE_BANK_DEBIT=<any>'ONLINE_BANK_DEBIT',
    BOLETO=<any>'BOLETO',
    CREDIT_CARD=<any>'CREDIT_CARD'
}

export interface IMoipFundingInstrument {
    method: IMoipPaymentMethod;
    creditCard?: IMoipFundingInstrumentCreditCard;
    boleto?: IMoipFundingInstrumentBoleto;
    onlineBankDebit?: IMoipFundingInstrumentDebit;
}

export interface IMoipPayment {
    installmentCount?: number;
    fundingInstrument: IMoipFundingInstrument;
}

export interface IMoipPhone {
    countryCode: string;
    areaCode: string;
    number: string;
}

export interface IMoipTaxDocument {
    type: string;
    number: string;
}

export interface IMoipShippingAddress {
    city: string;
    complement: string;
    district: string;
    street: string;
    streetNumber: string;
    zipCode: string;
    state: string;
    country: string;
}

export interface IMoipCustomer {
    ownId: string;
    fullname: string;
    email: string;
    birthDate: string;
    taxDocument: IMoipTaxDocument;
    phone: IMoipPhone;
    shippingAddress: IMoipShippingAddress;
}

export interface IMoipSubtotals {
    shipping?: number;
    addition?: number;
    discount?: number;
    items?: number;
}

export interface IMoipAmount {
    currency: string;
    subtotals: IMoipSubtotals;
}

export interface IMoipOrderAmount extends IMoipAmount {
    total: number;
    fees: number;
    refunds: number;
    liquid: number;
    otherReceivers: number;
}

export interface IMoipItem {
    product: string;
    quantity: number;
    detail: string;
    price: number;
}

export interface IMoipOrder {
    ownId: string;
    amount: IMoipAmount;
    items: IMoipItem[];
    customer: IMoipCustomer;
}



export class Moip {
    static JS = {
        dev: '//assets.moip.com.br/integration/moip.min.js',
        prod: '//assets.moip.com.br/integration/moip.min.js'
    };
    private auth: string;
    public production: boolean;
    private env: string;

    constructor(token: string, key: string, production: boolean = false){
        this.auth = 'Basic ' + (new Buffer(token + ':' + key)).toString('base64');
        this.production = production;
        if (production === true) {
            this.env = 'https://api.moip.com.br/v2';
        } else {
            this.env = 'https://sandbox.moip.com.br/v2';
        }
    }

    js() {
        if (this.production) {
            return Moip.JS.prod;
        }
        return Moip.JS.dev;
    }

    private _request<T>(method: IMoipMethod, uri: string, data: Object) {
        return new Bluebird<T>((resolve, reject) => {
            switch (method) {
                case IMoipMethod.del:
                case IMoipMethod.get:
                case IMoipMethod.put:
                case IMoipMethod.post:
                    request({
                        method: IMoipMethod[method],
                        url: this.env + uri,
                        strictSSL: true,
                        json: true,
                        body: data,
                        headers: {
                            Authorization: this.auth
                        }
                    }, (error, response, body) => {
                        if (!error && response.statusCode >= 200 && response.statusCode < 300) {
                            resolve(body);
                        } else if (body.errors) {
                            reject(new MoipError(body.errors, response.statusCode));
                        } else if (error) {
                            reject(error);
                        } else if (body.ERROR) {
                            reject(new MoipError([{
                                code: '?',
                                path: '?',
                                description: body.ERROR
                            }], response.statusCode));
                        } else {
                            reject(new Error(body));
                        }
                    });

                    break;
                default:
                    reject(new Error('Invalid method'));
            }
        }).bind(this);
    }

    createCustomer(customer: IMoipCustomer){
        return this._request<IMoipCustomerResponse>(IMoipMethod.post, '/customers', customer);
    }

    getCustomer(customerId: string){
        return this._request<IMoipCustomerResponse>(IMoipMethod.get, '/customers/' + customerId, {});
    }

    createOrder(order: IMoipOrder) {
        return this._request<IMoipOrderResponse>(IMoipMethod.post, '/orders', order);
    }

    getOrder(orderId: string) {
        return this._request<IMoipOrderResponse>(IMoipMethod.get, '/orders/' + orderId, {});
    }

    createPayment(payment: IMoipPayment, orderId: string) {
        return this._request<IMoipPaymentResponse>(IMoipMethod.post, '/orders/' + orderId + '/payments', payment);
    }

    getPayment(paymentId: string) {
        return this._request<IMoipPaymentResponse>(IMoipMethod.get, '/payments/' + paymentId, {});
    }

}