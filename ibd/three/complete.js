var toBigIntBE = require('bigint-buffer').toBigIntBE
var toBigIntLE = require('bigint-buffer').toBigIntLE
var hash = require('hash.js')
var Readable = require('stream').Readable
var ip = require('ip')


function read_magic(sock) {
    magic_bytes = sock.read(4)
    magic = magic_bytes.readUInt32LE(0)
    console.log('magic', magic_bytes)
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
    return new Date(timestamp)
}

function read_var_int(stream) {
	//TODO add logic
	//const i = buf.readUInt8(0)
	const i = stream.read(1).readUInt8(0)

	if (i == 0xff) {
		b = buf.slice(1,buf.length)
		b = stream.read(8)
		return toBigIntBE(b)
	} else if (i == 0xfe){
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

function read_ip(buf) {
    var offset = 12
    return ip.toString(buf, offset, 4)
}

function read_port(stream) {
	let buf = stream.read(2)
	return buf.readUInt16BE(0)
}

class Address {
    constructor(services, ip, port, time) {
        this.services = services
        this.ip = ip
        this.port = port
        this.time = time
    }
    static from_stream(buf, version_msg=false) {
        if (version_msg) time = null
        else {
            let time = read_timestamp(buf)
            let services = read_services(buf)
            let ip = read_ip(buf)
            let port = read_port(buf)
            return new Address(services, ip, port, time)
        }
    }
}

Address.prototype.toString = function(){
	return `${this.ip}: ${this.port}`
}

class Packet {
    constructor(command, payload) {
        this.command = command;
        this.payload = payload;
    }

    static read_from_socket(sock) {
        const magic = read_magic(sock)

        if (magic.toString(16) != NETWORK_MAGIC.toString(16)) {
            throw new Error(`magic is not right, ${magic.toString(16)},${NETWORK_MAGIC.toString(16)}` );
        }
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
        let result = Buffer.from(NETWORK_MAGIC.toString(16),'hex')
        result += encode_command(this.command)
        result += Buffer.from([this.payload.length])
        result += calculate_checksum(this.payload)
        result += this.payload
        return result
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
    buf = stream.read(4)
    services_int = buf.readInt32LE(0)
    return services_int_to_dict(services_int)
}
function check_bit(number, index) {
    mask = 1 << index
    return (number & mask) == 0 ? false: true
}

function services_int_to_dict(services_int) {
    return {
        'NODE_NETWORK': check_bit(services_int, 0),
        'NODE_GETUXO' : check_bit(services_int, 1),
        'NODE_BLOOM'  : check_bit(services_int, 2),
        'NODE_WITNESS': check_bit(services_int, 3),
        'NODE_NETWORK_LIMITED': check_bit(services_int,10),
   
    }
}

function encode_command(cmd) {
    padding_needed = 12 - cmd.length
    padding = Buffer.alloc(padding_needed)
    return Buffer.concat([cmd, padding])
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

    static from_bytes( payload ) {
        readable = new Readable()
        readable.push(payload)
        readable.push(null)
    
        let version = read_version(readable)
        let services = read_services(readable)
        let timestamp = read_timestamp(readable)
        let addr_recv = Address.from_stream(readable)
        let addr_from = Address.from_stream(readable)
        let nonce = toBigIntLE(readable.read(8))
        //b = stream.read(8)
		//return toBigIntBE(b)

        let user_agent = read_var_str(readable)
        let start_height = readable.read(4).readUInt32LE(0)
        let relay = read_bool(readable)
        return new VersionMessage(version, services, timestamp, addr_recv, addr_from, nonce, user_agent, start_height, relay )
    }

    to_bytes() {
        let msg = Buffer.from(this.version.toString(16),'hex')
        return msg
    }
}
function read_bool(stream) {
    buf = stream.read(1)
    return buf.readInt8(0) == 1 ? true : false
}


module.exports.read_version = read_version
module.exports.read_var_int = read_var_int
module.exports.read_var_str = read_var_str
module.exports.Packet = Packet
module.exports.Address = Address
module.exports.VersionMessage = VersionMessage
module.exports.read_services = read_services
module.exports.services_int_to_dict = services_int_to_dict
module.exports.check_bit = check_bit
module.exports.read_ip = read_ip
module.exports.read_port = read_port
module.exports.read_bool = read_bool