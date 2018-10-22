var { assert, expect } = require('chai');
var Bank = require('../bankutxocoin').Bank
var BN = require('bn.js')
var Readable = require('stream').Readable
EC = require('elliptic').ec;
var _ = require('lodash');
var bdc = require('../bankutxocoin')
const uuidv1 = require('uuid/v1')

describe('bankutxocoin', function () {
    var ec = new EC('secp256k1');

    //key = ec.genKeyPair()
    bob_private_key = ec.genKeyPair();
    bob_public_key = ec.keyFromPublic(bob_private_key.getPublic())

    //key = ec.genKeyPair()
    alice_private_key = ec.genKeyPair();
    alice_public_key = ec.keyFromPublic(alice_private_key.getPublic())


    it('test_bank_balances_utxocoin', function () {

        bank = new Bank()
        coinbase = bank.issue(1000, alice_public_key)



        tx_ins = [
            new bdc.TxIn(tx_id = coinbase.id, index = 0, signature = null)
        ]

        tx_id = uuidv1()

        tx_outs = [
            new bdc.TxOut(tx_id = tx_id, 0, 10, bob_public_key),
            new bdc.TxOut(tx_id, 1, 990, alice_public_key)
        ]

        alice_to_bob = new bdc.Tx(tx_id, tx_ins, tx_outs)
        alice_to_bob.sign_input(0, alice_private_key)

        bank.handle_tx(alice_to_bob)

        assert.equal(bank.fetch_balance(alice_public_key), 990)
        assert.equal(bank.fetch_balance(bob_public_key), 10)

    })

})
