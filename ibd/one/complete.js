function bytes_to_int(b,n,endian){
    return b.readUIntLE(0,4)    
}

module.exports.bytes_to_int = bytes_to_int