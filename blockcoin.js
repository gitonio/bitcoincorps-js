var assert = require('assert')
var prepare_simple_tx = require('./utils').prepare_simple_tx

const NUM_BANKS = 3
const BLOCK_TIME = 5
const PORT = 10000
bank = null

//todo logging

function spend_message(tx, index) {
    //console.log('spend_message', tx)
    let outpoint = tx.tx_ins[index].outpoint()
    //todo
    //console.log("OUTPOINT:",outpoint)
    return `${this.tx_id}:${this.index}`
}

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

class Bank {

    constructor(id, private_key) {
        this.id = id
        this.blocks = []
        this.utxo_set = new Map()
        this.mempool = []
        this.private_key = private_key
        this.peer_addresses = {}
        this.utxo = new Map()
    }

    next_id() {
        return this.blocks.length % NUM_BANKS
    }
    
    our_turn() {
        return this.id == this.next_id
    }

    mempool_outpoints() {
        return this.mempool.map(tx=>tx.map(x=>tx_in.outpoint=x))
    }


    fetch_utxos(public_key) {
        let utxos = []
        for (var utxo of this.utxo.values()) {
            if (utxo.public_key.getPublic().encode('hex') == public_key.getPublic().encode('hex')) {
                utxos.push(utxo)
            }
        }
        return utxos
    }

    update_utxo_set(tx) {
        tx.tx_outs.map(tx_out => {

            this.utxo.set(JSON.stringify(tx_out.outpoint()), tx_out)
        })

        tx.tx_ins.map(tx_in => {
            this.utxo.delete(JSON.stringify(tx_in.outpoint()))
        })

    }

    fetch_balance(public_key) {
        let unspents = this.fetch_utxo(public_key)
        return unspents.reduce((acc, curr) => acc + curr.amount, 0)
    }


    validate_tx(tx) {
        let in_sum = 0
        let out_sum = 0
        let amount = 0
        //console.log('validate tx',tx)
        tx.tx_ins.map(tx_in => {
            //console.log(this.utxo.keys() , JSON.stringify(tx_in.outpoint()) )
            assert(this.utxo_set.get(JSON.stringify(tx_in.outpoint())))
            assert()
            let tx_out = this.utxo.get(JSON.stringify(tx_in.outpoint()))

            let public_key = tx_out.public_key
            public_key.verify(tx_in.spend_message(), tx_in.signature)
  
            amount = tx_out.amount
            in_sum += amount

        })

        tx.tx_outs.map(tx_out => {
            out_sum += parseInt(tx_out.amount,10)
        })
        assert(in_sum == out_sum)
    }

    handle_tx(tx) {
        this.validate_tx(tx)
        this.mempool.append(tx)
    }

    handle_block(block) {
        if (this.blocks.length > 0) {
            public_key = bank_public_key(this.next_id)
            public_key.verify(block.signature, block.message)
        }
    }


    make_block() {

    }

    submit_block() {

    }

    schedule_next_block() {

    }

    airdrop(tx) {
        assert.equal(this.blocks.length,0)

        this.update_utxo_set(tx)

        let block = new Block([tx])
        this.blocks.push(block)
    }
}

function prepare_message(command, data) {
    return {
        "command": command,
        "data": data
    }
}
module.exports.Tx = Tx
module.exports.TxIn = TxIn
module.exports.TxOut = TxOut
module.exports.Bank = Bank