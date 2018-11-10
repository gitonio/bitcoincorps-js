var two = require('./ibd/two/complete');
var Readable = require('stream').Readable
var test_data = require('./test_data')
var answers = require('./ibd/two/answers')
var bb = require('bigint-buffer')
var ip = require('ip')
const net = require('net')



console.log('\n Excercise #2')
version_streams = test_data.make_version_streams()
version_streams.map(vs=>console.log('version:', two.read_version(vs)))


console.log('\n Excercise #3 ')
version_streams = test_data.make_version_streams()
version_streams.map(vs=>console.log('can:', answers.can_send_pong(vs)))

console.log('\n Excercise #4')
console.log(answers.read_bool(test_data.make_stream(Buffer.from([true]))))
console.log(answers.read_bool(test_data.make_stream(Buffer.from([false]))))


//console.log(eight_byte_int = 2n ** (8n * 8n) - 1n)
//console.log(bb.toBufferBE(eight_byte_int, 10))
//console.log(bb.toBigIntBE(bb.toBufferBE(test_data.eight_byte_int, 10)))


enumerated = [
    [test_data.eight_byte_int, test_data.eight_byte_var_int],
    [test_data.four_byte_int, test_data.four_byte_var_int],
    [test_data.two_byte_int, test_data.two_byte_var_int],
    [test_data.one_byte_int, test_data.one_byte_var_int],
    
]

//console.log('enum',enumerated[1][1].toString())
console.log('\n Exercise #5')
enumerated.map(x=>{
    calculated_int = two.read_var_int(test_data.make_stream(x[1]))
    console.log('enum:', x[0], calculated_int)
})

enumerated = [
    [test_data.short_str, test_data.short_var_str],
    [test_data.long_str, test_data.long_var_str],
]

console.log('\n Exercise #6')
enumerated.map(x=>{
    //console.log('x',x[1].length,  x[1])
    calculated_byte_str = test_data.read_var_str(test_data.make_stream(x[1]))
    console.log('enum:', x[0].equals(calculated_byte_str))
    //console.log('enum:', x[0].toString(), calculated_byte_str.toString())
})

console.log('\n Exercise #7')


function test_read_services() {
    services = 1 + 2 + 4 + 1024
    answer = {
        'NODE_NETWORK': true,
        'NODE_GETUXO' : true,
        'NODE_BLOOM'  : true,
        'NODE_WITNESS': false,
        'NODE_NETWORK_LIMITED': true,

    }
    let buf = Buffer.alloc(8)
    buf.writeInt32LE(services, 0)
//    let buf = bb.toBufferLE(services, 8)
    console.log(two.read_services(test_data.make_stream(buf)))

}


test_read_services()

bitfields = [
    1,
    8,
    1 + 8,
    1024,
    8 + 1024,
    1 + 2 + 4 + 8 + 1024,
    2**5 + 2**9 + 2**25,
]

bitfields.map(bitfield=>{
    let buf = Buffer.alloc(8)
    buf.writeInt32LE(services, 0)
    console.log(two.read_services(test_data.make_stream(buf)))

})

console.log('\n Exercise #8')
function offers_node_network_service(services_bitfield) {
    return two.services_int_to_dict(services_bitfield)['NODE_NETWORK']
}

function test_services_0(){
    console.log( offers_node_network_service(1))
    console.log( offers_node_network_service(1+8))
    console.log( offers_node_network_service(4))
}

test_services_0()

console.log('\n Exercise #9')
function offers_node_bloom_and_node_witness_services(services_bitfield) {
    return two.services_int_to_dict(services_bitfield)['NODE_BLOOM'] && two.services_int_to_dict(services_bitfield)['NODE_WITNESS']
}

function test_services_1(){
    console.log( offers_node_bloom_and_node_witness_services(1))
    console.log( offers_node_bloom_and_node_witness_services(1+8))
    console.log( offers_node_bloom_and_node_witness_services(4+8))
}

test_services_1()





function test_read_ip() {
    ipv4 = '10.10.10.10'
    ipa = ip.toBuffer(ipv4)
    ipv4_mapped = Buffer.concat(
        [
            Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff]),
            ipa
        ]
    )
    
    console.log('ip ok:', two.read_ip( ipv4_mapped) == ipv4)
}
test_read_ip()

console.log('\n Exercise #10')
ports = [8333, 55555]
function test_read_port_0() {
    ports.map(port=> {
        let buf = Buffer.alloc(2)
        buf.writeUInt16BE(port)
        result = two.read_port(test_data.make_stream(buf))
        console.log('port:',result)
    })
}

test_read_port_0()

b = Buffer.alloc(10)
b.writeUInt8(22,0)
b.toString('hex')
b.readUInt32LE(0)
console.log(b)
bytes = Buffer.alloc(7)
bytes.writeUInt32BE(1000000,3)
bytes.toString('hex')
bytes.readUInt32BE(3)
console.log(bytes)


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

PEER_IP = "35.187.200.6"
msg = Buffer.from('f9beb4d976657273696f6e00000000006a0000009b228b9e7f1101000f040000000000009341555b000000000f040000000000000000000000000000000000000000000000000f040000000000000000000000000000000000000000000000007256c5439b3aea89142f736f6d652d636f6f6c2d736f6674776172652f0100000001', 'hex')

PEER_PORT = 8333

//const net = require('net');

client2 = net.createConnection({ port: PEER_PORT, host: PEER_IP }, () => {
    // 'connect' listener
    console.log('connected to server!');
    client2.write(msg);
});

client2.on('data', (data) => {
    console.log('incoming:',data)
    readable = new Readable()
    readable.push(data)
    readable.push(null)
    pkt = two.Packet.read_from_socket(readable)
    console.log('pkt:', pkt.payload);
    msg = two.VersionMessage.from_bytes(pkt.payload)
    client2.end();
});
client2.on('end', () => {
    console.log('disconnected from server');
});