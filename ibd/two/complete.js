function bytes_to_int(b, n, byte_order='little') {
	if (n == 20) {
		console.log('b', b.toString())
		return BigInt(b.toString())
	} else if (n == 10){
		return parseInt(b.toString())
	} else if (n == 5) {
		return parseInt(b.toString())
	} else {
		return parseInt(b.toString())
	}
}

function read_int(stream, n, byte_order='little') {

	b = stream.read(n*2)
	console.log('read_int')
	console.log( n,b.toString())
	
    return bytes_to_int(b, n*2, byte_order)
}

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
	console.log('i',i)
	if (i == 0xff) {
		return read_int(buf,10)
	} else if (i == 0xfe){
		return buf.readUInt32LE(1)
	} else if (i == 0xfd) {
		return buf.readUInt16BE(1)
	} else {
		return i
	}
}

module.exports.bytes_to_int = bytes_to_int
module.exports.read_int = read_int
module.exports.read_version = read_version
module.exports.read_var_int = read_var_int