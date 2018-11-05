var toBigIntBE = require('bigint-buffer').toBigIntBE



function read_version(buf) {
    return buf.readInt32LE(0)
}

function read_timestamp(buf) {
    timestamp = read_int(buf, 8)
    return new Date(timestamp)
}

function read_var_int(buf) {
	//TODO add logic
	const i = buf.readUInt8(0)

	if (i == 0xff) {
		b = buf.slice(1,buf.length)
		return toBigIntBE(buf.slice(1,buf.length))
	} else if (i == 0xfe){
		return buf.readUInt32LE(1)
	} else if (i == 0xfd) {
		return buf.readUInt16BE(1)
	} else {
		return i
	}
}

module.exports.read_version = read_version
module.exports.read_var_int = read_var_int