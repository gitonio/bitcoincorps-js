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
        //console.log('this.tx', this)
        let message = spend_message(this, index)
        let signature = private_key.sign(message)
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


module.exports.Tx = Tx
module.exports.TxIn = TxIn
module.exports.TxOut = TxOut