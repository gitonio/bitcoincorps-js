var { assert, expect } = require('chai');
var Bank = require('../blockcoin').Bank
var Block = require('../blockcoin').Block
var BN = require('bn.js')
var Readable = require('stream').Readable
EC = require('elliptic').ec;
var _ = require('lodash');
var bdc = require('../blockcoin')
const uuidv1 = require('uuid/v1')
var identities = require('../identities')
var prepare_simple_tx = require('../utils').prepare_simple_tx

var three = require('../ibd/three/complete')

var ec = new EC('secp256k1');

//bank_private_key = ec.genKeyPair();
//bank_public_key = ec.keyFromPublic(bank_private_key.getPublic())
//console.log('bank:', bank_private_key.getPrivate('hex'))
//sconsole.log('bank:', bank_private_key.getPublic().encode('hex'))

describe('three', function () {

    services = 1
    my_ip = "7.7.7.7"
    peer_ip = "6.6.6.6"
    port = 8333
    now = Date.now()

    my_address = new three.Address(services, my_ip, port)
    peer_address = new three.Address(services, peer_ip, port)

    version_message = new three.VersionMessage(
        70015,
        services,
        now,
        my_address,
        peer_address,
        73948692739875,
        Buffer.from('bitcoin-corps','ascii'),
        0,
        1
    )

    console.log(version_message)
    it('test_version_message_round_trip', function () {

        version_message_bytes = version_message.to_bytes()
        console.log(version_message_bytes)
        packet = new three.Packet(Buffer.from('version','ascii'), version_message_bytes)
        packet_bytes = packet.to_bytes()
        //assert.throws(()=>bank.handle_block(block),  "Block validation error")



    })

    it('test_services', function () {

        bank = new Bank(0, identities.bank_private_key(0))
        tx = identities.airdrop_tx()
        bank.airdrop(tx)

        tx = prepare_simple_tx(
            bank.fetch_utxos(identities.alice_public_key), 
            identities.alice_private_key, 
            identities.bob_public_key, 10
        )

        tx.tx_ins[0].signature = identities.alice_private_key.sign([0x01])

        assert.throws(() => bank.handle_tx(tx), "Tx validation errors")
    })

    it('test_ip_addresses', function () {
        bank = new Bank(0, identities.bank_private_key(0))
        tx = identities.airdrop_tx()
        bank.airdrop(tx)

        assert.equal(bank.fetch_balance(identities.alice_public_key),500000)
        assert.equal(bank.fetch_balance(identities.bob_public_key), 500000)
    

    })

    it('test_parse_addrs', function () {

        bank = new Bank(0, identities.bank_private_key(0))
        tx = identities.airdrop_tx()
        bank.airdrop(tx)
        assert.equal(bank.blocks.length, 1)
        tx = prepare_simple_tx(
            bank.fetch_utxos(identities.alice_public_key), 
            identities.alice_private_key, 
            identities.bob_public_key, 10
        )

        block = new Block([tx])
        block.sign(identities.bank_private_key(1))
        bank.handle_block(block)
 

        assert.equal(bank.fetch_balance(identities.alice_public_key), 500000 - 10)
        assert.equal(bank.fetch_balance(identities.bob_public_key)  , 500000 + 10)
    

    })


})
