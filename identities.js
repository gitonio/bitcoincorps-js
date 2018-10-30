EC = require('elliptic').ec;
var ec = new EC('secp256k1');
//var Tx = require('./blockcoin').Tx
//var TxOut  = require('./blockcoin').TxOut
class Tx {

    constructor(id, tx_ins, tx_outs) {
        this.id = id,
        this.tx_ins = tx_ins,
        this.tx_outs = tx_outs
    }

    sign_input(index, private_key) {
        let message = spend_message(this, index)
        let signature = private_key.sign(message)
        this.tx_ins[index].signature = signature
    }

    verify_input(index, public_key) {
        tx_in = this.tx_ins[index]
        message = spend_message(index)
        return public_key.verify(tx_in.signature, message)
    }


}

class TxIn {

    constructor(tx_id, index, signature) {
        this.tx_id = tx_id,
        this.index = index,
        this.signature = signature
    }

    spend_message() {
        return `${this.tx_id}:${this.index}`
    }

    outpoint() {
        return { tx_id: this.tx_id, index: this.index }
    }

}

class TxOut {

    constructor(tx_id, index, amount, public_key) {
        this.tx_id = tx_id,
        this.index = index,
        this.amount = amount,
        this.public_key = public_key
    }

    outpoint() {
        return { tx_id: this.tx_id, index: this.index }
    }

    toJSON() {
        return {
            "tx_id":this.tx_id,
            "index":this.index,
            "amount":this.amount,
            "public_key":this.public_key.getPublic().encode('hex')
        }
    }
}

class Block {
    constructor(txns, timestamp, signature) {
        if (timestamp == null) {
            timestamp = Date.now()
        }
        this.timestamp = timestamp
        this.signature = signature
        this.txns = txns
    }

    message() {
        return JSON.stringify({"timestamp": this.timestamp, "txns": this.txns})
    }

    sign(private_key) {
        this.signature = private_key.sign(this.message)
    }
}

//bob_private_key = ec.genKeyPair();
//console.log('bobs:', bob_private_key.getPrivate('hex'))
//bob_public_key = ec.keyFromPublic(bob_private_key.getPublic())
//console.log('bobs:', bob_private_key.getPublic().encode('hex'))
let bobs_pk = 'bd099a5bd74a5025032341e19a76bc16cea5c4567d69ed210e914ce5ea2c2ffd'
let bob_private_key = ec.keyFromPrivate(bobs_pk)
let bobs_pu = '046d4c68376f4177d291ca0db634d31217c8e8c3b2a0a88f92b67ddd815aa48d53bd9bc9585e3900d4d279a154d4c2a3d3b927575e6748327ddbf728b599164261'
let bob_public_key = ec.keyFromPublic(bob_private_key.getPublic())
//key = ec.genKeyPair()

//alice_private_key = ec.genKeyPair();
//alice_public_key = ec.keyFromPublic(alice_private_key.getPublic())
//console.log('alice:', alice_private_key.getPrivate('hex'))
//console.log('alice:', alice_private_key.getPublic().encode('hex'))
alice_pk = 'e08badc18f1f4299a303e6ba00c7a2e6d5313184fc319eabe322a27c836ffb6f'
alice_pu = '043f1e71d0b72e5407a4b3674b49189b92e4c4bb954acb1bf08caf2aa5590d866b3ecaad7e3f7b9d3ca84cb7d6e72f1240c543f547c47128e222cf182be3e555d2'
let alice_private_key = ec.keyFromPrivate(alice_pk)
let alice_public_key = ec.keyFromPublic(alice_private_key.getPublic())

// bank_pk = '95c3a65ff777353ec203c64a44f62d29a461fb45f867ff157333aa0c7b2216a2'
// bank_pu = '04dd8d882e6a7430b0f48381f281a37f6df4e3ff7a2e90e45885d74b5d52909b1669af3251d9d94c627f07ad83d7fa79a41c0b9a408a36a549dc82a0ac7b43834f'
//  let bank_private_k = ec.genKeyPair();
//  let bank_public_k = ec.keyFromPublic(bank_private_k.getPublic())
//  console.log('bank pk:', bank_private_k.getPrivate('hex'))
//  console.log('bank pu:', bank_private_k.getPublic().encode('hex'))
// bank_pk2 = 'ceb410c88ee4fdb49ce38b78f27dae8328d3bcba1a6654ae2696e2cafc6ce8aa'
// bank_pu2 = '04f8d10ee0f5ed396267081e887935e52835485b3183534f76c687d4c1b13cdeba6532f5fb83f1a50720abb990f7f00a3b4099b27155ee733baed374ac8d5ea22f'


function user_private_key(name) {
    name_to_key = {
        "alice":    alice_private_key,
        "bob":      bob_private_key
    }
    return name_to_key[name]
}

function user_public_key(name) {
    let private_key = user_private_key(name)
    return ec.keyFromPublic(private_key.getPublic())

}

function bank_private_key(id) {
    id_to_key = {
        0:    '95c3a65ff777353ec203c64a44f62d29a461fb45f867ff157333aa0c7b2216a2',
        1:    'ceb410c88ee4fdb49ce38b78f27dae8328d3bcba1a6654ae2696e2cafc6ce8aa'
    }
    return ec.keyFromPrivate(id_to_key[id])
}

function bank_public_key(id) {
    return ec.keyFromPublic(bank_private_key(id).getPublic()) 
}

function airdrop_tx() {
    id = "1"
    tx_outs = [
        new TxOut(id, 0, 500000, bob_public_key),
        new TxOut(id, 1, 500000, alice_public_key)
    ]
    tx = new Tx(id, [], tx_outs)
    return tx
}
module.exports.user_private_key = user_private_key
module.exports.user_public_key = user_public_key
module.exports.alice_public_key = alice_public_key
module.exports.alice_private_key = alice_private_key
module.exports.bank_private_key = bank_private_key
module.exports.bank_public_key = bank_public_key
module.exports.bob_public_key = bob_public_key
module.exports.airdrop_tx = airdrop_tx
