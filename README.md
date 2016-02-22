# Moip 2

Typescript Moip API 2.0 para Node.js

## Install

```
$ npm install @pocesar/moip2 --save
```

## Usage

```js
var Moip = require('@pocesar/moip2').Moip;

var moip = new Moip('token', 'chave', true);

moip.createCustomer({
    birthDate: '0000-00-00',
    email: 'email@example.com',
    fullname: 'Full Name',
    ownId: 'ownUserId',
    phone: {
        areaCode: '00',
        countryCode: '00',
        number: '00000000'
    },
    taxDocument: {
        number: '00000000',
        type: 'CPF'
    },
    shippingAddress:{
        city: 'Cidade',
        complement: 'Complemento',
        country: 'BRA',
        district: 'Bairro',
        state: 'XX',
        street: 'RUA',
        streetNumber: 'NUMERO',
        zipCode: '00000000'
    }
}).then(function(customer){
    delete customer._links;

    return this.createOrder({
        amount: {
            currency: 'BRL',
            subtotals: {}
        },
        customer: customer,
        items: [{
            detail: '',
            price: 50000,
            product: 'Compra',
            quantity: 1
        }],
        ownId: 'ownOrderId'
    });
}).then(function(order){

    return this.createPayment({
        fundingInstrument: {
            method: 'BOLETO',
            boleto: {
                expirationDate: '2015-05-12',
                instructionLines: {
                    first: 'first',
                    second: 'second',
                    third: 'thid'
                }
            }
        }
    }, order.id);
}).then(function(payment){
    console.log('Sucesso!', payment);
}).catch('MoipError', function(err){
    err.errors.forEach(function(e){
        console.log(e.code + ' > ' + e.path + ' > ' + e.description);
    });
}).catch(console.error.bind(console));
```

## Debug

Setting the `DEBUG=moip2,moip2:full` environment variable will make the library display all the requests being made

## License

GPLv3