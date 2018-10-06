var one = require('./ibd/one/complete');
var Readable = require('stream').Readable

function read_int(stream, n) {

}

function read_var_int(stream) {

}

function read_var_str(stream) {

}

function read_bool(stream) {

}

class VersionMessage {

    //command = Buffer.from('version', 'ascii');

    constructor(version, services, timestamp, addr_recv, addr_from,
                nonce, user_agent, start_height, relay) {
        this.version = version
        this.services = services
        this.timestamp = timestamp
        this.addr_recv = addr_recv
        this.addr_from = addr_from
        this.nonce = nonce
        this.user_agent = user_agent
        this.start_height = start_height
        this.relay = relay
                }

    from_bytes( payload ) {
        readable = new Readable()
        readable.push(msg)
        readable.push(null)
        envelope = network.NetworkEnvelope.parse(readable)
    }
}

versionBytes = Buffer.from('f9beb4d976657273696f6e000000000066000000c6a7a2287f1101000d0400000000000026ff545b000000000f040000000000000000000000000000000000000000000000000d0400000000000000000000000000000000000000000000000024fa090ac579f709102f5361746f7368693a302e31362e302fae22080001','hex')

readable = new Readable()
readable.push(versionBytes)
readable.push(null)

console.log(readable.read(10))

function read_int(stream, n, byte_order='little') {
    b = stream.read(n)
    return one.bytes_to_int(b, byte_order)
}

/*
data = [[22,10,'little'],[1000000, 7, 'big']]
data.map(obj => {
    const bytes_ = Buffer.alloc(10);
    console.log(bytes_)
    bytes_.writeInt32LE(obj[0],0,1)
    console.log(bytes_)
    readable = new Readable()
    readable.push(bytes_)
    readable.push(null)
    result = read_int(readable, obj[1], 'little')
    console.log(result)
})
*/

bytes1 = Buffer.alloc(10);
bytes1.writeInt32LE([22],0,1)
console.log(bytes1)
readable = new Readable()
readable.push(bytes1)
readable.push(null)
result = read_int(readable, 10, 'little')
//result = readable.read(10)
console.log(result)

bytes1 = Buffer.alloc(7);
bytes1.writeInt32BE([1000000],0)
console.log(bytes1)
readable = new Readable()
readable.push(bytes1)
readable.push(null)
//result = read_int(readable, 7, 'little')
result = readable.read(7)
console.log(result)
result = result.readUIntBE(6)
console.log(result)
