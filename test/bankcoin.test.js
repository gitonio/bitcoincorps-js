var { assert, expect} = require('chai');
var Bank = require('../bankcoin').Bank
var BN = require('bn.js')
var Readable = require('stream').Readable
EC = require('elliptic').ec;
var _ = require('lodash');

 describe('bankcoin', function() {
    var ec = new EC('secp256k1');

//key = ec.genKeyPair()
bob_private_key = ec.genKeyPair();
bob_public_key = ec.keyFromPublic(bob_private_key.getPublic())

//key = ec.genKeyPair()
alice_private_key = ec.genKeyPair();
alice_public_key = ec.keyFromPublic(alice_private_key.getPublic())
    

function copyInstance (original) {
    var copied = Object.assign(
      Object.create(
        Object.getPrototypeOf(original)
      ),
      original
    );
    return copied;
  }

	it('test_valid_transfers', function() {
        
        bank = new Bank()
        coin = bank.issue(alice_public_key)
        //console.log(coin)
        //initial_coin_copy = Object.assign({}, coin)
        //initial_coin_copy = copyInstance(coin)
        initial_coin_copy  = _.cloneDeep(coin);
        //console.log(coin)
        //console.log('ic1',initial_coin_copy)
        //console.log('fc',bank.fetch_coins(alice_public_key))
        //$.extend(true, initial_coin_copy, coin)
        //bank.validate_transfers(coin)
        //console.log('fetch:',bank.fetch_coins(bob_public_key))

		assert.deepEqual(bank.fetch_coins(alice_public_key), [initial_coin_copy]);		
		//assert.deepEqual(bank.fetch_coins(bob_public_key), [])  
        
        
		//assert.deepEqual(bank.fetch_coins(alice_public_key), [initial_coin_copy]);		
		//assert.deepEqual(bank.fetch_coins(bob_public_key), [])  
        //console.log(bank.fetch_coins(alice_public_key))
        
        coin.transfer(
            alice_private_key,
            bob_public_key
        )
        //console.log('ic1',coin)

        //console.log('fc',bank.fetch_coins(alice_public_key))
		assert.deepEqual(bank.fetch_coins(alice_public_key), [initial_coin_copy]);		
		//assert.deepEqual(bank.fetch_coins(bob_public_key), [])  

        
        //bank.observe_coin(coin)
        
        //assert.deepEqual(bank.fetch_coins(alice_public_key) == [coin]);		
		//assert.deepEqual(bank.fetch_coins(bob_public_key) == []) 
            
        /*
        coin.transfer(
            bob_private_key,
            bank.public_key
        )

        bank.validate_transfers(coin)

        bank.observe_coin(coin)
        assert.deepEqual(bank.fetch_coins(alice_public_key) == []);		
		assert.deepEqual(bank.fetch_coins(bob_public_key) == []) 
        */

	})
	
	 
 })
