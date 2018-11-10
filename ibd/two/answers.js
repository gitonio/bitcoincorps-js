var two = require('./complete')

function can_send_pong(buf) {
    return two.read_version(buf) >= 60001
}

function read_bool(stream) {
    buf = stream.read(1)
    return buf.readInt8(0) == 1 ? true : false
}


module.exports.can_send_pong = can_send_pong
module.exports.read_bool = read_bool