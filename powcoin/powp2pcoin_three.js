var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var assert = require('assert')
var net = require('net');
var identities = require('../identities')
var _ = require('lodash');
const args = process.argv
var winston = require('winston')
const BN = require('bn.js');
const uuidv1 = require('uuid/v1')
var hash = require('hash.js')
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');




const PORT = 10000
const BLOCK_SUBSIDY = 50
const GET_BLOCKS_CHUNK = 10
let node = ''

let logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => {
            return `${info.timestamp} ${info.level}: ${info.message}`;
        })
    ),
    transports: [new winston.transports.Console()]
});



function spend_message(tx, index) {
    let outpoint = tx.tx_ins[index].outpoint()
    //todo
    return `${tx.id}:${index}`
}

class Tx {

    constructor(id, tx_ins, tx_outs) {
        this.id = id,
            this.tx_ins = tx_ins,
            this.tx_outs = tx_outs
    }

    sign_input(index, private_key) {
        let message = spend_message(this, index)
        let signature = private_key.sign(Buffer.from(message, 'ascii').toString('hex'))
        this.tx_ins[index].signature = signature
    }

    verify_input(index, public_key) {
        let tx_in = this.tx_ins[index]
        let message = spend_message(this, index)
        return public_key.verify(Buffer.from(message, 'ascii').toString('hex'), tx_in.signature)
    }

    is_coinbase() {
        return this.tx_ins[0].tx_id == ''
    }

    static parse(tx) {
        let tx_ins = tx.tx_ins.map(x => {
            return new TxIn(x.tx_id, x.index, x.signature)
        })

        let tx_outs = tx.tx_outs.map(x => {
            return new TxOut(x.tx_id, x.index, x.amount, ec.keyFromPublic(x.public_key, 'hex'))
        })

        let newtx = new Tx(tx.id, tx_ins, tx_outs)
        return newtx

    }

    toJSON() {
        return {
            "id": this.id,
            "tx_ins": this.tx_ins.map(x => x.toJSON()),
            "tx_outs": this.tx_outs.map(x => x.toJSON())
        }
    }

}

class TxIn {

    constructor(tx_id, index, signature) {
        this.tx_id = tx_id,
            this.index = index,
            this.signature = signature
    }


    outpoint() {
        return { tx_id: this.tx_id, index: this.index }
    }

    toJSON() {
        return {
            "tx_id": this.tx_id,
            "index": this.index,
            "signature": this.signature
        }
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
            "tx_id": this.tx_id,
            "index": this.index,
            "amount": this.amount,
            "public_key": this.public_key.getPublic().encode('hex')
        }
    }
}

TxOut.prototype.toString = function () {
    return `TxOut(tx_id=${this.tx_id}, index=${this.index}, amount=${this.amount})`
}

class Block {
    constructor(txns, prev_id, nonce = 0) {
        this.txns = txns,
            this.prev_id = prev_id,
            this.nonce = nonce
    }

    header() {
        return JSON.stringify(this)
    }

    id() {
        return hash.sha256().update(this.header()).digest('hex')
    }

    proof() {
        return BigInt('0x' + this.id())
    }

    toJSON() {
        return {
            "txns": this.txns.map(txn => txn.toJSON()),
            "prev_id": this.prev_id,
            "nonce": this.nonce
        }
    }

    static parse(block) {
        let txns = block.txns.map(tx => Tx.parse(tx))
        return new Block(txns, block.prev_id, block.nonce)
    }
}

Block.prototype.toString = function () {
    let result = ''
    return `Block(prev_id=${this.prev_id}... id= ${this.id().slice(0, 10)}...)`
}

class Node {

    //TODO fix hack to use Docker
    constructor(port) {
        this.address = port
        this.blocks = []
        this.utxo_set = new Map()
        this.mempool = []
        //this.peer_addresses = process.env.PEERS.split(',').map(peer=>external_address(peer))
        this.peer_addresses = port == 'node1' ? 10000 : 10001
        this.peers = []
        this.pending_peers = []
        this.myWorker = 'not set'
    }

    connect(node_name) {
        let peer = parseInt(node_name[4]) + 10000
        if (!this.peers.includes(peer) && this.address != peer) {
            logger.log('info', `(handshake) Sent "connect" to ${node_name}`)
            let response = {
                node_name: this.address
            }
            send_message(prepare_message('connect', response), peer, function (data) {
                console.log('done', data)
            })

            this.pending_peers.push(node_name)

        }
    }

