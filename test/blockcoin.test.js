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

describe('blockcoin', function () {
    var ec = new EC('secp256k1');

    //key = ec.genKeyPair()
    bob_private_key = ec.genKeyPair();
    bob_public_key = ec.keyFromPublic(bob_private_key.getPublic())

    //key = ec.genKeyPair()
    alice_private_key = ec.genKeyPair();
    alice_public_key = ec.keyFromPublic(alice_private_key.getPublic())


    it('test_blocks', function () {

        bank = new Bank(0, identities.bank_private_key(0))

        block = new Block([])
        block.sign(bank.private_key)
        bank.handle_block(block)

        block = new Block([])
        wrong_private_key = identities.alice_private_key
        block.sign(wrong_private_key)
        bank.handle_block(block)
//        assert.throws(() => bank.handle_block(block), Error, 'Error thrown')



    })

    it('test_bad_tx', function () {

        bank = new Bank(0, identities.bank_private_key(0))
        tx = identities.airdrop_tx()
        bank.airdrop(tx)

        tx = prepare_simple_tx(
            bank.fetch_utxos(identities.alice_public_key), 
            identities.alice_private_key, 
            identities.bob_public_key, 10
        )

        tx.tx_ins[0].signature = identities.alice_private_key.sign(0x01)

        bank.handle_tx(tx)
        assert.throws(() => bank.handle_tx(tx), Error, 'tx.map is not a function')
    })

    it('test_airdrop', function () {
        bank = new Bank(0, identities.bank_private_key(0))
        tx = identities.airdrop_tx()
        bank.airdrop(tx)

        assert.equal(bank.fetch_balance(identities.alice_public_key),500000)
        assert.equal(bank.fetch_balance(identities.bob_public_key), 500000)
    

    })

    it('test_utxo', function () {

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
        block.sign(identities.bank_private_key(0))
        bank.handle_block(block)
 

        assert.equal(bank.fetch_balance(identities.alice_public_key), 500000 - 10)
        assert.equal(bank.fetch_balance(identities.bob_public_key)  , 500000 + 10)
    

    })


})
