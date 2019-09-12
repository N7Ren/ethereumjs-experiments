const level = require('level')
const ethUtils = require('ethereumjs-util')

const Blockchain = require('ethereumjs-blockchain').default
const Trie = require('merkle-patricia-tree/secure')
const VM = require('ethereumjs-vm').default

const db = level('/Volumes/2nd/geth/ethereum/geth/chaindata') // path to geth database
const chain = 'ropsten'
const blockNumber = 19460

console.log(`Getting information at block number: ${blockNumber}`)
console.log()

const bc = new Blockchain({ db: db })

start()

async function start () {
  try {
    const block = await getBlock(blockNumber)
    const tx = block.transactions[0]

    // get the parent state to start the replay before the current block was formed
    const parentBlock = await getBlock(blockNumber - 1)
    const parentTrie = new Trie(db, parentBlock.header.stateRoot)

    const vm = new VM({
      state: parentTrie,
      blockchain: bc,
      chain: chain
    })

    // listen to newContract event
    vm.on('newContract', (contract) => {
      console.log(`${ethUtils.bufferToHex(contract.address)} was created`)
      console.log()
    })

    const txResult = await vm.runTx({ block: block, tx: tx, skipNonce: true, skipBalance: true })
    console.log(txResult)
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
