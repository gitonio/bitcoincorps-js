var two = require('./ibd/two/complete');
var Readable = require('stream').Readable
var test_data = require('./test_data')
var answers = require('./ibd/two/answers')
var bb = require('bigint-buffer')
var ip = require('ip')


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

    from_bytes( buf ) {
         
        version = read_int(buf,4)
        services = read_int(buf, 8)
        timestamp = read_int(buf, 8)
        addr_recv = buf.slice(19,19+26)
        addr_from = buf.slice(19+26, 19+26+26, )
    }
}
/*
console.log('Excercise #2')
version_bufs = test_data.make_version_bufs()
version_bufs.map(vs=>console.log('version:', two.read_version(vs)))

console.log('Excercise #3')
version_bufs.map(vs=>console.log('can:', answers.can_send_pong(vs)))

console.log(answers.read_bool(Buffer.from([true])))
console.log(answers.read_bool(Buffer.from([false])))

console.log(eight_byte_int = 2n ** (8n * 8n) - 1n)
console.log(bb.toBufferBE(eight_byte_int, 10))
console.log(bb.toBigIntBE(bb.toBufferBE(test_data.eight_byte_int, 10)))


enumerated = [
    [test_data.eight_byte_int, test_data.eight_byte_var_int],
    [test_data.four_byte_int, test_data.four_byte_var_int],
    [test_data.two_byte_int, test_data.two_byte_var_int],
    [test_data.one_byte_int, test_data.one_byte_var_int],
    
]

//console.log('enum',enumerated[1][1].toString())

enumerated.map(x=>{
    calculated_int = two.read_var_int(x[1])
    console.log('enum:', x[0], calculated_int)
})

enumerated = [
    [test_data.short_str, test_data.short_var_str],
    [test_data.long_str, test_data.long_var_str],
]
enumerated.map(x=>{
    console.log('x',x[1].length,  x[1])
    calculated_byte_str = test_data.read_var_str(x[1])
    console.log('enum:', x[0].equals(calculated_byte_str))
    console.log('enum:', x[0].toString(), calculated_byte_str.toString())
})
*/
function check_bit(number, index) {
    mask = 1 << index
    return (number & mask) == 0 ? false: true
}

function services_int_to_dict(services_int) {
    return {
        'NODE_NETWORK': check_bit(services_int, 0),
        'NODE_GETUXO' : check_bit(services_int,1),
        'NODE_BLOOM'  : check_bit(services_int,2),
        'NODE_WITNESS': check_bit(services_int,3),
        'NODE_NETWORK_LIMITED': check_bit(services_int,10),
   
    }
}

function read_services(buf) {

    services_int = buf.readInt32LE(0)
    return services_int_to_dict(services_int)
}

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
    console.log(read_services(buf))

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
    console.log(read_services(buf))

})


function read_ip(buf) {
    var offset = 12
    return ip.toString(buf, offset, 4)
}

function read_port(buf) {
    return buf.readUInt16LE()
}

class Address {
    constructor(services, ip, port, time) {
        this.services = services
        this.ip = ip
        this.port = port
        this.time = time
    }
    from_buf(buf, version_msg=false) {
        if (version_msg) time = null
        else {
            time = read_timestamp(buf)
            services = read_services(buf)
            ip = read_ip(buf)
            port = read_port(buf)
            return new Address(services, ip, port, time)
        }
    }
}


function test_read_ip() {
    ipv4 = '10.10.10.10'
    ipa = ip.toBuffer(ipv4)
    ipv4_mapped = Buffer.concat(
        [
            Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff]),
            ipa
        ]
    )
    
    console.log('ip ok:', read_ip( ipv4_mapped) == ipv4)
}
test_read_ip()

ports = [8333, 55555]
function test_read_port_0() {
    ports.map(port=> {
        let buf = Buffer.alloc(2)
        buf.writeUInt16LE(port)
        result = read_port(buf)
        console.log(result)
    })
}

test_read_port_0()

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
