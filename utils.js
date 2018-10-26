var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const BN = require('bn.js');
const uuidv1 = require('uuid/v1')
const assert = require('assert');
var Tx =    require('./blockcoin.js').Tx
var TxOut = require('./blockcoin').TxOut
var TxIn = require('./blockcoin').TxIn
var Bank = require('./blockcoin').Bank

function prepare_simple_tx(utxos, sender_private_key, recipient_public_key, amount) {
    sender_public_key = ec.keyFromPublic(sender_private_key.getPublic())
    console.log(Tx.toString())
    let x = new Bank(1, 2,3)
    tx_ins = []
    tx_in_sum = 0
    utxos.map( tx_out =>{
        if (tx_in_sum <= tx_out.amount) {
            tx_ins.push(new TxIn(tx_out.tx_id, tx_out.index, null))
            tx_in_sum += tx_out.amount
        }
    })

    assert(tx_in_sum>=amount)

    tx_id = uuidv1()
    change = tx_in_sum - amount
    tx_outs = [
        new TxOut(tx_id, 0, amount, recipient_public_key),
        new TxOut(tx_id, 1, change, sender_public_key),
    ]

    tx = new Tx(tx_id, tx_ins, tx_outs)
    //console.log('utils:', tx)
    for (let index = 0; index < tx.tx_ins.length; index++) {
        tx.sign_input(index, sender_private_key)
    }

    return tx
}

module.exports.prepare_simple_tx = prepare_simple_tx