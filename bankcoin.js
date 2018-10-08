var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const BN = require('bn.js');
const uuidv1 = require('uuid/v1')
var _ = require('lodash');


function transfer_message(previous_signature, public_key) {
    return JSON.stringify({
        "previous_signature": previous_signature, 
        "next_owner_public_key": public_key
    })
}

class Transfer {
    constructor (signature, public_key) {
        this.signature = signature
        this.public_key = public_key
    }
}

class BankCoin {
    constructor (transfers) {
        this.id = uuidv1()
        this.transfers = transfers
    }

    last_transfer() {
        return this.transfers[this.transfers.length-1]
    }

    transfer( owner_private_key, recipient_public_key) {
        let message = transfer_message(
            this.last_transfer().signature, 
            recipient_public_key
            )
        let transfer = new Transfer(
            owner_private_key.sign(Buffer.from(message,'ascii')),
            recipient_public_key
        )
        this.transfers.push(transfer)
    }
    validate() {
        let previous_transfer = this.transfers[0]
        this.transfers.map((transfer,i)=>{
            console.log(transfer)
            if(i==0){
                console.log('Initial')
    
            } else {
                console.log('Next:',i, previous_transfer.public_key.verify(
                    Buffer.from(transfer_message(previous_transfer.signature, transfer.public_key ),'ascii'),
                    transfer.signature
                ))
                    
            }
     
            previous_transfer = transfer
        })
           
    }

}

class Bank {
    constructor(private_key) {
        if (!private_key) {
            private_key = ec.genKeyPair();
        }
        this.private_key = private_key
        this.public_key = this.private_key.getPublic()

        
        this.coins = {}
    }



    issue(public_key) {
        let transfer = new Transfer(
            null,
            public_key
        )

        let coin = new BankCoin([transfer])
        this.coins[coin.id] =  _.cloneDeep(coin);
        return coin
    }

    observe_coin(coin) {
        let last_observation = this.coins[coin.id]

        console.log(last_observation.transfers ==
            coin.transfers[last_observation.transfers.length])
        coin.validate()
        this.coins[coin.id] =  _.cloneDeep(coin);

    }

    fetch_coins(public_key) {
        let coins = []
        
        Object.values(this.coins).map(coin=>{
            console.log ('fetch:', coin.last_transfer().public_key.getPublic().encode('hex') == (public_key.getPublic().encode('hex'))) 

            if (JSON.stringify(coin.last_transfer().public_key.getPublic()) == JSON.stringify(public_key.getPublic())) {
                coins.push(coin) 
            }
        })
        return coins
    }


}

module.exports.Bank = Bank 