var net = require('net');
var user_public_key = require('./indentities').user_public_key
var user_private_key = require('./indentities').user_private_key
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var prepare_simple_tx = require('./utils').prepare_simple_tx

//var Tx = require('./banknetcoinserver').Tx
//var TxOut = require('./banknetcoinserver').TxOut
//var TxIn = require('./banknetcoinserver').TxIn
process.on('unhandledRejection', (reason, p) => { throw reason });
alice_private_key = ec.genKeyPair();
alice_public_key = ec.keyFromPublic(alice_private_key.getPublic())

//var client = new net.Socket();
//client.setNoDelay();
const args = process.argv
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
            return new TxOut(x.tx_id, x.index, x.amount, ec.keyFromPublic(x.public_key,'hex'))
        })
        
        let newtx = new Tx(tx.id, tx_ins, tx_outs)
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



function prepare_message(command, data = null) {
    return {
        "command": command,
        "data": data
    }
}
function send_message(msg, cb, data) {
    //var dat = {'data':'antonio'}
    //let message = JSON.stringify(prepare_message(command, data))
    msg = JSON.stringify(msg)
    var client = net.connect(1339, '127.0.0.1', function () {
        console.log('client connected')
    })

    client.write(msg)

    client.on('data', function (data) {
        dat = data.toString('utf8')
        console.log('on data', dat)
        //cb.bind(null, this.dat )
        cb(dat)
        client.end()
        //client.destroy()
    }.bind(this))

    // function cb( cp){
    //     console.log('cb',cb)
    //     cb(cp)
    // }
    // var cbb = cb.bind(cb) 

    // client.on('end' ,function(cb, cp){
    //     console.log('cb',cb)
    //     cb(cp)
    // }.bind(this))

    //client.on('end',cb.bind(null, this.dat ))
    client.on('end', () => console.log('client.end'))
}

if (args[2] == 'ping') {
    send_message(prepare_message('ping'), function(data){
        console.log('done', data)
    })
        

} else if (args[2] == 'balance') {
    name = args[3]
    public_key = user_public_key(name)
    send_message(prepare_message('balance', public_key.getPublic().encode('hex')), function(data){
        console.log('done', data)
    })
        

} else if (args[2] == 'tx') {
    sender_private_key = user_private_key(args[3])
    sender_public_key = user_public_key(args[3])

    recipient_private_key = user_private_key(args[4])
    recipient_public_key = user_public_key(args[4])
    amount = args[5]
   msg = prepare_message('utxos', sender_public_key.getPublic().encode('hex'))
    send_message(msg, function (data) {

        console.log(`{"command":, "${JSON.parse(data)['command']}"}`)
        let utxos = JSON.parse(JSON.parse(data)['data'])
        tx = prepare_simple_tx(utxos, sender_private_key, recipient_public_key, amount)
        msg = prepare_message('tx', tx)

        send_message(msg, function (data2) {
            console.log('done', data2)
        })
    })




} else {
    console.log('Invalid command')
}



//client.on('close', function () {
//    console.log('Connection closed');
//});


