var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const BN = require('bn.js');
const uuidv1 = require('uuid/v1')





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
            this.last_transfer.signature, 
            recipient_public_key
            )
        let transfer = new Transfer(
            owner_private_key.sign(message),
            recipient_public_key
        )
        this.transfers.push(transfer)
    }
    validate(coin) {
        let previous_transfer = this.transfers[0]
        console.log(coin)
        coin.transfers.map((transfer,i)=>{
            if(i==0){
                console.log('Initial')
                //message = transfer.public_key.getPublic().encode('hex')
                //console.log('Intial:',i ,bank_public_key.verify(message, transfer.signature))
    
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


    copyInstance (original) {
        var copied = Object.assign(
          Object.create(
            Object.getPrototypeOf(original)
          ),
          original
        );
        return copied;
      }

    issue(public_key) {
        let transfer = new Transfer(
            null,
            public_key
        )

        let coin = new BankCoin([transfer])
        //console.log('lt', coin.last_transfer())
        //this.coins[coin.id]  = Object.assign({}, coin)
        //this.coins[coin.id]  = JSON.parse(JSON.stringify(coin))
        this.coins[coin.id] = this.copyInstance(coin)

        return coin
    }

    observe_coin(coin) {
        let last_observation = this.coins[coin.id]

        console.log(last_observation.transfers ==
            coin.transfers[last_observation.transfers.length])
        coin.validate()
        this.coins[coin.id] = this.copyInstance(coin)

    }

    fetch_coins(public_key) {
        let coins = []
        //console.log('lt0:',this.coins)
        
        Object.values(this.coins).map(coin=>{
            //console.log('lt:', coin.last_transfer().public_key)
            if (coin.last_transfer().public_key == public_key) {
                coins.push(coin) 
            }
        })
        return coins
    }


}

module.exports.Bank = Bank 