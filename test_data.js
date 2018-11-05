var Readable = require('stream').Readable
var bb = require('bigint-buffer')
var two = require('./ibd/two/complete')
version_byte_strings = [
'7f1101000d0400000000000033c2585b000000000f040000000000000000000000000000000000000000000000000d040000000000000000000000000000000000000000000000007bc5a780a187c1da102f5361746f7368693a302e31362e302f8d24080001',
'61ea00000d0400000000000033c2585b000000000f040000000000000000000000000000000000000000000000000d040000000000000000000000000000000000000000000000007bc5a780a187c1da102f5361746f7368693a302e31362e302f8d24080001',
'6a0000000d0400000000000033c2585b000000000f040000000000000000000000000000000000000000000000000d040000000000000000000000000000000000000000000000007bc5a780a187c1da102f5361746f7368693a302e31362e302f8d24080001'
]


function encode_var_int(i) {
    if (i < 0xfd) {
        return Buffer.from([i])
    } else if (i < 2** (8*2)) {
        buf = Buffer.allocUnsafe(2)
        buf.writeUInt16BE(i)
        return Buffer.concat([Buffer.from('fd','hex'),buf])
    } else if (i < 2** (8*4)) {
        buf = Buffer.allocUnsafe(4)
        return Buffer.concat([Buffer.from('fe','hex')],[buf.writeUInt32LE(i)])
    } else if (i < 2n** (8n*8n)) {
        buf = Buffer.allocUnsafe(8)
        return Buffer.concat([Buffer.from('ff','hex')],[buf.writeUInt32LE(i)])
    }
}

function read_var_str(s) {
    start = 0
    i = s.readUInt8(0)
    if (i < 0xfd) {
        start = 1
    } else if (i < 2** (8*2)) {
        start = 3
    } else if (i < 2** (8*4)) {
        start = 4
    } else if (i < 2n** (8n*8n)) {
        start = 9
    }

    console.log('s',start,s)
    length = two.read_var_int(s)
    string = s.slice(start, start + length)
    console.log('s', length, string)
    return string
}

function encode_var_str(s) {
    console.log('length', s.length)
    length = encode_var_int(s.length)
    console.log('length',length)
    return Buffer.concat([length, s])
}
function make_version_bufs () {
        

        return version_byte_strings.map(x=> {
        readable = new Readable()
        readable.push(Buffer.from(x,'hex'))
        readable.push(null)
        return Buffer.from(x,'hex')

            
        })    
}


true_bytes = Buffer.from([true])
false_bytes = Buffer.from([false])

eight_byte_int = 2n ** (8n * 8n) - 1n
four_byte_int = 2 ** (8 * 4) - 1
two_byte_int = 2 ** (8 * 2) - 1
one_byte_int = 7
eight_byte_int_bytes = bb.toBufferBE(eight_byte_int,10)
four_byte_int_bytes = Buffer.alloc(4)
four_byte_int_bytes.writeUInt32LE(four_byte_int)

two_byte_int_bytes = Buffer.alloc(2)
two_byte_int_bytes.writeUInt16LE(two_byte_int)
one_byte_int_bytes = Buffer.from([one_byte_int])

eight_byte_prefix = Buffer.from([0xff])
four_byte_prefix = Buffer.from([0xfe])
two_byte_prefix = Buffer.from([0xfd])

eight_byte_var_int = Buffer.concat([eight_byte_prefix, eight_byte_int_bytes])
four_byte_var_int = Buffer.concat([four_byte_prefix, four_byte_int_bytes])
two_byte_var_int = Buffer.concat([two_byte_prefix, two_byte_int_bytes])
one_byte_var_int = one_byte_int_bytes

console.log(four_byte_int_bytes.toString(), four_byte_prefix.toString('hex'), four_byte_var_int.toString('hex'), one_byte_var_int.toString('hex'))
str = "A purely peer-to-peer version of electronic cash would allow online payments to be sent directly from one party to another without going through a financial institution. Digital signatures provide part of the solution, but the main benefits are lost if a trusted third party is still required to prevent double-spending. We propose a solution to the double-spending problem using a peer-to-peer network.  The network timestamps transactions by hashing them into an ongoing chain of hash-based proof-of-work, forming a record that cannot be changed without redoing the proof-of-work. The longest chain not only serves as proof of the sequence of events witnessed, but proof that it came from the largest pool of CPU power. As long as a majority of CPU power is controlled by nodes that are not cooperating to attack the network, they'll generate the longest chain and outpace attackers. The network itself requires minimal structure. Messages are broadcast on a best effort basis, and nodes can leave and rejoin the network at will, accepting the longest proof-of-work chain as proof of what happened while they were gone."

long_str = Buffer.from(str,'ascii')
long_var_str = Buffer.concat([encode_var_str(long_str),Buffer.from('!','ascii')])
short_str = Buffer.from("!",'ascii')
short_var_str = encode_var_str(short_str)


module.exports.make_version_bufs = make_version_bufs
module.exports.eight_byte_int = eight_byte_int
module.exports.two_byte_int = two_byte_int
module.exports.four_byte_int = four_byte_int
module.exports.one_byte_int = one_byte_int
module.exports.eight_byte_int_bytes = eight_byte_int_bytes
module.exports.two_byte_int_bytes = two_byte_int_bytes
module.exports.four_byte_int_bytes = four_byte_int_bytes
module.exports.one_byte_int_bytes = one_byte_int_bytes

module.exports.eight_byte_var_int = eight_byte_var_int
module.exports.two_byte_var_int = two_byte_var_int
module.exports.four_byte_var_int = four_byte_var_int
module.exports.one_byte_var_int = one_byte_var_int

module.exports.read_var_str = read_var_str

module.exports.long_var_str = long_var_str
module.exports.short_var_str = short_var_str
module.exports.long_str = long_str
module.exports.short_str = short_str