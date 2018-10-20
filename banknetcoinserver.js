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

alice_private_key = ec.genKeyPair();
alice_public_key = ec.keyFromPublic(alice_private_key.getPublic())

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
        console.log('txs:', Object.values(this.txs))
        Object.values(this.txs).map(tx=> {
            console.log('txins', tx.tx_ins)
            tx.tx_ins.map( _tx_in=> {
                console.log('is_unspent:',tx_in.tx_id ,_tx_in_tx_id, tx_in.index , _tx_in.index)
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

        console.log('insum:', in_sum == out_sum)
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
                console.log(i, tx.id, public_key)
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

var server = net.createServer(function(socket) {
	//socket.write('Echo server\r\n');
    let bank = new Bank()
    bank.issue(1000, alice_public_key)

    socket.on('data', function(data){
		//console.log('dt:',data);
        textChunk = data.toString('utf8');
        obj = JSON.parse(textChunk)
        console.log(obj['command'])
        if (obj['command']=='ping'){
            socket.write('pong')
        } else if (obj['command'].toString('utf8')=="balance") {
            console.log('tc:',obj['command']);
            let balance = bank.fetch_utxo(alice_public_key)
            socket.write(JSON.stringify({command: 'balance', from:  obj['from'] , amount: balance}))
        } else if (obj['command'] == 'tx') {
            socket.write(JSON.stringify({command: 'utxos', from:  obj['from'] , to: obj['to'],  amount: obj['amount']}))
        } else if(obj['command']=='utxos') {
            socket.write(JSON.stringify({command: 'tx', from:  'x' , to: 'x',  amount: '999'}))
        } else {
            socket.write(textChunk);
        }

	});

    socket.on('error', function(err) {
        console.log(err)
     })
});

server.listen(1337, '127.0.0.1');

/*
And connect with a tcp client from the command line using netcat, the *nix 
utility for reading and writing across tcp/udp network connections.  I've only 
used it for debugging myself.
$ netcat 127.0.0.1 1337
You should see:
> Echo server
*/