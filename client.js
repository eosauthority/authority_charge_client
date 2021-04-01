var {Api, JsonRpc} = require('eosjs');
var {JsSignatureProvider} = require('eosjs/dist/eosjs-jssig');
var fetch = require('node-fetch');
var config = require('./config');

var networkConfig = config['networks'][config.network];
if (!networkConfig) {
    console.error(`Please specify a valid network`);
    process.exit(1);
}


var SIGNING_ACCOUNT = config.signing.account;
if (!SIGNING_ACCOUNT) {
    console.error(`No account specified. You'll be unable to sign`);
    process.exit(1);
}

var SIGNING_KEY = config.signing.key;
if (!SIGNING_KEY) {
    console.error(`No private keys specified. You'll be unable to sign`);
    process.exit(1);
}

var SIGNING_PERMISSION = config.signing.permission;
if (!SIGNING_PERMISSION) {
    console.error(`No permission specified. You'll be unable to sign`);
    process.exit(1);
}

var endpoint = networkConfig.protocol + '://' + networkConfig.host + ':' + networkConfig.port;
var rpc = new JsonRpc(endpoint, {fetch: fetch});

var signatureProvider = new JsSignatureProvider([SIGNING_KEY]);
var api = new Api({rpc, signatureProvider});

var buffer2hex = (buffer) =>
    Array.from(buffer, (x) => ('00' + x.toString(16)).slice(-2)).join('')


async function chargeSignPush(actions) {
    var txHeaders = {
        blocksBehind: 3,
        expireSeconds: 60 * 3,
    }

    var tx = {
        actions: actions
    };

    var authorization = [{actor: SIGNING_ACCOUNT, permission: SIGNING_PERMISSION}];

    //check and insert missing authorizations    
    tx.actions.forEach(function (action) {
        action.authorization = authorization
    });

    try {
        var charge = await serverCharge(SIGNING_ACCOUNT, tx.actions);
    } catch (error) {
        console.error(`Error fetching charge details: `, error.message);
        process.exit(1);
    }

    if (charge && charge.enabled) {
        if (charge.fee > 0) {
            var MAX_FEE = config.max_fee;
            if (charge.fee > MAX_FEE) {
                console.error('Server fee (' + charge.fee + ' EOS) is greater than the max allowed (' + MAX_FEE + ' EOS)');
                process.exit(1);
            }


            //insert charge fee transfer
            tx.actions.unshift({
                account: 'eosio.token',
                name: "transfer",
                authorization: authorization,
                data: {
                    from: SIGNING_ACCOUNT,
                    to: charge.receiver,
                    quantity: charge.fee + ` EOS`,
                    memo: 'charge fee'
                }
            });
        }

        // insert cpu payer's charge action as first action to trigger ONLY_BILL_FIRST_AUTHORIZER
        tx.actions.unshift({
            account: charge.contract_account,
            name: charge.contract_action,
            authorization: [{
                    actor: charge.contract_account,
                    permission: charge.contract_permission
                }],
            data: {
                message: charge.uniqid
            }
        });
        
        console.log('Signing transactions', JSON.stringify(tx, null, 4));


        // https://github.com/EOSIO/eosjs/blob/master/src/eosjs-api.ts#L214-L254
        // get the serialized transaction
        let pushTransactionArgs = await api.transact(
                tx,
                {
                    blocksBehind: txHeaders.blocksBehind,
                    expireSeconds: txHeaders.expireSeconds,
                    // don't sign yet, as we don't have all keys and signing would fail
                    sign: false,
                    // don't broadcast yet, merge signatures first
                    broadcast: false,
                }
        )

        // JSSignatureProvider throws errors when encountering a key that it doesn't have a private key for
        // so we cannot use it for partial signing unless we change requiredKeys
        // https://github.com/EOSIO/eosjs/blob/849c03992e6ce3cb4b6a11bf18ab17b62136e5c9/src/eosjs-jssig.ts#L38
        const availableKeys = await api.signatureProvider.getAvailableKeys()
        const serializedTx = pushTransactionArgs.serializedTransaction
        const signArgs = {chainId: networkConfig.chainId, requiredKeys: availableKeys, serializedTransaction: serializedTx, abis: []}
        pushTransactionArgs = await api.signatureProvider.sign(signArgs)

        const deserializedTx = await api.deserializeTransaction(serializedTx);
        deserializedTx.actions = await api.deserializeActions(deserializedTx.actions);

        var serverTransactionPushArgs = {
            ...pushTransactionArgs,
            serializedTransaction: buffer2hex(pushTransactionArgs.serializedTransaction),
            deserializedTransaction: deserializedTx
        };


//            var transaction = {
//                ...serverTransactionPushArgs.deserializedTransaction,
//                signatures: serverTransactionPushArgs.signatures,
//                
//            };

        try {
            var serverSignResponse = await serverSignPush(serverTransactionPushArgs);
            console.log('Transaction response', serverSignResponse)
        } catch (error) {
            console.error(`Transaction failed: `, error.message);
        }

    } else {
        try {
            console.log('Signing transactions', JSON.stringify(actions, null, 4));
            
            //console.log('TODO: normal tx signing')
            var transactionResponse = await api.transact({
                actions: actions
            }, {
                broadcast: true,
                blocksBehind: 3,
                expireSeconds: 60 * 3,
            });

            console.log('Transaction response', transactionResponse)
        } catch (error) {
            console.error(`Transaction failed: `, error.message);
        }
    }

}

async function serverCharge(account_name, actions) {
    const rawResponse = await fetch(networkConfig.charge.endpoint + '/client-charge', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Version: config.version
        },
        body: JSON.stringify({account_name: account_name, actions: actions}),
    })

    const content = await rawResponse.json()
    if (content.error)
        throw new Error(content.error)


    return content

}

async function serverSignPush(serverTransactionPushArgs) {
    //console.log(JSON.stringify({serverTransactionPushArgs: serverTransactionPushArgs}))
    // insert your server cosign endpoint here
    const rawResponse = await fetch(networkConfig.charge.endpoint + '/sign-push', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Version: config.version
        },
        body: JSON.stringify({serverTransactionPushArgs: serverTransactionPushArgs}),
    })

    const content = await rawResponse.json()

    if (content.error) {
        var errorMessage = content.error.what;
        if (content.error.details && content.error.details[0]) {
            errorMessage += ', ' + content.error.details[0].message;
        }
        throw new Error(errorMessage)
    }


    return content
}



module.exports = {chargeSignPush: chargeSignPush};