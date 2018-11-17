var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var assert = require('assert')
var net = require('net');
var identities = require('./identities')
var _ = require('lodash');
const args = process.argv
var winston = require('winston')
const BN = require('bn.js');
const uuidv1 = require('uuid/v1')
var hash = require('hash.js');

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

const BITS = 19
const PORT = 10000
const POW_TARGET = 1 << (256 - BITS)
const BLOCK_SUBSIDY = 50

//todo logging



function spend_message(tx, index) {
    let outpoint = tx.tx_ins[index].outpoint()
    //todo
    return `${tx.id}:${index}`
}

class Tx {

    constructor( tx_ins, tx_outs) {
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
        return this.tx_ins[0].signature instanceof int 
    }

    id() {
        return mining_hash(`Tx`)
    }

    static parse (tx) {
        let tx_ins = tx.tx_ins.map(x=>{
            return new TxIn( x.index, x.signature)
        })

        let tx_outs = tx.tx_outs.map(x=>{
            return new TxOut( x.index, x.amount, ec.keyFromPublic(x.public_key,'hex'))
        })
        
        let newtx = new Tx( tx_ins, tx_outs)
        return newtx

    }

}

Tx.prototype.toString = function txToString() {
    return `Tx(id=${this.id()}, tx_ins=${this.tx_ins}, tx_outs=${this.tx_outs})`
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

}

TxIn.prototype.toString = function TxInToString() {
    let signature =  (this.signature instanceof int) ? this.signature : "..."
    return `TxIn(tx_id=${this.tx_id}, index=${this.index} ${signature})`
}

class TxOut {

    constructor( amount, public_key) {
            this.amount = amount,
            this.public_key = public_key
    }


    toJSON() {
        return {
            "amount": this.amount,
            "public_key": this.public_key.getPublic().encode('hex')
        }
    }
}

TxOut.prototype.toString = function txToString() {
    return `TxOut(amount=${this.amount}, public_key=${identities.key_to_name(this.public_key)})`
}

class UnspentTxOut {
    constructor(tx_id, index, amount, public_key) {
        this.tx_id = tx_id,
        this.index = index,
        this.amount = amount,
        this.public_key = public_key
    }

    outpoint() {
        return {tx_id:this.tx_id, index: this.index}
    }
}
UnspentTxOut.prototype.toString = function UnspentTxOutToString() {
    return `TxOut(tx_id=${this.tx_id}, index=${this.index} amount=${this.amount}, public_key=${identities.key_to_name(this.public_key)})`
}

class Block {
    constructor(txns, prev_id, nonce) {
        this.txns = txns
        this.prev_id = prev_id
        this.nonce = nonce
    }

    id() {
        return mining_hash(this.header(this.nonce))
    }

    header(nonce) {
        return JSON.stringify([this.txns, nonce])
    }


    static parse(block) {
        let txns = block.txns.map(tx=>Tx.parse(tx))
        return new Block(txns, block.timestamp, block.signature)
    }
}

Block.prototype.toString = function BlocktoString() {
    return `Block(prev_id=${this.prev_id}, id=${this.id} nonce=${this.nonce})`
}


class Chain {

    constructor(blocks) {
        this.blocks = blocks
    }

    work() {
        return this.blocks.length
    }

    tip() {
        return this.blocks[0]
    }
    
    height() {
        return this.blocks[this.work()-1]
    }

    txn_iterator(chain) {

    }

    get_last_shared_block(chain_one, chain_two) {

    }

    total_work(chain) {
        return chain.length
    }

    tx_in_to_utxo(tx_in, chain) {
        
    }
}
class Node {

    constructor(peers) {
        this.active_chain_index = 0
        this.chains = []
        this.utxo_set = new Map()
        this.mempool = []
        this.peers = peers
        this.chain_lock = threading.Lock()
    }

    join_network(peers) {

    }

    active_chain() {
        return this.chains[this.active_chain_index]
    }

    mempool_outpoints() {
        return this.mempool.map(tx => tx.map(x => tx_in.outpoint = x))
    }

    mempool_tx_ids() {
        return [this.mempool.map(tx=>tx.id)]
    }

    add_tx_to_utxo_set(tx) {

    }

    remove_tx_from_utxo_set(tx) {

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

    // update_utxo_set(tx) {
    //     tx.tx_outs.map(tx_out => {

    //         this.utxo_set.set(JSON.stringify(tx_out.outpoint()), tx_out)
    //     })

    //     tx.tx_ins.map(tx_in => {
    //         this.utxo_set.delete(JSON.stringify(tx_in.outpoint()))
    //     })

    // }

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

    }

    handle_tx(tx) {
        try {
            this.validate_tx(tx)
            this.mempool.push(tx)
        } catch (error) {
            throw "Tx validation errors"
        }


    }

    locate_block(block_id) {

    }


    work_ordered_chains() {

    }

    sync_utxo_set(chain, active_chain) {

    }

    validate_block(block) {

    }

    chain_diffs(from_chain, to_chain) {

    }

    create_branch(chain_index, height) {

    }

