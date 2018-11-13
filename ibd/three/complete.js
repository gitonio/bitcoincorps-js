var toBigIntBE = require('bigint-buffer').toBigIntBE
var toBigIntLE = require('bigint-buffer').toBigIntLE
var toBufferLE = require('bigint-buffer').toBufferLE
var hash = require('hash.js')
var Readable = require('stream').Readable
var ip = require('ip')


function read_magic(sock) {
    magic_bytes = sock.read(4)
    magic = magic_bytes.readUInt32BE(0)
    return magic

}

function read_command(sock) {
    raw = sock.read(12)
    //# remove empty bytes
    command = raw.filter(obj => obj != 0)
    return command
}

//# hexidecimal integers copied from protocol documentation
NETWORK_MAGIC = 0xD9B4BEF9
TESTNET_NETWORK_MAGIC = 0x0709110B

function read_version(stream) {
    buf = stream.read(4)
    return buf.readInt32LE(0)
}


function read_timestamp(stream) {
    buf = stream.read(4)
    timestamp = buf.readUInt32LE(0)
    return timestamp
}

function read_var_int(stream) {
    //TODO add logic
    //const i = buf.readUInt8(0)
    const i = stream.read(1).readUInt8(0)

    if (i == 0xff) {
        b = buf.slice(1, buf.length)
        b = stream.read(8)
        return toBigIntBE(b)
    } else if (i == 0xfe) {
        buf = stream.read(4)
        return buf.readUInt32LE(0)
    } else if (i == 0xfd) {
        buf = stream.read(2)
        return buf.readUInt16BE(0)
    } else {
        return i
    }
}
function read_var_str(s) {
    length = read_var_int(s)
    string = s.read(length)
    return string
}

function read_ip(stream) {
    buf = stream.read(16)
    var offset = 12
    return ip.toString(buf, offset, 4)
}

function read_port(stream) {
    let buf = stream.read(2)
    return buf.readUInt16BE(0)
}

function lookup_services_key(services, key) {
    key_to_bit = {
        'NODE_NETWORK': 0,
        'NODE_GETUXO': 1,
        'NODE_BLOOM': 2,
        'NODE_WITNESS': 3,
        'NODE_NETWORK_LIMITED': 10,    
    }
    bit = key_to_bit[key]
    return check_bit(services, bit)
}
class AddrMessage {
    constructor(addresses) {
        this.command = Buffer.from('addr', 'ascii')
        this.addresses = addresses
    }

    static from_bytes(bytes) {
        var readable = new Readable()
        readable.push(bytes)
        readable.push(null)
        let count = read_var_int(readable)
        let address_list = []
        for (let index = 0; index < count; index++) {
            address_list.push(Address.from_stream(readable))

        }
        return new AddrMessage(address_list)
    }
}
class Address {
    constructor(services, ip, port, time) {
        this.services = services
        this.ip = ip
        this.port = port
        this.time = time
    }
    static from_stream(buf, version_msg = false) {
        let time
        if (version_msg) time = null
        else {
            time = read_timestamp(buf)
        }
        let services = read_services(buf)
        let ip = read_ip(buf)
        let port = read_port(buf)
        return new Address(services, ip, port, time)

    }
    to_bytes() {
        let buf = Buffer.alloc(16)
        let buf2 = Buffer.alloc(2)
        buf2.writeUInt16BE(this.port)
        return Buffer.concat([
            time_to_bytes(this.time),
            services_to_bytes(this.services),
            ip.toBuffer(this.ip,buf,12),
            buf2,
        ])
    }

}

Address.prototype.toString = function () {
    return `${this.ip}: ${this.port}`
}

class Packet {
    constructor(command, payload) {
        this.command = command;
        this.payload = payload;
    }

    static read_from_socket(sock) {
        const magic = read_magic(sock)

//        if (magic.toString(16) != NETWORK_MAGIC.toString(16)) {
//            throw new Error(`magic is not right, ${magic.toString(16)},${NETWORK_MAGIC.toString(16)}`);
//        }
        command = read_command(sock)
        let payload_length = read_length(sock)
        let checksum = read_checksum(sock)
        let payload = read_payload(sock, payload_length)
        let calculated_checksum = calculate_checksum(payload)
        if (!checksum.equals(calculated_checksum)) {
            throw new Error('checksum does not match');
        }
        if (payload_length != payload.length)
            throw new Error("Tried to read {payload_length} bytes, only received {len(payload)} bytes")
        return new Packet(command, payload);
    }

    to_bytes() {
        buf = Buffer.alloc(4)
        buf.writeUInt32LE(this.payload.length)
        return Buffer.concat(
            [Buffer.from(NETWORK_MAGIC.toString(16), 'hex'),
//            [Buffer.from('f9beb4d9', 'hex'),
            this.command,
                buf,
            calculate_checksum(this.payload),
            this.payload
            ]
        )

    }

    serialize() {
        /*
         return Buffer.concat([
            NETWORK_MAGIC, 
            this.command, 
            this.payload !== null ?  helper.intToLittleEndian(this.payload.length,4) : Buffer.from([0x00,0x00,0x00,0x00]),
            Buffer.from(helper.doubleSha256(this.payload).slice(0,8),'hex'),
            this.payload !== null ?  this.payload : Buffer.from([]),
            //this.payload ,
            ])
        */
    }
}
Packet.prototype.toString = function () {
    let result = ''
    return `${this.command.toString('ascii')}: ${this.payload.toString('hex')}`
}

