var assert = require('assert')
//var prepare_simple_tx = require('./utils').prepare_simple_tx
var identities = require('./identities')
var _ = require('lodash');

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

function prepare_simple_tx(utxos, sender_private_key, recipient_public_key, amount) {
    sender_public_key = ec.keyFromPublic(sender_private_key.getPublic())
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
        this.signature = private_key.sign(this.message())
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
        //this.utxo = new Map()
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
        for (var utxo of this.utxo_set.values()) {
            if (utxo.public_key.getPublic().encode('hex') == public_key.getPublic().encode('hex')) {
                utxos.push(utxo)
            }
        }
        return utxos
    }

    update_utxo_set(tx) {
        tx.tx_outs.map(tx_out => {

            this.utxo_set.set(JSON.stringify(tx_out.outpoint()), tx_out)
        })

        tx.tx_ins.map(tx_in => {
            this.utxo_set.delete(JSON.stringify(tx_in.outpoint()))
        })

    }

    fetch_balance(public_key) {
        let unspents = this.fetch_utxos(public_key)
        return unspents.reduce((acc, curr) => acc + curr.amount, 0)
    }


    validate_tx(tx) {
        let in_sum = 0
        let out_sum = 0
        let amount = 0
        console.log('validate tx',tx)
        tx.tx_ins.map(tx_in => {
            console.log(this.utxo_set.keys() , JSON.stringify(tx_in.outpoint()) )
            assert(this.utxo_set.get(JSON.stringify(tx_in.outpoint())))
            assert(!this.mempool_outpoints().includes(tx))
            let tx_out = this.utxo_set.get(JSON.stringify(tx_in.outpoint()))

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
        this.mempool.push(tx)
    }

    handle_block(block) {
        console.log(this.blocks.length)
        if (this.blocks.length > 0) {
            let public_key = identities.bank_public_key(this.next_id)
            public_key.verify(block.message, block.signature )
        }
        block.txns.map(tx=>this.update_utxo_set(tx))

        this.blocks.push(block)

        this.schedule_next_block()
    }


    make_block() {
        let txns =  _.cloneDeep(this.mempool);
        this.mempool = []
        let block = new Block(txns)
        block.sign(this.private_key)
        return block
    }

    submit_block() {
        console.log('submitting block')
        let block = this.make_block()
        this.handle_block(block)
    }

    schedule_next_block() {
        this.our_turn = 1
        if (this.our_turn) {
            setTimeout(this.submit_block, 5000)
        }

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
module.exports.Block = Block