    sync() {
        let blocks = this.blocks.slice(this.blocks.length-GET_BLOCKS_CHUNK)
        let block_ids = blocks.map(block => block.id())
        this.peers.map(peer => {
            let response = {
                node_name: this.address,
                block_ids: block_ids
            }
            send_message(prepare_message('sync', response), peer, function (data) {
                console.log('done', data)
            })

        })
    }
    mempool_outpoints() {
        return this.mempool.map(tx => tx.map(x => tx_in.outpoint = x))
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
        // Save utxos which were just created
        tx.tx_outs.map(tx_out => {
            this.utxo_set.set(JSON.stringify(tx_out.outpoint()), tx_out)
        })

        // Remove utxos that were just spent
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
        tx.tx_ins.map((tx_in, index) => {
            assert(this.utxo_set.get(JSON.stringify(tx_in.outpoint())))
            assert(!this.mempool_outpoints().includes(tx))
            let tx_out = this.utxo_set.get(JSON.stringify(tx_in.outpoint()))

            let public_key = tx_out.public_key


            if (!tx.verify_input(index, public_key)) {
                throw "Tx validation errors"
            }


            amount = tx_out.amount
            in_sum += amount

        })

        tx.tx_outs.map(tx_out => {
            out_sum += parseInt(tx_out.amount, 10)
        })
        assert(in_sum == out_sum)
    }

    validate_coinbase(tx) {
        assert(tx.tx_ins.length == tx.tx_outs.length == 1)
        assert(tx.tx_outs[0].amount == BLOCK_SUBSIDY)
    }

    handle_tx(tx) {
        try {
            this.validate_tx(tx)
            this.mempool.push(tx)
        } catch (error) {
            throw "Tx validation errors"
        }

        this.peers.map(peer => send_message(prepare_message('tx', tx), this.peer_addresses, function (data) {
            console.log('done', data)
        })


        )

    }

    validate_block(block) {
        assert(block.proof() < POW_TARGET)
        if (block.prev_id == undefined) return
        //assert(block.prev_id == this.blocks[this.blocks.length - 1].id())
    }

    handle_block(block) {

        // Check work, chain ordering
        this.validate_block(block)

        // Validate coinbase seperately
        this.validate_coinbase(block.txns[0])

        // Check the transactions are valid
        block.txns.slice(1).map(tx => this.validate_tx(tx))

        // If they are all good, update this.blocks and this.utxo_set
        block.txns.map(tx => this.update_utxo_set(tx))

        // Add the block to our chain
        this.blocks.push(block)

        // Once a block is found mining stopped so restart
        this.startMining()

        logger.log('info', `Block accepted: height= ${this.blocks.length - 1}`)

        // Block propagation
        let response = {
            node_name: this.address,
            blocks: [block]
        }

        this.peers.map(peer => send_message(prepare_message('blocks', response), this.peer_addresses, function (data) {
            console.log('done', data)
        })


        )


    }

    startWorker(path, cb) {
        let block_id = node.blocks[node.blocks.length - 1].id()
        let w = new Worker(path, { workerData: { "block_id": block_id, "mempool": node.mempool } });
        w.on('message', (msg) => {
            cb(null, msg)
        })
        w.on('error', cb);
        w.on('exit', (code) => {
            if (code != 0)
                console.error(new Error(`Worker stopped with exit code ${code}`))
        });
        return w;
    }

    startMining() {
        this.myWorker = this.startWorker(__dirname + '/minerCode.js', (err, result) => {
            if (err) return console.error(err);
            console.log("[[Heavy computation function finished]]")
            console.log("First value is: ", result.val);
            let nb = Block.parse(result.block)
            console.log('nb:' + nb.txns[0].tx_outs[0])
            //node.handle_block(new Block(result.block.txns, result.block.prev_id, result.block.nonce))
            node.handle_block(Block.parse(result.block))
        })

    }

    stopMining() {
        //this.myWorker.terminate()
        this.myWorker.unref()
    }
}
function prepare_simple_tx(utxos, sender_private_key, recipient_public_key, amount) {
    sender_public_key = ec.keyFromPublic(sender_private_key.getPublic())
    tx_ins = []
    tx_in_sum = 0
    utxos.map(tx_out => {
        if (tx_in_sum <= tx_out.amount) {
            tx_ins.push(new TxIn(tx_out.tx_id, tx_out.index, null))
            tx_in_sum += tx_out.amount
        }
    })

    assert(tx_in_sum >= amount)

    tx_id = uuidv1()
    change = tx_in_sum - amount
    tx_outs = [
        new TxOut(tx_id, 0, amount, recipient_public_key),
        new TxOut(tx_id, 1, change, sender_public_key),
    ]

    tx = new Tx(tx_id, tx_ins, tx_outs)
    for (let index = 0; index < tx.tx_ins.length; index++) {
        tx.sign_input(index, sender_private_key)
    }

    return tx
}

