const {  parentPort, workerData } = require('worker_threads');
const { Block } = require('./pow_syndacoin')
var winston = require('winston')





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


logger.log("info", "miner: online")
logger.log("info", "pow target:", POW_TARGET)

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

    unmined_block = new Block(
        workerData.mempool,
        workerData.block_id,
        0
    )
    mined_block = mine_block(unmined_block)

    if (mined_block) {
        logger.log('info', 'miner: block mined', mined_block)
        parentPort.postMessage({ val: mined_block.nonce, block: mined_block });
        
    }
//}
// sorter.sort(bigList);


