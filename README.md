## Authority Charge system for DApps and Power users
Pay as you go model for transactions on EOS. You don't have to mess up with PowerUps or other costs. 
The costs are estimated based on network conditions (typically around 0.0020 EOS - lower than a typical powerup Tx). 
This is a pure pay as you go model for power users. For questions go to [EOS Authority Telegram](https://t.me/eosauthority).

## How it works
The code is simple, a handful of vanilla javascript files that are very readable. You should have a good understanding of what the code does as it requires your private key to function.

- You specify your action on index.js (You can specify anything you want, see example actions below.)

- This node script sends your transaction to the API to estimate how much CPU/NET it will cost.

- Two additional actions are inserted to your transaction within the chargeSignPush function of client.js

  First: Payment transaction to cover for the costs (Pay as you go)
  
  Second: ONLY_BILL_FIRST_AUTHORIZER to cover for the cost of the transaction

- Your transaction is sent to the Blockchain for processing.

## Installation
1. Git clone:

    ```
    $ git clone https://github.com/eosauthority/authority_charge_client.git
    ```

2. Install the packages on `package.json`:

    ```
    $ npm install
    ```

3. Copy the example environment variable to edit it:

    ```
    $ cp .env.example .env
    ```

4. Edit the .env file, modify three variables

    ```
    SIGNING_ACCOUNT=your_account_name_usually_12_character
    SIGNING_KEY=5J2KcecEzQhnBQmjaqvsA4UzdtZF2aCsTwqF2pVXtibZLS1a8JB_use_your_key
    SIGNING_PERMISSION=active
    ```

5. Edit and review index.js (simple file)

    ```
    Pick an action that you want to use, some example actions are setup for you.
    Replace account, name, data, etc.
    ```
    
6. Run index.js (This executes transaction)
   
   ```
   $ node index.js
   ```
   

## How to use

1. Simply edit the index.js file with the actions you want the system to execute.
2. Make sure the .env is setup correctly with your signing keys and account.
3. The system dynamically charges a fee based on network conditions your client application is set to MAX_FEE of 0.1000 which means you will never be charged more than 0.1000 EOS for a transaction irrespective of market conditions.

## Example actions

There are no limits to the types of actions you are allowed to create. All actions on EOS are against a contract (account) and have a name (action) associated with it. Each of them also have a data parameter to specify further information requried to execute the transaction.

#### Simple transfer action

  ```
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
  ```
In the above example, eosio.token transfer is initiated from b1 to payauthority. The quantity has to be specified as above with 4 decimal places. Memo is optional.


#### Claim rewards action (For BPs)

  ```
  var actions = [{
        account: 'eosio',
        name: "claimrewards",
        data: {
            owner: 'eosauthority',
        }
    }];
  ```
Replace owner with your account name.


#### Generic actions

If you want to generate further transactions, go to https://eosauthority.com/wallet, find the account (eg: eosio) go to the contract actions tab and you can generate these transactions.





