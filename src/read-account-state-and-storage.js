const level = require('level')
const rlp = require('rlp')
const utils = require('ethereumjs-util')

const Blockchain = require('ethereumjs-blockchain').default
const Trie = require('merkle-patricia-tree/secure')
const Account = require('ethereumjs-account').default
const BN = utils.BN

const db = level('/Volumes/2nd/geth/ethereum/geth/chaindata') //path to (ropsten) geth db
const address = '0x7ac337474ca82e0f324fbbe8493f175e0f681188' //random ropsten contract
const blockNumber = 19693

console.log(`Getting information for Account ${address} at block number: ${blockNumber}`)
console.log()

const bc = new Blockchain({ db: db })
bc.getBlock(
  blockNumber, (err, block) => {
    if (err) {
      console.log(err)
    } else {
      let trie = new Trie(db, block.header.stateRoot)
      trie.get(address, function (err, data) {
        if (err) {
          console.log(err)
        } else {
          const acc = new Account(data)
          const storageRoot = acc.stateRoot

          console.log('Account fields: ')
          console.log('nonce: ' + utils.bufferToInt(acc.nonce))
          console.log('balance: ' + new BN(acc.balance))
          console.log('storageRoot: ' + utils.bufferToHex(storageRoot))
          console.log('codeHash: ' + utils.bufferToHex(acc.codeHash))
          console.log()

          console.log('Storage trie contents for account: ')
          let storageTrie = trie.copy()
          storageTrie.root = storageRoot

          storageTrie.createReadStream()
            .on('data', function (data) {
              console.log('key: ' + utils.bufferToHex(data.key))
              console.log('value: ' + utils.bufferToHex(rlp.decode(data.value)))
            })
            .on('end', function () {
              console.log('Done reading storage trie.')
            })
        }
      })
    }
  }
)
