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


function spend_message(tx, index) {
    let outpoint = tx.tx_ins[index].outpoint()
    //todo
    console.log(outpoint)
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
}

class Bank {

    constructor() {
        this.utxo = new Map()
    }

    update_utxo(tx) {

        tx.tx_outs.map(tx_out => {
            this.utxo.set(JSON.stringify(tx_out.outpoint()), tx_out)
        })

        tx.tx_ins.map(tx_in => {
            this.utxo.delete(JSON.stringify(tx_in.outpoint()))
        })

    }

    issue(amount, public_key) {
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

        tx.tx_ins.map(tx_in => {

            assert(this.utxo.get(JSON.stringify(tx_in.outpoint())))

            let tx_out = this.utxo.get(JSON.stringify(tx_in.outpoint()))

            let public_key = tx_out.public_key
            public_key.verify(tx_in.spend_message(), tx_in.signature)

            amount = tx_out.amount
            in_sum += amount

        })

        tx.tx_outs.map(tx_out => {
            out_sum += tx_out.amount
        })

        assert(in_sum == out_sum)
    }

    handle_tx(tx) {
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

var server = net.createServer(function (socket) {
    //socket.write('Echo server\r\n');
    let bank = new Bank()
    bank.issue(1000, alice_public_key)

    socket.on('data', function (data) {
        //console.log('dt:',data.toString('utf8'));
        textChunk = data.toString('utf8');
        obj = JSON.parse(textChunk)
        console.log(obj['command'])
        if (obj['command'] == 'ping') {
            response = JSON.stringify(prepare_message('pong'))
            socket.write(response)
        } else if (obj['command'].toString('utf8') == "balance") {
            //console.log('tc:', obj['command'], ec.keyFromPublic(obj['from'], 'hex').getPublic().encode('hex'));

            let balance = bank.fetch_balance(ec.keyFromPublic(obj['data'], 'hex'))
            response = JSON.stringify(prepare_message('balance-response', balance))
            socket.write(response)
        } else if (obj['command'] == 'tx') {
            bank.handle_tx()
            socket.write(JSON.stringify({ command: 'utxos', from: obj['from'], to: obj['to'], amount: obj['amount'] }))
        } else if (obj['command'] == 'utxos') {
            balance = bank.fetch_utxo(ec.keyFromPublic(obj['data'], 'hex'))
            console.log('balance',balance)
            response = JSON.stringify(prepare_message('utxos-response',balance))
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

