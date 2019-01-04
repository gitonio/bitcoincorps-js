const {  parentPort, workerData } = require('worker_threads');
const { Block, Tx, TxIn, TxOut } = require('./powp2pcoin_one')
var winston = require('winston')
var identities = require('../identities')
const uuidv1 = require('uuid/v1')
const BLOCK_SUBSIDY = 50

function prepare_coinbase(public_key, tx_id='') {
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


logger.log("info", "Starting miner")
//logger.log("info", `pow target: ${ POW_TARGET }`)

parentPort.on('message', (msg) => {
    console.log("Main thread finished on: ", msg.hello);
    mine = false
})

function mine_block(block) {
    while (block.proof() >= POW_TARGET) {
        block.nonce++
        //console.log(block.nonce)
    }
    return block
}
mine = true
//while (mine) {
    let coinbase = []
    coinbase.push(prepare_coinbase(identities.bank_public_key(0)))
    //console.log('info', coinbase.length)
    unmined_block = new Block(
        coinbase.concat(workerData.mempool),
        workerData.block_id,
        0
    )
    mined_block = mine_block(unmined_block)

    if (mined_block) {
        //logger.log('info', 'miner: block mined','miner: end')
        parentPort.postMessage({ val: mined_block.nonce, block:  mined_block.toJSON() });
        
    }
//}
// sorter.sort(bigList);


