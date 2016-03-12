'use strict';

import * as request from 'request';
import * as Bluebird from 'bluebird';
import { inspect } from 'util';

var debug = require('debug')('moip2');
var debugFull = require('debug')('moip2:full');

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

export type OAuthScope = 'CREATE_ORDERS' | 'VIEW_ORDERS' | 'CREATE_PAYMENTS' | 'VIEW_PAYMENTS';

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
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    _links?: T;
}

export interface Customer {
    id?: string;
    ownId: string;
    fullname: string;
    email: string;
    birthDate?: string;
    taxDocument: TaxDocument;
    phone: Phone;
    shippingAddress?: Address;
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
    shippingAddress: Address;
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

export interface MoipAccount {
    fullname?: string;
    login?: string;
    email?: string;
    /** Identificador de conta Moip: Ex. MPA-1A23BC4D5E6F. */
    id: string;
}

export interface Receiver {
    amount: {
        fixed?: number;
        percentual?: number;
        fees?: number;
        refunds?: number;
        total?: number;
    };
    moipAccount: MoipAccount;
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

export interface MainActivity {
    cnae: string;
    description: string;
}

export interface Company {
    /* Fantasia */
    name: string;
    /* Razão social */
    businessName: string;
    taxDocument: TaxDocument;
    mainActivity: MainActivity;
    openingDate: string;
    phone: Phone;
    address: Address;
}

export interface Address {
    city: string;
    complement: string;
    district: string;
    street: string;
    streetNumber: string;
    zipCode: string;
    state: string;
    country: string;
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

export interface EmailAddress {
    address: string;
    confirmed?: boolean;
}

export interface Person {
    name: string;
    lastName: string;
    birthDate: string;
    taxDocument: TaxDocument;
    phone: Phone;
    address: Address;
}

export interface BusinessSegment {
    id: string;
}

export interface TOSAcceptance {
    acceptedAt: string;
    ip: string;
    userAgent: string;
}

export interface Account {
    type: 'MERCHANT' | 'CONSUMER';
    person: Person;
    email: EmailAddress;
    company?: Company;
    businessSegment?: BusinessSegment;
    site?: string;
    transparentAccount?: boolean;
    tosAcceptance?: TOSAcceptance;
}

export interface AccountResponse extends Account, Response<Links> {
    channelId: string;
    login: string;
}

export interface Order {
    /** ID próprio */
    ownId: string;
    amount: Amount;
    items: Item[];
    customer: string | Customer;
    receivers?: Receiver[];
}

export interface BankAccountHolder {
    fullname: string;
    taxDocument: TaxDocument;
}

export interface BankAccount {
    type: 'CHECKING' | 'SAVING';
    bankNumber: string;
    agencyNumber: number;
    /** Dígito verificador da agência. */
    agencyCheckNumber: number;
    accountNumber: number;
    /** Dígito verificador da conta. */
    accountCheckNumber: number;
    holder: BankAccountHolder;
}

export interface Summary {
    amount: number;
    count: number;
}

export interface BankAccountsResponse extends Response<Links> {
    summary: Summary;
    bankAccounts: BankAccountResponse[];
}

export interface BankAccountResponse extends BankAccount, Response<Links> {
    bankName: string;
    status: 'NOT_VERIFIED' | 'IN_VERIFICATION' | 'VERIFIED' | 'INVALID';
}

export interface TransferInstrument {
    method: 'BANK_ACCOUNT' | 'MOIP_ACCOUNT';
    bankAccount?: BankAccount;
    moipAccount?: MoipAccount;
}

export interface Transfer {
    amount: number;
    transferInstrument: TransferInstrument;
}

export interface TransferResponse extends Transfer, Response<Links> {
    id: string;
    fee: number;
    status: 'REQUESTED' | 'COMPLETED' | 'FAILED';
}

export interface TransfersResponse extends Response<Links> {
    summary: Summary;
    transfers: TransferResponse[];
}

function inspectObj(obj: Object) {
    return inspect(obj, false, 10, true);
}

export interface RequestOptions {
    headers?: {[index: string]: any};
    version?: 'v2' | '';
}

export class Moip {
    static JS = {
        dev: '//assets.moip.com.br/v2/moip.min.js',
        prod: '//assets.moip.com.br/v2/moip.min.js'
    };
    private auth: string;
    public production: boolean;
    private env: string;
    public appId: string = '';
    public version: string = 'v2';
    public appSecret: string = '';

