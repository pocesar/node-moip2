/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
export interface IMoipCustomError extends Error {
    errors: IMoipError[];
    code: number;
}
export declare class MoipError extends Error implements IMoipCustomError {
    errors: IMoipError[];
    code: number;
    name: string;
    message: string;
    constructor(errors: IMoipError[], code: number);
}
export declare type WebhookEvents = WebhookEventOrder | WebhookEventPayment | WebhookEventRefund | WebhookEventMultiorder | WebhookEventMultipayment | WebhookEventEntry | WebhookEventTransfer;
export declare type WebhookEventOrder = "ORDER.CREATED" | "ORDER.WAITING" | "ORDER.PAID" | "ORDER.NOT_PAID" | "ORDER.REVERTED";
export declare type WebhookEventPayment = "PAYMENT.WAITING" | "PAYMENT.IN_ANALYSIS" | "PAYMENT.PRE_AUTHORIZED" | "PAYMENT.AUTHORIZED" | "PAYMENT.CANCELLED" | "PAYMENT.REFUNDED" | "PAYMENT.REVERSED" | "PAYMENT.SETTLED";
export declare type WebhookEventRefund = "REFUND.REQUESTED" | "REFUND.COMPLETED" | "REFUND.FAILED";
export declare type WebhookEventMultiorder = "MULTIORDER.CREATED" | "MULTIORDER.PAID" | "MULTIORDER.NOT_PAID" | "MULTIORDER.REVERTED";
export declare type WebhookEventMultipayment = "MULTIPAYMENT.WAITING" | "MULTIPAYMENT.IN_ANALYSIS" | "MULTIPAYMENT.AUTHORIZED" | "MULTIPAYMENT.CANCELLED" | "MULTIPAYMENT.REFUNDED";
export declare type WebhookEventEntry = "ENTRY.SCHEDULED" | "ENTRY.SETTLED";
export declare type WebhookEventTransfer = "TRANSFER.REQUESTED" | "TRANSFER.COMPLETED" | "TRANSFER.FAILED";
export declare type OAuthScope = "CREATE_ORDERS" | "VIEW_ORDERS" | "CREATE_PAYMENTS" | "VIEW_PAYMENTS";
export declare enum RequestMethod {
    get = 0,
    put = 1,
    delete = 2,
    post = 3,
}
export interface IMoipError {
    code: string;
    path: string;
    description: string;
}
export interface Webhook {
    events: WebhookEvents[];
    target: string;
    media: string;
}
export interface WebhookRequest {
    resourceId: string;
    event?: WebhookEvents;
}
export interface WebhookRequestResponse {
    id: string;
    resourceId: string;
    event: WebhookEvents;
    url: string;
    status: OrderStatus | PaymentStatus;
    sentAt: string;
}
export interface WebhookNotificationOrder extends OrderResponseBase, Response<OrderLinks> {
}
export interface WebhookNotificationPayment extends PaymentResponseBase, Response<Links> {
}
export interface WebhookNotification {
    event: WebhookEvents;
    resource: {
        payment?: WebhookNotificationPayment;
        order?: WebhookNotificationOrder;
    };
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
    [index: string]: HATEOAS | {
        [index: string]: HATEOAS;
    };
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
export interface OrderResponseBase extends Order {
    status: string;
    amount: OrderAmount;
    payments: any[];
    refunds: any[];
    entries: any[];
    receivers: Receiver[];
    shippingAddress: Address;
}
export interface OrderResponse extends OrderResponseBase, Response<OrderLinks>, Events {
}
export interface PaymentLinks extends CheckoutLinks {
    order: HATEOAS;
    checkout: CheckoutLinks;
}
export declare type PaymentResponseFeeType = "TRANSACTION" | "PRE_PAYMENT";
export interface Fee {
    type: PaymentResponseFeeType;
    amount: number;
}
export interface PaymentResponseBase {
    status: PaymentStatus;
    amount: ResponseAmount;
    fees: Fee[];
    fundingInstrument: FundingInstrument;
}
export interface PaymentResponse extends PaymentResponseBase, Response<PaymentLinks>, Payment, Events {
}
export declare type OrderStatus = "CREATED" | "WAITING" | "PAID" | "NOT_PAID" | "REVERTED";
export declare type PaymentStatus = "CREATED" | "WAITING" | "IN_ANALYSIS" | "PRE_AUTHORIZED" | "AUTHORIZED" | "CANCELLED" | "REFUNDED" | "REVERSED" | "SETTLED";
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
    birthdate: string;
    taxDocument: TaxDocument;
    phone?: Phone;
    billingAddress?: Address;
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
export declare type PaymentMethod = "CREDIT_CARD" | "BOLETO" | "ONLINE_BANK_DEBIT" | "WALLET";
export interface FundingInstrument {
    method: PaymentMethod;
    creditCard?: FundingInstrumentCreditCard;
    boleto?: FundingInstrumentBoleto;
    onlineBankDebit?: FundingInstrumentDebit;
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
    name: string;
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
export interface ResponseAmount {
    total: number;
    fees: number;
    refunds: number;
    liquid: number;
    currency: "BRL";
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
    description?: string;
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
export interface OAuthRequestResponse {
    accessToken: string;
    access_token: string;
    scope: string;
    moipAccountId: string;
}
export interface OAuthRequest {
    appId: string;
    appSecret: string;
    redirectUri: string;
    grantType: "AUTHORIZATION_CODE";
    code: string;
}
export interface RequestOptions {
    headers?: {
        [index: string]: any;
    };
    version?: 'v2' | '';
}
export declare class Moip {
    static JS: {
        dev: string;
        prod: string;
    };
    private auth;
    production: boolean;
    private env;
    appId: string;
    version: string;
    appSecret: string;
    constructor(token: string, key: string, production?: boolean, appId?: string, appSecret?: string);
    js(): string;
    setAppId(id: string): this;
    setAppSecret(id: string): this;
    request<T, U>(method: RequestMethod, uri: string, data?: U, options?: RequestOptions): Bluebird<T>;
    createCustomer(customer: Customer): Bluebird<CustomerResponse>;
    getCustomer(customerId: string): Bluebird<CustomerResponse>;
    createOrder(order: Order): Bluebird<OrderResponse>;
    getOrder(orderId: string): Bluebird<OrderResponse>;
    createPayment(payment: Payment, orderId: string): Bluebird<PaymentResponse>;
    getPayment(paymentId: string): Bluebird<PaymentResponse>;
    resendWebhook(resourceId: string, event?: WebhookEvents): Bluebird<WebhookRequestResponse>;
    setNotification(events: WebhookEvents[], endpoint: string): Bluebird<WebhookResponse>;
    deleteNotification(id: string): Bluebird<any>;
    getNotifications(): Bluebird<WebhookResponse[]>;
    getOAuthUrl(redirectUri: string, scope: OAuthScope[]): string;
    getOAuthInstance(): OAuth;
}
export declare class OAuth {
    private parent;
    code: string;
    scope: OAuthScope[];
    accessToken: string;
    constructor(parent: Moip);
    static factory(parent: Moip): OAuth;
    readonly headers: {
        Authorization: string;
    };
    setCode(code: string): this;
    setScope(scope: string): this;
    getAccount(id: string): Bluebird<AccountResponse>;
    createAccount(accountData: Account): Bluebird<AccountResponse>;
    createBankAccount(moipAccountId: string, bankAccount: BankAccount): Bluebird<BankAccountResponse>;
    getBankAccount(bankAccountId: string): Bluebird<BankAccountResponse>;
    getBankAccounts(moipAccountId: string): Bluebird<BankAccountsResponse>;
    deleteBankAccount(bankAccountId: string): Bluebird<{}>;
    updateBankAccount(bankAccountId: string, partial: BankAccount): Bluebird<BankAccountResponse>;
    createTransfer(transfer: Transfer): Bluebird<TransferResponse>;
    extract(query: string | {
        [index: string]: any;
    }): this;
    getAccessToken(redirectUri: string): Bluebird<OAuthRequestResponse>;
}
