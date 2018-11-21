const {  parentPort, workerData } = require('worker_threads');
const { Block } = require('./pow_syndacoin')


console.log("worder says node")

parentPort.on('message', (msg) => {
    console.log("Main thread finished on: ", msg.hello);
    mine = false
})

function mine_block(block) {
    while (block.proof() >= POW_TARGET) {
        block.nonce++
        //console.log(block.nonce)
    }
    console.log('workder says block mined')
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
        console.log('worker syas block mined', mined_block)
        parentPort.postMessage({ val: mined_block.nonce, block: mined_block });
        
    }
//}
// sorter.sort(bigList);


