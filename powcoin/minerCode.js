const {  parentPort, workerData } = require('worker_threads');
const { Block } = require('./pow_syndacoin')

parentPort.on('message', (msg) => {
	console.log("Main thread finished on: ", (msg.timeDiff / 1000), " seconds...");
})

function mine_block(block) {
    while (block.proof() >= POW_TARGET) {
        block.nonce++
        //console.log(block.nonce)
    }
    console.log('block mined')
    return block
}
console.log("node")
while (true) {

    unmined_block = new Block(
        workerData.mempool,
        workerData.block_id,
        0
    )
    mined_block = mine_block(unmined_block)

    if (mined_block) {
        console.log('block mined', mined_block)
        parentPort.postMessage({ val: mined_block.nonce, block: mined_block });
        
    }
}
// sorter.sort(bigList);


