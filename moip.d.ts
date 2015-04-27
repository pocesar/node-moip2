declare module Moip {
    import Bluebird = Promise;

    export enum IMoipMethod {
        get = 0,
        put = 1,
        del = 2,
        post = 3,
    }
    export interface IMoipHATEOAS {
        title?: string;
        href?: string;
        redirectHref?: string;
    }
    export interface IMoipLinks {
        [index: string]: IMoipHATEOAS | {
            [index: string]: IMoipHATEOAS;
        };
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
    export interface IMoipOrderLinks extends IMoipLinks {
        checkout: {
            payOnlineBankDebitItau: IMoipHATEOAS;
            payOnlineBankDebitBB: IMoipHATEOAS;
            payCreditCard: IMoipHATEOAS;
            payOnlineBankDebitBradesco: IMoipHATEOAS;
            payBoleto: IMoipHATEOAS;
            payOnlineBankDebitBanrisul: IMoipHATEOAS;
        };
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
    export interface IMoipPaymentLinks {
        order: IMoipHATEOAS;
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
        ONLINE_BANK_DEBIT = 0,
        BOLETO = 1,
        CREDIT_CARD = 2,
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
        static JS: {
            dev: string;
            prod: string;
        };
        private auth;
        production: boolean;
        private env;
        constructor(token: string, key: string, production?: boolean);
        js(): string;
        private _request<T>(method, uri, data);
        createCustomer(customer: IMoipCustomer): Bluebird<IMoipCustomerResponse>;
        getCustomer(customerId: string): Bluebird<IMoipCustomerResponse>;
        createOrder(order: IMoipOrder): Bluebird<IMoipOrderResponse>;
        getOrder(orderId: string): Bluebird<IMoipOrderResponse>;
        createPayment(payment: IMoipPayment, orderId: string): Bluebird<IMoipPaymentResponse>;
        getPayment(paymentId: string): Bluebird<IMoipPaymentResponse>;
    }
}

declare module '@pocesar/moip2' {
    export = Moip;
}