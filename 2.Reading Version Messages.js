var two = require('./ibd/two/complete');
var Readable = require('stream').Readable
var test_data = require('./test_data')
var answers = require('./ibd/two/answers')


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
        stream = new Readable()
        stream.push(payload)
        stream.push(null)
        
        version = read_int(stream,4)
    }
}

console.log('Excercise #2')
version_bufs = test_data.make_version_bufs()
version_bufs.map(vs=>console.log('version:', two.read_version(vs)))

console.log('Excercise #3')
version_bufs.map(vs=>console.log('can:', answers.can_send_pong(vs)))

console.log(answers.read_bool(Buffer.from([true])))
console.log(answers.read_bool(Buffer.from([false])))


enumerated = [
    //[test_data.eight_byte_int, test_data.eight_byte_var_int],
    [test_data.four_byte_int, test_data.four_byte_var_int],
    [test_data.two_byte_int, test_data.two_byte_var_int],
    [test_data.one_byte_int, test_data.one_byte_var_int],
    
]

//console.log('enum',enumerated[1][1].toString())

enumerated.map(x=>{
    console.log('num', x[0], x[1])
    calculated_int = two.read_var_int(x[1]).toString(10)
    console.log('enum:', x[0], calculated_int)
})


b = Buffer.alloc(10)
b.writeUInt8(22,0)
b.toString('hex')
b.readUInt32LE(0)

bytes = Buffer.alloc(7)
bytes.writeUInt32BE(1000000,3)
bytes.toString('hex')
bytes.readUInt32BE(3)



/*
bytes1 = Buffer.alloc(10);
bytes1.writeInt32LE([22],0)
console.log(bytes1)
readable = new Readable()
readable.push(bytes1)
readable.push(null)
result = two.read_int(readable, 10, 'little')

console.log('result1:',result)

bytes1 = Buffer.alloc(7);
bytes1.writeUInt8(0x00,0)
bytes1.writeUInt8(0x00,1)
bytes1.writeUInt8(0x00,2)
bytes1.writeUInt8(0x00,3)
bytes1.writeUInt8(0x0F,4)
bytes1.writeUInt8(0x42,5)
bytes1.writeUInt8(0x40,6)

bytes = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x0f, 0x42, 0x40])

console.log(parseInt(bytes.toString('hex'),16))
console.log(parseInt('0x00000f4240',16))

bytes = Buffer.alloc(7)
bytes.writeInt32BE(1000000,0)
console.log('bytes', bytes)
console.log('bytes', bytes.readInt32BE(0))
//bytes1.writeInt16LE(0x4240,3)
console.log(bytes1)
readable = new Readable()
readable.push(bytes1)
readable.push(null)
result = two.read_int(readable, 7, 'big')
result = readable.read(7)
// console.log(bytes1.readInt16BE(0,1))
console.log(bytes1.readUInt16BE(0))
// console.log(bytes1.readInt16BE(2,1))
// console.log(bytes1.readUInt16BE(3,1))
// console.log(bytes1.readInt16BE(4,1))
// console.log(bytes1.readUInt16BE(5,1))
// console.log(bytes1.readInt16BE(6,1))
// console.log(bytes1.readUInt16BE(7,1))
console.log(bytes1.readUInt16BE(5))
console.log(bytes1.readUIntBE(0,6))
console.log(bytes1.readUIntBE(6,1))
//result = readUIntBE(6)
//console.log(result)
*/
eight_byte_int = 2n ** (8n * 8n) - 1n
let buf = Buffer.allocUnsafe(16);
buf.writeUInt32LE(Number(eight_byte_int>>32n),4);
buf.writeUInt32LE(Number(eight_byte_int&4294967295n),0);
buf
