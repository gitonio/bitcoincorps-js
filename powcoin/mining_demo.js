var hash = require('hash.js')

function get_proof(header, nonce){
    preimage = Buffer.from(`${header}:${nonce}`,'ascii')
    proof_hex = hash.sha256().update(preimage).digest('hex')
    return parseInt(proof_hex,16)
}

function mine(header, target, nonce) {
    while (get_proof(header, nonce) >= target) {
        nonce++
    }
    return nonce
}

function mining_demo(header) {
    previous_nonce = -1
    for (let difficulty_bits = 1; difficulty_bits < [...Array(5).keys()].length; difficulty_bits++) {
        target = 2 ** (256 - difficulty_bits)
        start_time = Date.now()
        nonce = mine(header, target, previous_nonce)
        proof = get_proof(header, nonce)
        elapsed_time = Date.now()  - start_time

        target_str = `${target}`
        elapsed_time_str = ''
        bin_proof_str = ''

        console.log(`db: ${difficulty_bits}`,target_str)
        previous_none = nonce
        
    }
}

mining_demo('hello')