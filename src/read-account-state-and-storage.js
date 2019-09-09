const level = require('level')
const rlp = require('rlp')
const ethUtils = require('ethereumjs-util')

const Blockchain = require('ethereumjs-blockchain').default
const Trie = require('merkle-patricia-tree/secure')
const Account = require('ethereumjs-account').default
const BN = ethUtils.BN

const db = level('/Volumes/2nd/geth/ethereum/geth/chaindata') // path to geth database
const address = '0x7ac337474ca82e0f324fbbe8493f175e0f681188' // random ropsten contract
const blockNumber = 19693

console.log(`Getting information for Account ${address} at block number: ${blockNumber}`)
console.log()

const bc = new Blockchain({ db: db })
bc.getBlock(
  blockNumber, (err, block) => {
    if (err) {
      console.log(err)
    } else {
      const trie = new Trie(db, block.header.stateRoot)
      trie.get(address, function (err, data) {
        if (err) {
          console.log(err)
        } else {
          if (data != null) {
            const acc = new Account(data)
            const storageRoot = acc.stateRoot

            console.log('Account fields: ')
            console.log('nonce: ' + ethUtils.bufferToInt(acc.nonce))
            console.log('balance: ' + new BN(acc.balance))
            console.log('storageRoot: ' + ethUtils.bufferToHex(storageRoot))
            console.log('codeHash: ' + ethUtils.bufferToHex(acc.codeHash))
            console.log()

            console.log('Storage trie contents for account: ')
            const storageTrie = trie.copy()
            storageTrie.root = storageRoot

            storageTrie.createReadStream()
              .on('data', function (data) {
                console.log('key: ' + ethUtils.bufferToHex(data.key))
                console.log('value: ' + ethUtils.bufferToHex(rlp.decode(data.value)))
              })
              .on('end', function () {
                console.log('Done reading storage trie.')
              })
          }
        }
      })
    }
  }
)
