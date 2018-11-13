var Readable = require('stream').Readable
var three = require('./ibd/three/complete')
var assert = require('assert')
const net = require('net')

class Pet {

    constructor(kind, name) {
        this.kind = kind
        this.name = name
    }

    static from_bytes(b) {
        let valid_kinds = [Buffer.from('cat', 'ascii'), Buffer.from('dog', 'ascii'), Buffer.from('pig', 'ascii'), Buffer.from('cow', 'ascii'),]
        let readable = new Readable()
        readable.push(b)
        readable.push(null)
        let kind = readable.read(3)
        if (!valid_kinds.findIndex(valid_kind => valid_kind === kind)) {
            throw 'Error'
        }
        let name = readable.read(10)
        return new Pet(kind, name)

    }

    to_bytes() {
        return this.kind + this.name
    }
}

function test_pet_to_bytes() {
    pet_bytes = Buffer.from('pigbuddy', 'ascii')
    pet = Pet.from_bytes(pet_bytes)
    console.log(pet_bytes == pet.to_bytes())
}

test_pet_to_bytes()

console.log('\n Exercise: implement bool_to_bytes')

function test_bool_to_bytes() {
    booleans = [
        true,
        false

    ]
    answers = [
        Buffer.from([0x01]),
        Buffer.from([0x00])
    ]
    booleans.map((bool, i) => assert.deepEqual(answers[i], three.bool_to_bytes(bool)))
}

test_bool_to_bytes()

function test_int_to_var_int() {
    numbers = [
        0x10,
        0x1000,
        0x10000000,
        0x1000000000000000n
    ]
    answers = [
        Buffer.from([0x10]),
        Buffer.from([0xfd, 0x00, 0x10]),
        Buffer.from([0xfe, 0x00, 0x00, 0x00, 0x10]),
        Buffer.from([0xff, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x10]),
    ]
    numbers.map((number, i) => {
        console.log(three.int_to_var_int(number))
        assert.deepEqual(answers[i], three.int_to_var_int(number))
    })
}

console.log('\n Exercise: implement int_to_var_int')
test_int_to_var_int()
str = 'x'
function test_str_to_var_str() {
    strings = [
        Buffer.from(str.repeat(0x10), 'ascii'),
        Buffer.from(str.repeat(0x1000), 'ascii'),
        //Buffer.from(str.repeat(0x10000000),'ascii'),
        //Buffer.from(str.repeat(0x100000001),'ascii'),
    ]
    answers = [
        Buffer.concat([Buffer.from([0x10]), strings[0]]),
        Buffer.concat([Buffer.from([0xfd, 0x00, 0x10]), strings[1]]),
        //Buffer.concat([Buffer.from([,0xfe, 0x00,0x00, 0x00, 0x10]),strings[2]]),
        //Buffer.concat([Buffer.from([0xff]),strings[3]]),
    ]

    strings.map((string, i) => assert.deepEqual(answers[i], three.str_to_var_str(string)))
    //strings.map((string,i)=> console.log(three.str_to_var_str(string)))
    //strings.map((string,i)=> console.log(answers[i]))
}
console.log('\n Exercise: implement str_to_var_str')
test_str_to_var_str()




PEER_IP = "35.187.200.6"
msg = Buffer.from('f9beb4d976657273696f6e00000000006a0000009b228b9e7f1101000f040000000000009341555b000000000f040000000000000000000000000000000000000000000000000f040000000000000000000000000000000000000000000000007256c5439b3aea89142f736f6d652d636f6f6c2d736f6674776172652f0100000001', 'hex')

PEER_PORT = 8333

//const net = require('net');
function send_message(msg, PEER_PORT, cb) {
    //msg = JSON.stringify(msg)
    
    var client = net.connect(PEER_PORT, PEER_IP, function () {
        console.log('client connected')
    })

    client.write(msg)

    client.on('data', function (data) {
        dat = data.toString('utf8')
        console.log('on data', dat)
        cb(dat)
        client.end()
    })

    client.on('end', () => console.log('client.end'))
}

function handshake(address, port) {

    services = 1
    my_ip = '7.7.7.7'
    peer_ip = address
    port = port
    now = 10000
    my_address = new three.Address(services, my_ip, port, now)
    peer_address = new three.Address(services, peer_ip, port, now)

    version_message = new three.VersionMessage(
        70015,
        services,
        now,
        my_address,
        peer_address,
        73948692739875n,
        Buffer.from('bitcoin-corps','ascii'),
        0,
        true
    )
    console.log(version_message)
    version_packet = new three.Packet(
        version_message.command,
        version_message.to_bytes()
    )
    console.log(version_packet)
    serialized_packet = version_packet.to_bytes()
    console.log(serialized_packet)
    send_message(serialized_packet, PEER_PORT, function (data) {

        console.log(`{"command":, "${JSON.parse(data)}"}`)

        send_message(msg, PEER_PORT, function (data2) {
            console.log('done', data2)
        })
    })

/*

    client2 = net.createConnection({ port: PEER_PORT, host: PEER_IP }, () => {
        // 'connect' listener
        console.log('connected to server!');
        client2.write(serialized_packet);
    });

    client2.on('data', (data) => {
        console.log('incoming:', data)
        readable = new Readable()
        readable.push(data)
        readable.push(null)
        pkt = two.Packet.read_from_socket(readable)
        console.log('pkt:', pkt.payload);
        msg = two.VersionMessage.from_bytes(pkt.payload)
        console.log(msg)
        client2.end();
    });

    client2.on('end', () => {
        console.log('disconnected from server');
    });
*/

}

handshake("35.198.151.21", 8333)
