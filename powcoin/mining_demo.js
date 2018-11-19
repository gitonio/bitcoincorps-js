var hash = require('hash.js')

function get_proof(header, nonce) {
    preimage = Buffer.from(`${header}:${nonce}`, 'ascii')
    proof_hex = hash.sha256().update(preimage).digest('hex')
    //console.log(proof_hex)
    return BigInt('0x' + proof_hex)
}

function mine(header, target, nonce) {
    while (get_proof(header, nonce) >= target) {
        nonce++
    }
    return nonce
}
function parseHrtimeToSeconds(hrtime) {
    var seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    return seconds;
}
function decbin(dec, length) {
    var out = "";
    while (length--)
        out += (dec >> length) & 1n;
    return out;
}
function mining_demo(header) {
    previous_nonce = -1
    for (let difficulty_bits = 1; difficulty_bits < [...Array(20).keys()].length; difficulty_bits++) {
        target = 2 ** (256 - difficulty_bits)
        start_time = process.hrtime();
        nonce = mine(header, target, previous_nonce)
        proof = get_proof(header, nonce)
        //console.log(proof > Number.MAX_SAFE_INTEGER)
        elapsed_time = parseHrtimeToSeconds(process.hrtime(start_time));

        target_str = `${target.toExponential(2)}`
        difficulty_bits_str = difficulty_bits.toString().padStart(2)
        elapsed_time_str = ''
        bin_proof_str = ''

        console.log(`${difficulty_bits_str}`, `${target_str}`, `${elapsed_time}`, nonce.toString().padStart(10), decbin(proof, 256n).substr(0, 30))
        previous_none = nonce

    }
}

console.log(`bits`, `target`, `elapsed`, 'nonce: ', 'proof')
mining_demo('hello')