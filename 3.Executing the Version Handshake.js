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

    var dat = ''
    var client = net.connect(PEER_PORT, PEER_IP, function () {
        console.log('client connected')
        client.write(msg)

    })


    client.on('data', data => {
        cb(data, client)

        console.log('after data')
    })
    // let va = new three.VerackMessage()
    // let vp = new three.Packet(va.command, va.to_bytes())
    // let vpb = vp.to_bytes()

    // client.write(vpb)
    //client.on('end', ()=>cb(dat))
    client.on('end', () => console.log('client.end'))
    client.on('error', () => console.log('client.error'))
}

function handshake(address, port) {

    services = 0
    my_ip = '7.7.7.7'
    peer_ip = address
    port = port
    now = 100000
    my_address = new three.Address(services, my_ip, port, now)
    peer_address = new three.Address(services, peer_ip, port, now)

    version_message = new three.VersionMessage(
        70015,
        services,
        now,
        my_address,
        peer_address,
        73948692739875n,
        Buffer.from('bitcoin-corps', 'ascii'),
        0,
        true
    )
    //console.log(version_message)
    version_packet = new three.Packet(
        version_message.command,
        version_message.to_bytes()
    )
    //console.log(version_packet)
    serialized_packet = version_packet.to_bytes()
    console.log('sp:', serialized_packet.toString('hex'))
    send_message(msg, PEER_PORT, function (data, client) {
        console.log('slice', data.slice(4, 11).toString('ascii'))
        if (data.slice(4, 11).toString('ascii') == 'version') {
            let readable = new Readable()
            readable.push(data)
            readable.push(null)
            let pkt = three.Packet.read_from_socket(readable)
            console.log('version?:', pkt.command.toString('ascii') == 'version')
            let vm = three.VersionMessage.from_bytes(pkt.payload)
            console.table(vm)
            let pkt2 = three.Packet.read_from_socket(readable)
            console.log(pkt2.command.toString('ascii'))
            let vm2 = three.VerackMessage.from_bytes(pkt2.payload)
            console.log('pkt', vm2)
            let va = new three.VerackMessage()
            let vp = new three.Packet(va.command, va.to_bytes())
            let vpb = vp.to_bytes()
            //vpb = Buffer.from('f9beb4d976657261636b000000000000000000005df6e0e2','hex')
            console.log('vpb', vpb.toString('hex'))
            console.log('vp', vp, vp.command.toString('ascii'), vp.payload)
            //   send_message(vpb, PEER_PORT, function (data2) {
            //       console.log('done', data2)
            //   })
            console.log('cw', client.write(vpb, () => console.log('written verack')))
            //return null
        } else if (data.slice(4, 10).toString('ascii') == 'verack') {
            console.log('else if data', data.slice(4, 10).toString('ascii'))
            let readable = new Readable()
            readable.push(data)
            readable.push(null)
            let pkt = three.Packet.read_from_socket(readable)
            console.log(pkt.command.toString('ascii'))
            let vm = three.VerackMessage.from_bytes(pkt.payload)
            console.log('pkt', vm)
            let va = new three.VerackMessage()
            let vp = new three.Packet(va.command, va.to_bytes()).to_bytes()
            send_message(vp, PEER_PORT, function (data2) {
                console.log('done', data2)
            })

        } else {
            console.log('else data', data.slice(4, 10).toString('ascii'))

        }
        console.log('last', data.slice(4, 10).toString('ascii'))
    })


}

//handshake("35.198.151.21", 8333)


function simple_crawler() {
    addresses = [
        ["35.198.151.21", 8333],
        ["91.221.70.137", 8333],
        ["92.255.176.109", 8333],
        ["94.199.178.17", 8333],
        ["213.250.21.112", 8333],
    ]

    // var addresses = new Set()
    // addresses.add("35.198.151.21")
    // addresses.add("91.221.70.137")
    // addresses.add("92.255.176.109")
    // addresses.add("94.199.178.17")
    // addresses.add("213.250.21.112")


    services = 0
    my_ip = '7.7.7.7'
    peer_ip = addresses[0][0]
    port = addresses[0][1]
    now = 100000
    my_address = new three.Address(services, my_ip, port, now)
    peer_address = new three.Address(services, peer_ip, port, now)

    version_message = new three.VersionMessage(
        70015,
        services,
        now,
        my_address,
        peer_address,
        73948692739875n,
        Buffer.from('bitcoin-corps', 'ascii'),
        0,
        true
    )
    //console.log(version_message)
    version_packet = new three.Packet(
        version_message.command,
        version_message.to_bytes()
    )
    //console.log(version_packet)
    serialized_packet = version_packet.to_bytes()
    console.log('sp:', serialized_packet.toString('hex'))

    while (addresses.length > 0) {
        address = addresses.pop()
        console.log('connecting to', address[0])

        send_message(msg, PEER_PORT, function (data, client) {
            console.log('slice', data.slice(4, 11).toString('ascii'))
            //if (data.slice(4, 11).toString('ascii') == 'version') {
                let readable = new Readable()
                readable.push(data)
                readable.push(null)
                let pkt = three.Packet.read_from_socket(readable)
                console.log(pkt.command.toString('ascii'))
            if (pkt.command == 'version') {
                let vm = three.VersionMessage.from_bytes(pkt.payload)
                console.table(vm)
                let pkt2 = three.Packet.read_from_socket(readable)
                console.log(pkt2.command.toString('ascii'))
                let vm2 = three.VerackMessage.from_bytes(pkt2.payload)
                console.log('pkt', vm2)
                let va = new three.VerackMessage()
                let vp = new three.Packet(va.command, va.to_bytes())
                let vpb = vp.to_bytes()
                //vpb = Buffer.from('f9beb4d976657261636b000000000000000000005df6e0e2','hex')
                console.log('vpb', vpb.toString('hex'))
                console.log('vp', vp, vp.command.toString('ascii'), vp.payload)
                //   send_message(vpb, PEER_PORT, function (data2) {
                //       console.log('done', data2)
                //   })
                console.log('cw', client.write(vpb, () => console.log('written verack')))
                //return null
            } else if (pkt.command == 'addr') {
                console.log('else if data', data.slice(4, 10).toString('ascii'))
                //let readable = new Readable()
                //readable.push(data)
                //readable.push(null)
                //let pkt = three.Packet.read_from_socket(readable)
                //console.log('pkt', pkt)
                let addr_message = three.AddrMessage.from_bytes(pkt.payload)
                console.log(addr_message)
                if (addr_message.addresses.length > 1) {
                    addr_message.addresses.map(address => addresses.push([address.ip, address.port]))
                }
                console.log(addresses)
            } else {
                console.log('else data', data.slice(4, 10).toString('ascii'))

            }


        })
    }
}

simple_crawler()