function prepare_coinbase(public_key, tx_id = '') {
    if (tx_id == '') {
        tx_id = uuidv1()

    }
    return new Tx(
        id = tx_id,
        tx_ins = [
            new TxIn()
        ],
        tx_outs = [
            new TxOut(tx_id, 0, BLOCK_SUBSIDY, public_key)
        ]
    )
}


/*                   */
/* Mining            */
/*                   */

DIFFICULTY_BITS = 14
POW_TARGET = 2 ** (256 - DIFFICULTY_BITS)


function mine_block(block) {
    while (block.proof() >= POW_TARGET) {
        block.nonce++
        //console.log(block.nonce)
    }
    //console.log('block mined')
    return block
}


function mine_genesis_block(public_key) {
    let coinbase = prepare_coinbase(public_key, 'abc123')
    let unmined_block = new Block([coinbase], null, 0)
    mined_block = mine_block(unmined_block)
    node.blocks.push(mined_block)
    node.update_utxo_set(coinbase)

}




/*                   */
/* Networking        */
/*                   */

function prepare_message(command, data) {
    return {
        "command": command,
        "data": data
    }
}


function send_message(msg, port, cb) {
    msg = JSON.stringify(msg)

    var client = net.connect(port, '127.0.0.1', function () {
        //logger.log('info', `client connected to ${port}`)
    })

    client.write(msg)

    client.on('data', function (data) {
        dat = data.toString('utf8')
        console.log('on data', dat)
        cb(dat)
        client.end()
    })

    client.on('end', () => console.log('client.end'))

    client.on('error', () => console.log('no node available yet'))
}

function external_address(node) {
    i = parseInt(node.substr(4, 1), 10)
    port = PORT + i
    return port
}

///////////////
//   CLI    ///
//////////////

//let node = ''

function lookup_private_key(name) {
    exponent = {
        "alice": 1,
        "bob": 2,
        "node0": 3,
        "node1": 4,
        "node2": 5,
    }[name]
    return identities.user_private_key(name)
}