    handle_block(block) {
        if (this.blocks.length > 0) {
            let public_key = identities.bank_public_key(this.next_id())
            if (!public_key.verify(Buffer.from(block.message(), 'ascii').toString('hex'), block.signature)) {
                throw "Block validation error"
            }
        }

        block.txns.map(tx => this.validate_tx(tx))
        block.txns.map(tx => this.update_utxo_set(tx))

        this.blocks.push(block)

        this.schedule_next_block()

        return true
    }

    initial_block_download() {

    }

    // submit_block() {
    //     let block = this.make_block()
    //     this.handle_block(block)
    //     if (this.id == 0) {
    //         send_message(prepare_message('block',block),  1339, function (data) {
    //             console.log('info', 'submit_block '+ data)
    //         })

    //     } else {
    //         send_message(prepare_message('block',block),  1338, function (data) {
    //             console.log('info', 'submit_block '+ data)
    //         })
    //     }

    // }


    airdrop(tx) {
        assert.equal(this.blocks.length, 0)

        this.update_utxo_set(tx)

        let block = new Block([tx])
        this.blocks.push(block)
    }
}

/**********************/
/*   Tx Construction  */
/**********************/

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

function prepare_coinbase(public_key, height) {
    return new Tx(
        tx_ins = [
            new TxIn(None, None, height)
        ],
        tx_outs = [
            new TxOut(BLOCK_SUBSIDY, public_key)
        ]
    )
}

/*            */
/*   Mining   */
/*            */

mining_interrupt = threading.Event()

function mining_hash(s) {

    if (! s instanceof Buffer) {
        s = Buffer.from(s, 'hex')
    }
    return 	Buffer.from(hash.sha256().update(s).digest('hex'),'hex');

}

function mine_block(block) {
    nonce = 0
    while (mining_hash(block.header(nonce)) >= POW_TARGET) {
        nonce++
                
    }
    return block
}

function mine_forever(public_key) {
    return true
}
function prepare_message(command, data) {
    return {
        "command": command,
        "data": data
    }
}

function send_message(msg, port, cb) {
    msg = JSON.stringify(msg)
    
    var client = net.connect(port, '127.0.0.1', function () {
        console.log('client connected')
    })

    client.write(msg)

    client.on('data', function (data) {
        dat = data.toString('utf8')
        console.log('on data', dat)
        cb(dat)
        client.end()
    })

    client.on('end', () => console.log('client.end'))
}



function serve(id, port) {
    

    var server = net.createServer(function (socket) {
        cmd = ''
        socket.on('data', function (data) {

            textChunk = data.toString('utf8');
            obj = JSON.parse(textChunk)
            cmd = obj['command']
            console.log('info',obj['command'])
            if (obj['command'] == 'serve') {
                console.log('serve', id, port)
                bank = new Bank(0, identities.bank_private_key(id))
                tx = identities.airdrop_tx()
                bank.airdrop(tx)
                bank.schedule_next_block()

            } else if (obj['command'] == 'ping') {

                response = JSON.stringify(prepare_message('pong'))
                socket.write(response)
                socket.end()
            } else if (obj['command'].toString('utf8') == "block") {
                logger.log('info', 'Handling a block')
                bank.handle_block(Block.parse(obj['data']))
            } else if (obj['command'].toString('utf8') == "balance") {

                logger.log('info', `Providing ${obj['data']}'s balance.`)
                let balance = bank.fetch_balance(ec.keyFromPublic(obj['data'], 'hex'))
                response = JSON.stringify(prepare_message('balance-response', balance))
                socket.write(response)

            } else if (obj['command'].toString('utf8') == 'tx') {

                logger.log('info', `Performing ${obj['data']} transaction.`)
                bank.handle_tx(Tx.parse(obj['data']))
                response = JSON.stringify(prepare_message('tx-response', "accepted"))
                socket.write(response)

            } else if (obj['command'] == 'utxos') {

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

    server.listen(port, '127.0.0.1');
}


///////////////
//   CLI    ///
//////////////

if (args[2] == 'serve') {
    // command, bank id, port
    let peers = args[3]
    let node = new Node(peers)
    let genesis_coinbase = prepare_coinbase(user_public_key("alice"), 0)
    let unmined_genesis_block = new Block(genesis_coinbase)
    let mined_genesis_block = mine_block(unmined_genesis_block)
    node.chains.push([mined_genesis_block])
    node.active_chain_index =0
    node.add_tx_to_utxo_set(genesis_coinbase)

    node_id = id
    mining_public_key = node_public_key(node_id)

    serve(args[3], args[4])

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
    msg = prepare_message('utxos',  sender_public_key.getPublic().encode('hex'))
    send_message(msg, args[6], function (data) {

        console.log(`{"command":, "${JSON.parse(data)['command']}"}`)
        let utxos = JSON.parse(JSON.parse(data)['data'])
        tx = prepare_simple_tx(utxos, sender_private_key, recipient_public_key, amount)
        msg = prepare_message('tx', tx)

        send_message(msg, args[6], function (data2) {
            console.log('done', data2)
        })
    })




} else {
    console.log('Invalid command')
}

module.exports.Tx = Tx
module.exports.TxIn = TxIn
module.exports.TxOut = TxOut
module.exports.Bank = Bank
module.exports.Block = Block