    constructor(token: string, key: string, production: boolean = false, appId?: string, appSecret?: string) {
        this.auth = 'Basic ' + (new Buffer(token + ':' + key)).toString('base64');
        this.production = production;

        if (production === true) {
            this.env = 'https://api.moip.com.br';
        } else {
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

    setAppId(id: string) {
        this.appId = id;

        return this;
    }

    setAppSecret(id: string) {
        this.appSecret = id;

        return this;
    }

    request<T, U>(method: RequestMethod, uri: string, data?: U, options?: RequestOptions) {
        return new Bluebird<T>((resolve, reject) => {
            uri = '' + uri;

            let url: string = this.env + (options && typeof options.version !== 'undefined' ? options.version : this.version).replace(/^([^\/])/, '/$1');

            let headers: any = {
                Authorization: this.auth
            };

            if (options && options.headers) {
                headers = options.headers
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
                            debug("\nmethod: ", RequestMethod[method], "\nurl: ", url + uri, "\ndata:", inspectObj(data), "\nbody:", inspectObj(body),  "\nerror:", (error && error.stack));
                        }
                        if (debugFull.enabled) {
                            debugFull("\nmethod: ", RequestMethod[method], "\nurl: ", url + uri, "\nerror:", (error && error.stack), "\ndata:", inspectObj(data), this.auth, "\nsocket:", response, "\nbody:", inspectObj(body));
                        }

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
        return this.request<CustomerResponse, Customer>(RequestMethod.post, '/customers', customer);
    }

    getCustomer(customerId: string) {
        return this.request<CustomerResponse, any>(RequestMethod.get, `/customers/${customerId}`);
    }

    createOrder(order: Order) {
        return this.request<OrderResponse, Order>(RequestMethod.post, '/orders', order);
    }

    getOrder(orderId: string) {
        return this.request<OrderResponse, any>(RequestMethod.get, `/orders/${orderId}`);
    }

    createPayment(payment: Payment, orderId: string) {
        return this.request<PaymentResponse, Payment>(RequestMethod.post, `/orders/${orderId}/payments`, payment);
    }

    getPayment(paymentId: string) {
        return this.request<PaymentResponse, any>(RequestMethod.get, `/payments/${paymentId}`);
    }

    setNotification(events: string[], endpoint: string) {
        let Request: Webhook = {
            events: events,
            media: 'WEBHOOK',
            target: endpoint
        };
        return this.request<WebhookResponse, Webhook>(RequestMethod.post, '/preferences/notifications', Request);
    }

    deleteNotification(id: string) {
        return this.request<any, any>(RequestMethod.delete, `/preferences/notifications/${id}`);
    }

    getNotifications() {
        return this.request<WebhookResponse[], any>(RequestMethod.get, '/preferences/notifications');
    }

    getOAuthUrl(redirectUri: string, scope: OAuthScope[]) {
        return `${this.env}/oauth/authorize?responseType=CODE&appId=${this.appId}&redirectUri=${encodeURIComponent(redirectUri)}&scope=${scope.join('|')}`;
    }

}

export class OAuth {

    public code: string;
    public scope: OAuthScope[] = [];
    public accessToken: string = '';

    constructor(private parent: Moip) {
    }

    static factory(parent: Moip) {
        return new this(parent);
    }

    get headers() {
        return {
            Authorization: `OAuth ${this.accessToken}`
        }
    }

    setCode(code: string) {
        this.code = code;

        return this;
    }

    setScope(scope: string) {
        this.scope = scope.split(/[\+\| ]/g).map((value: any) => {
            return <OAuthScope>value.toUpperCase();
        });

        return this;
    }

    getAccount(id: string) {
        return this.parent.request<AccountResponse, any>(RequestMethod.get, `/accounts/${id}`, {}, {
            headers: this.headers
        });
    }

    createAccount(accountData: Account) {
        return this.parent.request<AccountResponse, Account>(RequestMethod.post, `/accounts`, accountData, {
            headers: this.headers
        });
    }

    createBankAccount(moipAccountId: string, bankAccount: BankAccount) {
        return this.parent.request<BankAccountResponse, BankAccount>(RequestMethod.post, `/accounts/${moipAccountId}/bankaccounts`, bankAccount, {
            headers: this.headers
        });
    }

    getBankAccount(bankAccountId: string) {
        return this.parent.request<BankAccountResponse, any>(RequestMethod.get, `/bankaccounts/${bankAccountId}`, {}, {
            headers: this.headers
        });
    }

    getBankAccounts(moipAccountId: string) {
        return this.parent.request<BankAccountsResponse, any>(RequestMethod.get, `/accounts/${moipAccountId}/bankaccounts`, {}, {
            headers: this.headers
        });
    }

    deleteBankAccount(bankAccountId: string) {
        return this.parent.request<any, any>(RequestMethod.delete, `/bankaccounts/${bankAccountId}`, {}, {
            headers: this.headers
        });
    }

    updateBankAccount(bankAccountId: string, partial: BankAccount) {
        return this.parent.request<BankAccountResponse, BankAccount>(RequestMethod.put, `/bankaccounts/${bankAccountId}`, partial, {
            headers: this.headers
        });
    }

    createTransfer(transfer: Transfer) {
        return this.parent.request<TransferResponse, Transfer>(RequestMethod.post, `/transfers`, transfer, {
            headers: this.headers
        })
    }

    extract(query: string | any) {
        if (typeof query === 'string') {
            var code = RegExp('code=([^&]{32})', 'i');
            var scope = RegExp('scope=([^&]+)', 'i');
            var matches: string[];
            if ((matches = code.exec(query)) && matches[1]) {
                this.setCode(matches[1]);
            }
            if ((matches = scope.exec(query)) && matches[1]) {
                this.setScope(matches[1]);
            }
        } else if (typeof query === 'object') {
            if (typeof query['code'] !== 'undefined' && ('' + query['code']).length === 32) {
                this.setScope('' + query['code']);
            }
            if (typeof query['scope'] !== 'undefined' && ('' + query['scope'])) {
                this.setScope('' + query['scope']);
            }
        }

        return this;
    }

    getAccessToken(redirectUri: string) {
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
