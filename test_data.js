var Readable = require('stream').Readable


version_byte_strings = [
'7f1101000d0400000000000033c2585b000000000f040000000000000000000000000000000000000000000000000d040000000000000000000000000000000000000000000000007bc5a780a187c1da102f5361746f7368693a302e31362e302f8d24080001',
'61ea00000d0400000000000033c2585b000000000f040000000000000000000000000000000000000000000000000d040000000000000000000000000000000000000000000000007bc5a780a187c1da102f5361746f7368693a302e31362e302f8d24080001',
'6a0000000d0400000000000033c2585b000000000f040000000000000000000000000000000000000000000000000d040000000000000000000000000000000000000000000000007bc5a780a187c1da102f5361746f7368693a302e31362e302f8d24080001'
]



function make_version_bufs () {
        

        return version_byte_strings.map(x=> {
        readable = new Readable()
        readable.push(Buffer.from(x,'hex'))
        readable.push(null)
        return Buffer.from(x,'hex')

            
        })    
}

function make_stream(b) {
    readable = new Readable()
    readable.push(b)
    readable.push(null)
    return readable

}

true_bytes = Buffer.from([true])
false_bytes = Buffer.from([false])

eight_byte_int = 2n ** (8n * 8n) - 1n
four_byte_int = 2 ** (8 * 4) - 1
two_byte_int = 2 ** (8 * 2) - 1
one_byte_int = 7
eight_byte_int_bytes = Buffer.from(eight_byte_int.toString())
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

module.exports.make_version_bufs = make_version_bufs
module.exports.make_stream = make_stream
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
