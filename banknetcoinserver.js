/*
In the node.js intro tutorial (http://nodejs.org/), they show a basic tcp 
server, but for some reason omit a client connecting to it.  I added an 
example at the bottom.
Save the following server in example.js:
*/

var net = require('net');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const BN = require('bn.js');
const uuidv1 = require('uuid/v1')
var _ = require('lodash');
var alice_public_key = require('./indentities').alice_public_key
var user_public_key = require('./indentities').user_public_key
var assert = require('assert')

function spend_message(tx, index) {
    let outpoint = tx.tx_ins[index].outpoint()
    //todo
    //console.log(outpoint)
    return `${this.tx_id}:${this.index}`
}

class Tx {

    constructor(id, tx_ins, tx_outs) {
        this.id = id,
        this.tx_ins = tx_ins,
        this.tx_outs = tx_outs
    }

    sign_input(index, private_key) {
        let message = spend_message(this.tx,index)
        signature = private_key.sign(message)
        this.tx_ins[index].signature = signature
    }

    static parse (tx) {
        let tx_ins = tx.tx_ins.map(x=>{
            return new TxIn(x.tx_id, x.index, x.signature)
        })

        let tx_outs = tx.tx_outs.map(x=>{
            return new TxOut(x.tx_id, x.index, x.amount, x.public_key)
        })
        
        let newtx = new Tx(tx.id, tx_ins, tx_outs)
        //console.log(newtx)
        return newtx

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

class Bank {

    constructor() {
        this.utxo = new Map()
    }

    update_utxo(tx) {
        console.log(tx)
        tx.tx_outs.map(tx_out => {
            console.log('update_utxo:', tx_out.outpoint())

            this.utxo.set(JSON.stringify(tx_out.outpoint()), tx_out)
        })

        tx.tx_ins.map(tx_in => {
            this.utxo.delete(JSON.stringify(tx_in.outpoint()))
        })

    }

    issue(amount, public_key) {
        console.log('issuing')
        let id = uuidv1()
        let tx_ins = []
        let tx_outs = [new TxOut(id, 0, amount, public_key)]
        let tx = new Tx(id, tx_ins, tx_outs)

        this.update_utxo(tx)
        return tx
    }


    validate_tx(tx) {
        let in_sum = 0
        let out_sum = 0
        let amount = 0
        //console.log('validate tx',tx)
        tx.tx_ins.map(tx_in => {
            //console.log(this.utxo.keys() , JSON.stringify(tx_in.outpoint()) )
            assert(this.utxo.get(JSON.stringify(tx_in.outpoint())))

            let tx_out = this.utxo.get(JSON.stringify(tx_in.outpoint()))

            let public_key = tx_out.public_key
            public_key.verify(tx_in.spend_message(), tx_in.signature)
            console.log('tx_out.amount1', tx_out.amount)
 
            amount = tx_out.amount
            in_sum += amount

        })

        tx.tx_outs.map(tx_out => {
            console.log('tx_out.amount', tx_out.amount)
            out_sum += parseInt(tx_out.amount,10)
        })
        console.log('sum', in_sum, out_sum)
        assert(in_sum == out_sum)
    }

    handle_tx(tx) {
        console.log('handling')
        this.validate_tx(tx)
        this.update_utxo(tx)
    }

    fetch_utxo(public_key) {
        let utxos = []
        
        //console.log('server public key:', JSON.parse(public_key))
        for (var utxo of this.utxo.values()) {
            //console.log('utxo public key:', utxo.public_key.getPublic().encode('hex'))
            if (utxo.public_key.getPublic().encode('hex') == public_key.getPublic().encode('hex')) {
                utxos.push(utxo)
            }
        }
        //console.log('utxos',utxos)
        return utxos
    }

    fetch_balance(public_key) {
        let unspents = this.fetch_utxo(public_key)
        return unspents.reduce((acc, curr) => acc + curr.amount, 0)
    }
}

function prepare_message(command, data) {
    return {
        "command": command,
        "data": data
    }
}

let bank = new Bank()
bank.issue(1000, alice_public_key)

var server = net.createServer(function (socket) {
    //socket.write('Echo server\r\n');

    socket.on('data', function (data) {
        //console.log('dt:',data.toString('utf8'));
        textChunk = data.toString('utf8');
        obj = JSON.parse(textChunk)
        //console.log(obj['command'])
        if (obj['command'] == 'ping') {
            response = JSON.stringify(prepare_message('pong'))
            socket.write(response)
        } else if (obj['command'].toString('utf8') == "balance") {
            //console.log('tc:', obj['command'], ec.keyFromPublic(obj['from'], 'hex').getPublic().encode('hex'));

            let balance = bank.fetch_balance(ec.keyFromPublic(obj['data'], 'hex'))
            response = JSON.stringify(prepare_message('balance-response', balance))
            socket.write(response)
        } else if (obj['command'].toString('utf8') == 'tx') {
            //console.log('server tx', obj['data'])

            bank.handle_tx(Tx.parse(obj['data']))
            socket.write(JSON.stringify({ command: 'utxos', from: obj['from'], to: obj['to'], amount: obj['amount'] }))
        } else if (obj['command'] == 'utxos') {
            utxos = bank.fetch_utxo(ec.keyFromPublic(obj['data'], 'hex'))
            //console.log('utxos',JSON.stringify(utxos))
            response = JSON.stringify(prepare_message('utxos-response',JSON.stringify(utxos)))
            socket.write(response)
        } else {
            socket.write(textChunk);
        }

    });

    socket.on('error', function (err) {
        console.log(err)
    })
});

server.listen(1338, '127.0.0.1');

