var client = require('./client');

//Any action you want. Can also be multiple
var actions = [{
        account: 'eosio.token',
        name: "transfer",
        data: {
            from: 'b1',
            to: 'payauthority',
            quantity: `0.0001 EOS`,
            memo: ''
        }
    }];

/** This does all the work
 *  - Gets an estimate of the fee
 *  - Adds the first biller action to cover transaction costs
 *  - Makes a payment to cover the costs (Max. payment set on .env file)
 */
client.chargeSignPush(actions);

// The output of your transaction will be on console.