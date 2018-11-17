var { assert, expect } = require('chai');
var BN = require('bn.js')
var Readable = require('stream').Readable
EC = require('elliptic').ec;
var _ = require('lodash');
const uuidv1 = require('uuid/v1')

var three = require('../ibd/three/complete')
var ec = new EC('secp256k1');
var ip = require('ip')



class FakeSocket {
    constructor(bytes){
        this.stream = new Readable()
        this.stream.push(bytes)
        this.stream.push(null)
    }
}


describe('test three', function () {

    services = 1
    my_ip = "7.7.7.7"
    peer_ip = "6.6.6.6"
    port = 8333
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

    
    it('test_version_message_round_trip', function () {

        version_message_bytes = version_message.to_bytes()
        packet = new three.Packet(Buffer.from('version','ascii'), version_message_bytes)
        packet_bytes = packet.to_bytes()
        sock = new FakeSocket(packet_bytes).stream
        packet_2 = three.Packet.read_from_socket(sock)
        version_message_2 = three.VersionMessage.from_bytes(packet_2.payload)
        assert.deepEqual(version_message_2, version_message)

    })

    it('test_services', function () {

        services = 1 + 2 + 4 + 8 + 1024

        let keys = [
            "NODE_NETWORK",
            "NODE_GETUTXO",
            "NODE_BLOOM",
            "NODE_WITNESS",
            "NODE_NETWORK_LIMITED"
        ]
        keys.map(key=>assert(three.lookup_services_key(services,key)))

        services = 0
        keys.map(key=>assert(!three.lookup_services_key(services,key)))

    })

    it('test_ip_addresses', function () {

        ipv4_bytes = Buffer.from('00000000000000000000000001010101','hex')
        ipv6_bytes = Buffer.from('07070707070707070707070707070707','hex')

        ipv4 = ip.toString(ipv4_bytes,12,4)

        assert.equal(ipv4, '1.1.1.1')
        var buf = new Buffer(16)
        assert.deepEqual(ip.toBuffer(ipv4, buf, 12),ipv4_bytes)

        ipv6 = ip.toString(ipv6_bytes)
        assert.equal(ipv6,'707:707:707:707:707:707:707:707')
        assert.deepEqual(ip.toBuffer(ipv6, buf, 0), ipv6_bytes)
    })

    it('test_parse_addrs', function () {

        raw_addr_payload = Buffer.from('0133f67c5b0d0000000000000000000000000000000000ffff23c69715208d','hex')
        addr = three.AddrMessage.from_bytes(raw_addr_payload)
        assert.equal(1, addr.addresses.length)
        address = addr.addresses[0]

        assert.equal(address.port, 8333)
        assert.equal(address.ip, "35.198.151.21")
    

    })

    it('test', function () {
        let va = new three.VerackMessage()
        let vp = new three.Packet(va.command, va.to_bytes())
        let vpb = vp.to_bytes()
        let want = Buffer.from('f9beb4d976657261636b000000000000000000005df6e0e2','hex')
        assert.deepEqual(vpb, want)
    })


})
 