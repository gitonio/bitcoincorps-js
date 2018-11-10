var Readable = require('stream').Readable
var three = require('./ibd/three/complete')

class Pet {

    constructor(kind,name) {
        this.kind = kind
        this.name = name
    }

    static from_bytes(b) {
        let valid_kinds =  [Buffer.from('cat','ascii'),Buffer.from('dog','ascii'),Buffer.from('pig','ascii'),Buffer.from('cow','ascii'),]
        let readable = new Readable()
        readable.push(b)
        readable.push(null)
        let kind = readable.read(3)
        if (!valid_kinds.findIndex(valid_kind=>valid_kind===kind)) {
            throw 'Error'
        }
        let name = readable.read(10)
        return new Pet(kind, name)

    }

    to_bytes() {
        return this.kind + this.name
    }
}

function test_pet_to_bytes() {
    pet_bytes = Buffer.from('pigbuddy','ascii')
    pet = Pet.from_bytes(pet_bytes)
    console.log(pet_bytes == pet.to_bytes())
}

test_pet_to_bytes()