function lookup_public_key(name) {
    return identities.user_public_key(name)
}
function serve(node_name) {
//    remote_port = node_name == 'node1' ? 10000 : 10001
    home_port = parseInt(node_name[4]) + 10000


    logger.log('info', `Starting server ${node_name}`)
    var server = net.createServer(function (socket) {
        cmd = ''
        socket.on('data', function (data) {

            textChunk = data.toString('utf8');
            obj = JSON.parse(textChunk)
            cmd = obj['command']
            logger.log('info', `received ${cmd} from ${obj['data'].node_name}`)
            let peer = obj['data'].node_name
            remote_port = parseInt(peer[4]) + 10000
            if (cmd == 'connect') {
                if (!node.pending_peers.includes(peer) && !node.peers.includes(peer)) {
                    node.pending_peers.push(peer)
                    logger.log('info', `(handshake) Accepted "connect" request from ${peer}`)
                    // response = JSON.stringify(prepare_message('connect-response'))
                    // socket.write(response)
                    // socket.end()
                    let response = {
                        node_name: node_name
                    }
                    send_message(prepare_message('connect-response', response), remote_port, function (data) {
                        console.log('done', data)
                    })
                }
            } else if (cmd == 'connect-response') {
                if (node.pending_peers.includes(peer) && !node.peers.includes(peer)) {
                    node.pending_peers.splice(node.pending_peers.indexOf(peer), 1)
                    node.peers.push(peer)
                    logger.log('info', `(handshake) Connected to ${peer}`)
                    let response = {
                        node_name: node_name
                    }
                    send_message(prepare_message('connect-response', response), remote_port, function (data) {
                        console.log('done', data)
                    })
                    send_message(prepare_message('peers', response), remote_port, function (data) {
                        console.log('done', data)
                    })

                } else {
                    console.log('in else')
                    console.log(node.pending_peers)
                }
            } else if (cmd == 'peers') {
                let peer_response = {
                    node_name:node_name,
                    peers: node.peers
                }
                send_message(prepare_message('peers-response', peer_response), remote_port, function (data) {
                    console.log('done', data)
                })

            } else if (cmd == 'peers-response') {
                console.log(obj['data'])
                obj['data'].peers.map(peer=> { 
                    if (node.address != peer) {
                        node.connect(peer)
                    }
                })

            } else if (cmd == 'blocks') {
                logger.log('info',  ' Handling a blocks')
                //console.log(obj['data'])
                    node.stopMining()
                obj['data'].blocks.map(block => {
                    console.log(block)
                    node.handle_block(Block.parse(block))
                })

                if (obj['data'].blocks.length == GET_BLOCKS_CHUNK) {
                    node.sync()
                }

            } else if (cmd == 'ping') {

                response = JSON.stringify(prepare_message('pong'))
                socket.write(response)
                socket.end()
            } else if (cmd == "block") {
                logger.log('info', process.env.ID, ' Handling a block')
                if (obj['data'] == node.blocks[node.blocks.length - 1].id()) {
                    node.stopMining()
                    node.handle_block(obj['data'])
                }
            } else if (cmd == "balance") {

                logger.log('info', `Providing ${obj['data']}'s balance.`)
                let balance = node.fetch_balance(ec.keyFromPublic(obj['data'], 'hex'))
                response = JSON.stringify(prepare_message('balance-response', balance))
                socket.write(response)

            } else if (cmd == 'tx') {

                logger.log('info', `Performing ${obj['data']} transaction.`)
                bank.handle_tx(Tx.parse(obj['data']))
                response = JSON.stringify(prepare_message('tx-response', "accepted"))
                socket.write(response)

            } else if (cmd == 'utxos') {

                utxos = bank.fetch_utxos(ec.keyFromPublic(obj['data'], 'hex'))
                response = JSON.stringify(prepare_message('utxos-response', JSON.stringify(utxos)))
                socket.write(response)

            } else {
                socket.write(textChunk);
            }

        });

        socket.on('error', function (err) {
            console.log(err)
        })
        socket.on('end', function () {
            console.log('client disconnected', cmd)
        })
    });

    server.listen(home_port, '127.0.0.1');
}

if (args[2] == 'serve') {
    // command, bank id, port
    serve(args[3])
    node = new Node(args[3])
    mine_genesis_block(identities.user_public_key('alice'))


    //node.connect(    node.address == 'node1' ? 10000 : 10001)
    // node.myWorker = myWorker
    //myWorker.postMessage({hello:"antonio"})

    setTimeout(function () {
        //send_message(prepare_message('ping'), node.address == 'node1' ? 10000 : 10001, function (data) {
        //  console.log('done', data)
        //})
        if (node.address != 'node0') {
            //node.connect(    node.address == 'node1' ? 10000 : 10001)
            node.connect('node0')
        }



    }, 10000)

    node.sync()

    node.startMining()

} else if (args[2] == 'ping') {
    send_message(prepare_message('ping'), args[3], function (data) {
        console.log('done', data)
    })


} else if (args[2] == 'balance') {
    name = args[3]
    public_key = identities.user_public_key(name)
    send_message(prepare_message('balance', public_key.getPublic().encode('hex')), args[4], function (data) {
        console.log('done', data)
    })


} else if (args[2] == 'tx') {
    sender_private_key = identities.user_private_key(args[3])
    sender_public_key = identities.user_public_key(args[3])

    recipient_private_key = identities.user_private_key(args[4])
    recipient_public_key = identities.user_public_key(args[4])
    amount = args[5]
    msg = prepare_message('utxos', sender_public_key.getPublic().encode('hex'))
    send_message(msg, args[6], function (data) {

        console.log(`{"command":, "${JSON.parse(data)['command']}"}`)
        let utxos = JSON.parse(JSON.parse(data)['data'])
        tx = prepare_simple_tx(utxos, sender_private_key, recipient_public_key, amount)
        msg = prepare_message('tx', tx)

        send_message(msg, args[6], function (data2) {
            console.log('done', data2)
        })
    })
} else if (!(args[1].search("minerCode.js") == -1)) {
    logger.log('info', 'starting mining thread')
} else {
    console.log('Invalid cli command:', args[1], args[2])
}

module.exports.Tx = Tx
module.exports.TxIn = TxIn
module.exports.TxOut = TxOut
module.exports.Block = Block