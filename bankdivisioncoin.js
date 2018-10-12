var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const BN = require('bn.js');
const uuidv1 = require('uuid/v1')
var _ = require('lodash');


class Tx {
    constructor(id, tx_ins, tx_outs) {
        this.id = id,
        this.tx_ins = tx_ins,
        this.tx_outs = tx_outs
    }

    sign_input(index, private_key) {
        signature = private_key.sign(this.tx_ins[index].spend_message)
        this.tx_ins[index].signature = signature
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

}

class TxOut {
    constructor(tx_id, index, amount, public_key) {
        this.tx_id = tx_id,
        this.index = index,
        this.amount = amount,
        this.public_key = public_key
    }
}

class Bank {
    constructor() {
        this.txs = {}
    }

    issue(amount, public_key ) {
        let id = uuidv1()
        let tx_ins = []
        let tx_outs = [new TxOut(id, 0, amount, public_key)]
        let tx = new Tx(id, tx_ins, tx_outs)
        this.txs[tx.id] = tx
        return tx
    }

    is_unspent(tx_in) {
        //console.log('txs:', Object.values(this.txs))
        Object.values(this.txs).map(tx=> {
            tx.tx_ins.map( _tx_in=> {
                if (tx_in.tx_id == _tx_in_tx_id && tx_in.index == _tx_in.index) return false
            })
        })
        return true
    }

    validate_tx(tx) {
        let in_sum = 0
        let out_sum = 0
        let amount = 0
        tx.tx_ins.map(tx_in => {
            this.is_unspent(tx_in)

            let tx_out = this.txs[tx_in.tx_id].tx_outs[tx_in.index]

            let public_key = tx_out.public_key
            public_key.verify(tx_in.spend_message, tx_in.signature)

            amount = tx_out.amount
            in_sum += amount

        })

        tx.tx_outs.map(tx_out => {
            out_sum += tx_out.amount
        })

        console.log(in_sum == out_sum)
    }

    handle_tx(tx) {
        this.validate_tx(tx)
        this.txs[tx.id] = tx
    }

    fetch_utxo(public_key) {
        //console.log('txs:', Object.values(this.txs))

        let spent_pairs = []
        let sp = []
        Object.values(this.txs).map(tx=> {
            spent_pairs = tx.tx_ins.map( tx_in=> {
                console.log('tx_in:',tx_in.tx_id, tx_in.index)
                //spent_pairs.push(tx_in.tx_id + '-' + tx_in.index)
                return tx_in.tx_id + '-' + tx_in.index
            })
        })
        
        console.log('spent_pairs', spent_pairs, sp)

        let unspents = []

        Object.values(this.txs).map(tx=>{
            tx.tx_outs.map((tx_out,i)=>{
                console.log(i, tx.id)
               if (
                    public_key.getPublic().encode('hex') == tx_out.public_key.getPublic().encode('hex')
                    && spent_pairs.find(x=>x==tx.id + '-' + i) == undefined
                    
               ) {
                   unspents.push(tx_out)
               }

            })
        })


        return unspents
    }

    fetch_balance(public_key) {
        let unspents = this.fetch_utxo(public_key)
        console.log('unspents:', unspents)
        return unspents.reduce((acc, curr)=> acc + curr.amount,0)
    }
}

module.exports.TxIn = TxIn 
module.exports.TxOut = TxOut
module.exports.Tx = Tx
module.exports.Bank = Bank