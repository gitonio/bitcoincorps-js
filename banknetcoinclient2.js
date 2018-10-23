var net = require('net');
var user_public_key = require('./indentities').user_public_key
var user_private_key = require('./indentities').user_private_key
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var prepare_simple_tx = require('./utils').prepare_simple_tx

var Tx = require('./blockcoin').Tx
var TxOut = require('./blockcoin').TxOut
var TxIn = require('./blockcoin').TxIn
process.on('unhandledRejection', (reason, p) => { throw reason });
alice_private_key = ec.genKeyPair();
alice_public_key = ec.keyFromPublic(alice_private_key.getPublic())

var client = new net.Socket();
//client.setNoDelay();
const args = process.argv

function sendMessage(message) {
    //var client = this;
    return new Promise((resolve, reject) => {

        client.write(message);

        client.on('data', (data) => {
            resolve(data);
            if (data.toString().endsWith('exit')) {
                client.destroy();
            }
        });

        client.on('error', (err) => {
            reject(err);
        });

    });
}

function prepare_message(command, data) {
    return {
        "command": command,
        "data": data
    }
}
function send_message(command, data, response = false) {
    let message = JSON.stringify(prepare_message(command, data))
    console.log('messge', message)
    client.connect(1338, '127.0.0.1', function () {
        console.log('client connected')
    })
    return new Promise((resolve, reject) => {

        client.write(message);

        client.on('data', (data) => {
            client.destroy()
            resolve(data);
            if (data.toString().endsWith('exit')) {
                client.destroy();
            }
        });

        client.on('error', (err) => {
            reject(err);
        });
        
    });

}

if (args[2] == 'ping') {
    send_message('ping')
        .then((data) => { console.log(`Received1: ${data}`); client.end(); })

} else if (args[2] == 'balance') {
    name = args[3]
    public_key = user_public_key(name)
    send_message('balance', public_key.getPublic().encode('hex'))
        .then((data) => { console.log(`Received1: `, JSON.parse(data)); client.end(); })

} else if (args[2] == 'tx') {
    cw = { command: 'tx', from: args[3], to: args[4], amount: args[5] }
    sender_private_key = user_private_key(args[3])
    sender_public_key = user_public_key(args[3])

    recipient_private_key = user_private_key(args[4])
    recipient_public_key  = user_public_key(args[4])

    amount = args[5]
    console.log('amount:', amount)
    //console.log(JSON.stringify(cw))
    utxos = []
    txo = {}
    send_message('utxos', sender_public_key.getPublic().encode('hex'))
        .then((data) => { 
            console.log(`Received1:`, JSON.parse(data)); 
            utxos = JSON.parse(JSON.parse(data)['data'])
            console.log('data', utxos) 
            tx = prepare_simple_tx(utxos, sender_private_key, recipient_public_key, amount)
            //client.end()
            //return tx
            //send_message('tx', tx)
            return tx
        }).then((tx)=>{
            console.log('tx',tx)
            txo = tx
            send_message('tx', tx)
                .then((data) => [
                    console.log(JSON.parse(data))
                ])
        })

        //send_message('tx', txo)
        //.then((data) => { console.log(`Received2: ${data}`); return client.end(); })

    


} else {
    console.log('Invalid command')
}

/*
client.connect(1338, '127.0.0.1', function () {
    console.log('Connected', args[2], args[3]);
    cw = ''
    res = ''
    if (args[2] == 'ping') {
        cw = { command: 'pong', data: '' }
        sendMessage(JSON.stringify(cw))
            .then((data) => { console.log(`Received1: ${data}`); client.end(); })

    } else if (args[2] == 'balance') {
        name = args[3]
        public_key = user_public_key(name)
        console.log('client public_key:', public_key.getPublic().encode('hex'))
        cw = { command: 'balance', from: public_key.getPublic().encode('hex') }
        sendMessage(JSON.stringify(cw))
            .then((data) => { console.log(`Received1: ${data}`); client.end(); })

    } else if (args[2] == 'tx') {
        cw = { command: 'tx', from: args[3], to: args[4], amount: args[5] }
        //console.log(JSON.stringify(cw))
        sendMessage(JSON.stringify(cw))
            .then((data) => { console.log(`Received1: ${data}`); return sendMessage(`${data}`); })
            .then((data) => { console.log(`Received2: ${data}`); return client.end(); })

    } else {
        console.log('Invalid command')
    }

});
*/

client.on('close', function () {
    console.log('Connection closed');
});

// client.on('data', function (data) {
//     console.log(data.toString('utf8'))
//     client.end()
// })
// client.on('error', function (error) {
//     console.log(error, null)
// })
