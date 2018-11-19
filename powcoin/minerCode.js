const {  parentPort } = require('worker_threads');

// function random(min, max) {
// 	return Math.random() * (max - min) + min
// }

// const sorter = require("./test2-worker");

// const start = Date.now()
// let bigList = Array(1000000).fill().map( (_) => random(1,10000))

//you can receive messages from the main thread this way:
parentPort.on('message', (msg) => {
	console.log("Main thread finished on: ", (msg.timeDiff / 1000), " seconds...");
})

while (true) {
    unmined_block = new Block(
        node.mempool,
        node.blocks[node.blocks.length-1].id(),
        none = 0
    )
    mined_block = mine_block(unmined_block)

    if (mined_block) {

    }
}
// sorter.sort(bigList);


parentPort.postMessage({ val: sorter.firstValue, timeDiff: Date.now() - start});