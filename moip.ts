'use strict';

import * as request from 'request';
import * as Bluebird from 'bluebird';

export interface IMoipCustomError extends Error {
    errors: IMoipError[];
    code: number;
}

export class MoipError extends Error implements IMoipCustomError {
    public name: string;
    public message: string;

    constructor(public errors: IMoipError[], public code: number) {
        super();

        var err: any = Error;
        err.captureStackTrace(this, MoipError);
        this.name = 'MoipError';

        var errStrs: string[] = [];

        if (typeof errors === 'object' && errors.length) {

            this.errors.forEach((error) => {
                errStrs.push(`${error.code} [${error.path}]: ${error.description}`);
            });

        } else {
            this.errors = <any>[this.errors];
        }

        this.message = errStrs.join("\n") || ('' + this.errors);
    }
}

Object.defineProperty(MoipError.prototype, 'constructor', {
    value: MoipError,
    configurable: true
});

export enum RequestMethod {
    get,
    put,
    delete,
    post
}

export interface IMoipError {
    code: string;
    path: string;
    description: string;
}

export interface Webhook {
    events: string[];
    target: string;
    media: string;
}

export interface WebhookResponse extends Webhook {
    token: string;
    id: string;
}

export interface HATEOAS {
    title?: string;
    href?: string;
    redirectHref?: string;
}

export interface Links {
    [index: string]: HATEOAS | { [index: string]: HATEOAS };
    self: HATEOAS;
}

export interface Response<T> {
    id: string;
    ownId: string;
    createdAt?: string;
    updatedAt?: string;
    _links?: T;
}

export interface CustomerResponse extends Response<Links>, Customer {

}

export interface CheckoutLinks {
    payOnlineBankDebitItau?: HATEOAS;
    payOnlineBankDebitBB?: HATEOAS;
    payCreditCard?: HATEOAS;
    payOnlineBankDebitBradesco?: HATEOAS;
    payBoleto?: HATEOAS;
    payOnlineBankDebitBanrisul?: HATEOAS;
}

export interface OrderLinks extends Links {
    checkout: CheckoutLinks;
}

export interface Events {
    events: Event[];
}

export interface OrderResponse extends Response<OrderLinks>, Order, Events {
    status: string;
    amount: OrderAmount;
    payments: any[];
    refunds: any[];
    entries: any[];
    receivers: Receiver[];
    shippingAddress: ShippingAddress;
}

export interface PaymentLinks extends CheckoutLinks {
    order: HATEOAS;
    checkout: CheckoutLinks;
}

export interface Fee {
    type: string;
    amount: number;
}

export type PaymentResponseType = 'TRANSACTION' | 'PRE_PAYMENT';

export interface PaymentResponse extends Response<PaymentLinks>, Payment, Events {
    status: string;
    type: PaymentResponseType;
    fees: Fee[];
    fundingInstrument: FundingInstrument;
}

export type OrderStatus = 'CREATED' | 'WAITING' | 'PAID' | 'NOT_PAID' | 'REVERTED';
export type PaymentStatus = 'CREATED' | 'WAITING' | 'IN_ANALYSIS' | 'PRE_AUTHORIZED' | 'AUTHORIZED' | 'CANCELLED' | 'REFUNDED' | 'REVERSED' | 'SETTLED';

export interface EventResourceBase extends Events {
    id: string;
    amount: Amount;
    createdAt: string;
    updatedAt: string;
}

export interface EventResourceOrder extends EventResourceBase {
    status: OrderStatus;
}

export interface EventResourcePayment extends EventResourceBase, FundingInstrumentCreditCard {
    status: PaymentStatus;
}

export interface EventResource {
    order?: EventResourceOrder;
    payment?: EventResourcePayment;
}

export interface Event {
    createdAt: string;
    description: string;
    type: string;
}

export interface Receiver {
    amount: {
        fixed?: number;
        percentual?: number;
        fees?: number;
        refunds?: number;
        total?: number;
    };
    moipAccount: {
        fullname?: string;
        login?: string;
        id: string;
    };
    type: string;
}


export interface FundingInstrumentCreditCardHolder {
    fullname: string;
    birthDate: string;
    taxDocument: TaxDocument;
    phone: Phone;
}

export interface FundingInstrumentBoleto {
    expirationDate: string;
    instructionLines: {
        first: string;
        second: string;
        third: string;
    };
    logoUri?: string;
    lineCode?: string;
}

export interface FundingInstrumentDebit {
    bankNumber: '001' | '237' | '341' | '041';
    expirationDate: string;
    returnUri: string;
}

export interface FundingInstrumentCreditCard {
    hash: string;
    holder: FundingInstrumentCreditCardHolder;
}

