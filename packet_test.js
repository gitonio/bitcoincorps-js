var three = require('./ibd/three/complete')
var Readable = require('stream').Readable

msg = Buffer.from('f9beb4d976657273696f6e00000000006a0000009b228b9e7f1101000f040000000000009341555b000000000f040000000000000000000000000000000000000000000000000f040000000000000000000000000000000000000000000000007256c5439b3aea89142f736f6d652d636f6f6c2d736f6674776172652f0100000001', 'hex')
var readable = new Readable()
readable.push(msg)
readable.push(null)

x = three.Packet.read_from_socket(readable)
version_message = three.VersionMessage.from_bytes(x.payload)

console.log(version_message)
