var Readable = require('stream').Readable
const net = require('net');
//from io import BytesIO

class FakeSocket {
    constructor( bytes ) {
        this.readable = new Readable()
        this.readable.push(bytes)
        this.readable.push(null)

    }
    
    read(n) {
        return this.readable.read(n)
    }
}

function create_version_socket(skip_bytes=0){
    

    versionBytes = Buffer.from('f9beb4d976657273696f6e000000000066000000c6a7a2287f1101000d0400000000000026ff545b000000000f040000000000000000000000000000000000000000000000000d0400000000000000000000000000000000000000000000000024fa090ac579f709102f5361746f7368693a302e31362e302fae22080001','hex')
    return new FakeSocket(versionBytes.slice(skip_bytes, versionBytes.length))
}

//# hexidecimal integers copied from protocol documentation
NETWORK_MAGIC = 0xD9B4BEF9
TESTNET_NETWORK_MAGIC = 0x0709110B

//# notice this looks like any old integer even though we declared it
//# using a hexidecimal notation. Under the hood Python stores every integer
//# as base 2 and doesn't care what base integers were initialized in.
console.log("NETWORK_MAGIC:", NETWORK_MAGIC)

function bytes_to_int(b){
    return b.readUIntLE(0,4)    
}

function read_magic(sock) {
    magic_bytes = sock.read(4)
    magic = bytes_to_int(magic_bytes)
    console.log(magic)
    return magic
    
}

function isMainnetMsg(sock) {
    magic = read_magic(sock)
    return magic == NETWORK_MAGIC
    
}

function isTestnetMsg(sock) {
    magic = read_magic(sock)
    return magic == TESTNET_NETWORK_MAGIC
    
}


console.log("Mainnet version message?", isMainnetMsg(create_version_socket()))
console.log("Testnet version message?", isTestnetMsg(create_version_socket()))

function read_command(sock) {
    raw = sock.read(12)
    //# remove empty bytes
    command = raw.filter(obj => obj != 0)
    return command
}

function isVersionMsg(sock) {
    command = read_command(sock)
    return Buffer.from("version", 'ascii').equals( command)
}

function isVerackMsg(sock) {
    command = read_command(sock)
    return Buffer.from("verack", 'ascii').equals(command)
}
//# Throw away the first 4 bytes (the magic)
sock = create_version_socket(skip_bytes=4)
command = read_command(sock)
console.log("Command : ", command)

sock = create_version_socket(skip_bytes=4)
console.log("Is it a 'version' message?", isVersionMsg(sock))

sock = create_version_socket(skip_bytes=4)
console.log("Is it a 'verack' message?", isVerackMsg(sock))

var hash = require('hash.js');

function read_length(sock){
    raw = sock.read(4)
    length = bytes_to_int(raw)
    return length
}

function read_checksum(sock){
    //# FIXME: protocol documentation says this should be an integer ...
    raw = sock.read(4)
    return raw
}

function calculate_checksum(payload_bytes){
    //"""First 4 bytes of sha256(sha256(payload))"""
    first_round = Buffer.from(hash.sha256().update(payload_bytes).digest('hex'), 'hex');
    second_round = hash.sha256().update(first_round).digest('hex');
    first_four_bytes = second_round.slice(0,8)
    return Buffer.from(first_four_bytes,'hex')
}

function read_payload(sock, length){
    payload = sock.read(length)
    return payload
}

//# skip the "magic" and "command" bytes
sock = create_version_socket(skip_bytes=4+12)

length = read_length(sock)
checksum = read_checksum(sock)
payload = read_payload(sock, length)

console.log("Length: ", length)

console.log("Checksum: ", checksum)

console.log("Payload: ", payload)

console.log(calculate_checksum(payload))
console.log("checksum == calculate_checksum(payload)?: ", 
      checksum.equals(calculate_checksum(payload)))

      class Message {
        constructor( command, payload) {
            this.command = command;
            this.payload = payload;
        }
       
        static read_from_socket (sock) {
            const magic = read_magic(sock)
            
            if (magic.toString(16) != NETWORK_MAGIC.toString(16)) {
                throw new Error('magic is not right');
            }
            command = read_command(sock)
            console.log('pl', command)
            let payload_length = read_length(sock)
            console.log('pl2')
            console.log('pl:', payload_length)
            checksum = read_checksum(sock)
            payload = read_payload(sock, payload_length)
            
            let calculated_checksum = calculate_checksum(payload)
            if (!checksum.equals(calculated_checksum)) {
                throw new Error('checksum does not match');
            }
            if (payload_length != payload.length)
                throw new Error("Tried to read {payload_length} bytes, only received {len(payload)} bytes")
            return new Message(command, payload);
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
    Message.prototype.toString = function(){
        let result = ''
        return `${this.command.toString('ascii')}: ${this.payload.toString('hex')}`
    }
        
    msg = Buffer.from('f9beb4d976657273696f6e00000000006a0000009b228b9e7f1101000f040000000000009341555b000000000f040000000000000000000000000000000000000000000000000f040000000000000000000000000000000000000000000000007256c5439b3aea89142f736f6d652d636f6f6c2d736f6674776172652f0100000001','hex')
//socket.on('connect_error',(error) => {console.log('error',error)})
//socket.send(msg)
//socket.on('event', function(data){});
//socket.on('disconnect', function(){console.log('disconnect')});

PEER_IP = "35.187.200.6"

PEER_PORT = 8333

//const net = require('net');

client2 = net.createConnection({ port: PEER_PORT, host: PEER_IP }, () => {
  // 'connect' listener
  console.log('connected to server!');
  client2.write(msg);
});

client2.on('data', (data) => {
    console.log('incoming')
        readable = new Readable()
        readable.push(data)
        readable.push(null)
    msg = Message.read_from_socket(readable)
  console.log('msg:',msg.toString('hex'));

  client2.end();
});
client2.on('end', () => {
  console.log('disconnected from server');
});