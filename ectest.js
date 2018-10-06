var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
const BN = require('bn.js');


ec = new EC('secp256k1')
public_key = ec.genKeyPair(); 
message = Buffer.from("Don't touch that XRP", 'ascii')
signature = public_key.sign(message)
console.log(public_key.verify(message, signature))
console.log(public_key.verify(Buffer.from("Nice XRP",'ascii'), signature ))



class Transfer {
    constructor (signature, public_key) {
        this.signature = signature
        this.public_key = public_key
    }
}

class ECDSACoin {
    constructor (transfers) {
        this.transfers = transfers
    }
}

//key = ec.genKeyPair();
bank_private_key = ec.genKeyPair();
bank_public_key = ec.keyFromPublic(bank_private_key.getPublic())

//key = ec.genKeyPair()
bob_private_key = ec.genKeyPair();
bob_public_key = ec.keyFromPublic(bob_private_key.getPublic())

//key = ec.genKeyPair()
alice_private_key = ec.genKeyPair();
alice_public_key = ec.keyFromPublic(alice_private_key.getPublic())

function issue(public_key) {
    message = public_key.getPublic().encode('hex')
    signature = bank_private_key.sign(message)
    transfer = new Transfer(
        signature, public_key
    )

    coin = new ECDSACoin([transfer])
    return coin
} 


function validate(coin) {
    transfer = coin.transfers[0]
    message = transfer.public_key.getPublic().encode('hex')
    return bank_public_key.verify(message, transfer.signature)
}

alice_coin = issue(alice_public_key)
console.log(alice_coin)

console.log(validate(alice_coin))

bad_message = alice_public_key.getPublic().encode('hex')
bad_transfer = new Transfer(
    bob_private_key.sign(bad_message),
    alice_public_key
)
bad_coin = new ECDSACoin([bad_transfer])

//console.log(validate(bad_coin))

function transfer_message(previous_signature, public_key) {
    return JSON.stringify({
        "previous_signature": previous_signature, 
        "next_owner_public_key": public_key
    })
}

function validate(coin) {
    coin.transfers.map((transfer,i)=>{
        if(i==0){
            message = transfer.public_key.getPublic().encode('hex')
            console.log('Intial:',i ,bank_public_key.verify(message, transfer.signature))

        } else {
            console.log('Next:',i, previous_transfer.public_key.verify(
                Buffer.from(transfer_message(previous_transfer.signature, transfer.public_key ),'ascii'),
                transfer.signature
            ))
                
        }
 
         previous_transfer = transfer
    })
}

function get_owner(coin) {
    database = new Map()
    
    database.set(bob_public_key, "Bob")
    database.set(alice_public_key, "Alice")
    database.set(bank_public_key, "Bank")
    
    public_key = coin.transfers[coin.transfers.length-1].public_key
    return database.get(public_key)
}


alice_coin = issue(alice_public_key)
console.log("This coin is owned by", get_owner(alice_coin))
m1 = transfer_message(alice_coin.transfers[0].signature, bob_public_key)

alice_to_bob = new Transfer(
    alice_private_key.sign(Buffer.from(m1,'ascii')),
    bob_public_key
)
alice_coin.transfers.push(alice_to_bob)
console.log("This coin is owned by", get_owner(alice_coin))
validate(alice_coin)

m2 = transfer_message(alice_coin.transfers[1].signature, bank_public_key)
bob_to_bank = new Transfer(
    bob_private_key.sign(Buffer.from(m2, 'ascii')),
    bank_public_key
)

alice_coin.transfers.push(bob_to_bank)
console.log("This coin is owned by", get_owner(alice_coin))
validate(alice_coin)

/*
bank_secret_exponent = new BN('82131106019680303505331557872062346035977047103534656354347208601839669582133', 10);
bank_sk = ec.keyFromPrivate(bank_secret_exponent);
bank_vk = bank_sk.getPublic()
console.log("Bank's Private Number")
console.log(bank_sk.priv.toString(10))
console.log("Bank's Public Point")
bank_public_pair = `${bank_sk.getPublic().getX().toString(10)},${bank_sk.getPublic().getY().toString(10)}`
console.log(bank_public_pair)

john_secret_multiplier = new BN('55717470057311173409666612548673609704723143884008771644960450831012091928340', 10);
john_sk = ec.keyFromPrivate(john_secret_multiplier);
john_vk = john_sk.getPublic()
console.log("John's Private Number")
console.log(john_sk.priv.toString(10))
console.log("John's Public Point")
john_public_pair = `${john_sk.getPublic().getX().toString(10)},${john_sk.getPublic().getY().toString(10)}`
console.log(john_public_pair)

minting_message = bank_public_pair + ' issues 10 units to ' + john_public_pair

minting_signature = bank_sk.sign(Buffer.from(minting_message,'ascii'))

console.log(minting_message)
console.log( (new BN(minting_signature.toDER())).toString('hex')  )

note = [{
    "message": minting_message,
    "signature": (new BN(minting_signature.toDER())).toString('hex') 
}]

//console.log(note[0].signature.toDER().toString('hex'))

jane_secret_multiplier = new BN('10565481194119334483875173041211335223782298787713172586376122207587136082178', 10);
jane_sk = ec.keyFromPrivate(jane_secret_multiplier);
jane_vk = john_sk.getPublic()
console.log("Jane's Private Number")
console.log(jane_sk.priv.toString(10))
console.log("Jane's Public Point")
jane_public_pair = `${jane_sk.getPublic().getX().toString(10)},${jane_sk.getPublic().getY().toString(10)}`
console.log(jane_public_pair)

john_to_jane_message = john_public_pair + " transfers to " + jane_public_pair
john_to_jane_signature = john_sk.sign(Buffer.from(john_to_jane_message,'ascii'))


transfer = {
    "message": john_to_jane_message,
    "signature": (new BN(john_to_jane_signature.toDER())).toString('hex') 
}

//new_note = note.copy()
note.push(transfer)

console.log(note)

function validate_note(note) {
    
}

*/