function read_length(sock) {
    raw = sock.read(4)
    length = raw.readUInt32LE(0)
    return length
}
function read_checksum(sock) {
    //# FIXME: protocol documentation says this should be an integer ...
    raw = sock.read(4)
    return raw
}
function read_payload(sock, length) {
    payload = sock.read(length)
    return payload
}
function calculate_checksum(payload_bytes) {
    //"""First 4 bytes of sha256(sha256(payload))"""
    first_round = Buffer.from(hash.sha256().update(payload_bytes).digest('hex'), 'hex');
    second_round = hash.sha256().update(first_round).digest('hex');
    first_four_bytes = second_round.slice(0, 8)
    return Buffer.from(first_four_bytes, 'hex')
}
function read_services(stream) {
    //buf = stream.read(4)
    buf = stream.read(8)
    //console.log('services',buf)
    services_int = buf.readUInt32BE(4)
    return services_int
}
function check_bit(number, index) {
    mask = 1 << index
    return (number & mask) == 0 ? false : true
}

function services_int_to_dict(services_int) {
    return {
        'NODE_NETWORK': check_bit(services_int, 0),
        'NODE_GETUXO': check_bit(services_int, 1),
        'NODE_BLOOM': check_bit(services_int, 2),
        'NODE_WITNESS': check_bit(services_int, 3),
        'NODE_NETWORK_LIMITED': check_bit(services_int, 10),

    }
}
function services_to_bytes(services) {
    buf0 = Buffer.alloc(4)
    buf = Buffer.alloc(4)
    buf.writeUInt8(services, 3)
    return Buffer.concat([buf0,buf])
}
function time_to_bytes(time) {
    buf = new Buffer(4)
    buf.writeUInt32LE(time)
    return buf
}

function port_to_bytes(port) {
    buf = Buffer.alloc(4)
    buf.writeUInt32LE(port)
    return buf
}
function encode_command(cmd) {
    padding_needed = 12 - cmd.length
    padding = Buffer.alloc(padding_needed)
    return Buffer.concat([cmd, padding])
}
class VersionMessage {

    //command = Buffer.from('version', 'ascii');

    constructor(version, services, time, addr_recv, addr_from,
        nonce, user_agent, start_height, relay) {
        this.version = version
        this.services = services
        this.time = time
        this.addr_recv = addr_recv
        this.addr_from = addr_from
        this.nonce = nonce
        this.user_agent = user_agent
        this.start_height = start_height
        this.relay = relay
        this.command = Buffer.from('version', 'ascii')
    }

    static from_bytes(payload) {
        let readable = new Readable()
        readable.push(payload)
        readable.push(null)
        let version = read_version(readable)
         let services = read_services(readable)
        let time = read_timestamp(readable)
        
        let addr_recv = Address.from_stream(readable)
        let addr_from = Address.from_stream(readable)
        let nonce = toBigIntLE(readable.read(8))

        let user_agent = read_var_str(readable)
        let buf = readable.read(4)
        let start_height = buf.readUInt32LE(0)
        let relay = read_bool(readable)
        return new VersionMessage(version, services, timestamp, addr_recv, addr_from, nonce, user_agent, start_height, relay)
    }

    to_bytes() {
        let buf = Buffer.alloc(4)
        buf.writeUInt32LE(this.version)
        let buf2 = Buffer.alloc(4)
        buf2.writeUInt32LE(this.start_height)
        let buf3 = Buffer.alloc(1)
        buf3.writeUInt8(1,0)
        let msg = Buffer.concat([
            buf,
            services_to_bytes(this.services),
            time_to_bytes(this.time),
            this.addr_recv.to_bytes(),
            this.addr_from.to_bytes(),
            toBufferLE(BigInt(this.nonce),8),
            str_to_var_str(this.user_agent),
            buf2,
            buf3
        ])
        return msg
    }
}
function read_bool(stream) {
    buf = stream.read(1)
    return buf.readInt8(0) == 1 ? true : false
}

function bool_to_bytes(bool) {
    return bool == true ? Buffer.from([0x01]) : Buffer.from([0x00])
}

function int_to_var_int(i) {
    if (i < 0xfd) {
        return Buffer.from([i])
    } else if (i < 2** (8*2)) {
        buf = Buffer.allocUnsafe(2)
        buf.writeUInt16LE(i)
        return Buffer.concat([
            Buffer.from('fd','hex'),
            buf
        ])
    } else if (i < 2** (8*4)) {
        buf = Buffer.allocUnsafe(4)
        buf.writeUInt32LE(i)
        return Buffer.concat([
            Buffer.from('fe','hex'),
            buf
        ])
    } else if (i < 2n** (8n*8n)) {
        buf = Buffer.allocUnsafe(8)
        return Buffer.concat([
            Buffer.from('ff','hex'),
            toBufferLE(i,8)
        ])
    }
}

function read_var_str(s) {
    length = read_var_int(s)
    string = s.read(length)
    return string
}

function str_to_var_str(s) {
    length = int_to_var_int(s.length)
    return Buffer.concat([length, s])
}


module.exports.read_version = read_version
module.exports.read_var_int = read_var_int
module.exports.read_var_str = read_var_str
module.exports.Packet = Packet
module.exports.Address = Address
module.exports.AddrMessage = AddrMessage
module.exports.VersionMessage = VersionMessage
module.exports.read_services = read_services
module.exports.services_int_to_dict = services_int_to_dict
module.exports.lookup_services_key = lookup_services_key
module.exports.check_bit = check_bit
module.exports.read_ip = read_ip
module.exports.read_port = read_port
module.exports.read_bool = read_bool
module.exports.bool_to_bytes = bool_to_bytes
module.exports.int_to_var_int = int_to_var_int
module.exports.str_to_var_str = str_to_var_str