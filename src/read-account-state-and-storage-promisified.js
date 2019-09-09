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

start()

async function start () {
  try {
    const block = await getBlock(blockNumber)
    const trie = new Trie(db, block.header.stateRoot)
    const state = await getState(trie, address)

    if (state != null) {
      const acc = new Account(state)
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
  } catch (err) {
    console.log(err)
  }
}

// getBlock as Promise
function getBlock (blocknr) {
  return new Promise((resolve, reject) => {
    bc.getBlock(
      blocknr, (err, block) => {
        if (err) {
          reject(err)
        } else {
          resolve(block)
        }
      })
  })
}

// trie.get as Promise
function getState (trie, address) {
  return new Promise((resolve, reject) => {
    trie.get(address, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