export type PaymentMethod = 'CREDIT_CARD' | 'BOLETO' | 'ONLINE_DEBIT' | 'WALLET';

export interface FundingInstrument {
    method: PaymentMethod;
    creditCard?: FundingInstrumentCreditCard;
    boleto?: FundingInstrumentBoleto;
    onlineDebit?: FundingInstrumentDebit;
}

export interface Payment {
    installmentCount?: number;
    fundingInstrument: FundingInstrument;
    delayCapture?: boolean;
}

export interface Phone {
    countryCode: '55';
    areaCode: string;
    number: string;
}

export interface TaxDocument {
    type?: 'CPF' | 'CNPJ';
    number?: string;
}

export interface ShippingAddress {
    city: string;
    complement: string;
    district: string;
    street: string;
    streetNumber: string;
    zipCode: string;
    state: string;
    country: string;
}

export interface Customer {
    ownId: string;
    fullname: string;
    email: string;
    birthDate?: string;
    taxDocument: TaxDocument;
    phone: Phone;
    shippingAddress?: ShippingAddress;
}

export interface Subtotals {
    shipping?: number;
    addition?: number;
    discount?: number;
}

export interface Amount {
    currency: 'BRL';
    subtotals: Subtotals;
}

export interface OrderAmount extends Amount {
    total: number;
    fees: number;
    refunds: number;
    liquid: number;
    otherReceivers: number;
}

export interface Item {
    /** Nome do produto */
    product: string;
    /** Quantidade */
    quantity: number;
    /** Detalhes */
    detail?: string;
    /** Centavos */
    price: number;
}

export interface Order {
    /** ID próprio */
    ownId: string;
    amount: Amount;
    items: Item[];
    customer: string | Customer;
    receivers: Receiver[];
}

export class Moip {
    static JS = {
        dev: '//assets.moip.com.br/integration/moip.min.js',
        prod: '//assets.moip.com.br/integration/moip.min.js'
    };
    private auth: string;
    public production: boolean;
    private env: string;

    constructor(token: string, key: string, production: boolean = false) {
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

    private _request<T>(method: RequestMethod, uri: string, data: Object) {
        return new Bluebird<T>((resolve, reject) => {
            switch (method) {
                case RequestMethod.delete:
                case RequestMethod.get:
                case RequestMethod.put:
                case RequestMethod.post:
                    request({
                        method: RequestMethod[method],
                        url: this.env + String(uri),
                        strictSSL: true,
                        json: true,
                        body: data,
                        headers: {
                            Authorization: this.auth
                        }
                    }, (error, response, body) => {
                        console.error(method, RequestMethod[method], this.env + String(uri), error, data, this.auth, response, body);

                        if (!error && response.statusCode >= 200 && response.statusCode < 300) {
                            resolve(body);
                        } else if (body && body.errors && body.errors.length) {
                            reject(new MoipError(body.errors, response.statusCode));
                        } else if (error) {
                            reject(error instanceof Error ? error : new Error(error));
                        } else if (body && body.ERROR) {
                            reject(new MoipError([{
                                code: '?',
                                path: '?',
                                description: body.ERROR
                            }], response.statusCode));
                        } else {
                            reject(new Error(body ? body : response.statusCode));
                        }
                    });

                    break;
                default:
                    reject(new Error('Invalid method'));
            }
        }).bind(this);
    }

    createCustomer(customer: Customer) {
        return this._request<CustomerResponse>(RequestMethod.post, '/customers', customer);
    }

    getCustomer(customerId: string) {
        return this._request<CustomerResponse>(RequestMethod.get, `/customers/${customerId}`, {});
    }

    createOrder(order: Order) {
        return this._request<OrderResponse>(RequestMethod.post, '/orders', order);
    }

    getOrder(orderId: string) {
        return this._request<OrderResponse>(RequestMethod.get, `/orders/${orderId}`, {});
    }

    createPayment(payment: Payment, orderId: string) {
        return this._request<PaymentResponse>(RequestMethod.post, `/orders/${orderId}/payments`, payment);
    }

    getPayment(paymentId: string) {
        return this._request<PaymentResponse>(RequestMethod.get, `/payments/${paymentId}`, {});
    }

    setNotification(events: string[], endpoint: string) {
        let Request: Webhook = {
            events: events,
            media: 'WEBHOOK',
            target: endpoint
        };
        return this._request<WebhookResponse>(RequestMethod.post, '/preferences/notifications', Request);
    }

    deleteNotification(id: string) {
        return this._request<{}>(RequestMethod.delete, `/preferences/notifications/${id}`, {});
    }

    getNotifications() {
        return this._request<WebhookResponse[]>(RequestMethod.get, '/preferences/notifications', {});
    }

}