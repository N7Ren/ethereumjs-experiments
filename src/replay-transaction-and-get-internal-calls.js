const level = require('level')
const ethUtils = require('ethereumjs-util')
const ethUnits = require('ethereumjs-units')

const Blockchain = require('ethereumjs-blockchain').default
const Trie = require('merkle-patricia-tree/secure')
const VM = require('ethereumjs-vm').default
const PStateManager = require('ethereumjs-vm/dist/state/promisified').default
const BN = ethUtils.BN

const db = level('/Volumes/2nd/geth/ethereum/geth/chaindata') // path to geth database
const chain = 'ropsten'
const blockNumber = 38517

const WORD_SIZE = 32 // 1 storage/memory slot has 32 bytes

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

    const pStateManager = new PStateManager(vm.stateManager)

    // listen to vm step event - runs through opcodes while contract execution
    vm.on('step', (data) => {
      processEVMOpcodes(data, pStateManager)
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

function processEVMOpcodes (data, pStateManager) {
  switch (data.opcode.name) {
    case 'CALL':
    case 'CALLCODE':
      processCallCallCode(data, pStateManager)
      break
    case 'DELEGATECALL':
    case 'STATICCALL':
      processDelegateStaticCall(data, pStateManager)
  }
}

async function processCallCallCode (data, pStateManager) {
  console.log('opcode name: ' + data.opcode.name)

  const stackCopy = data.stack.slice()
  const [gasLimit, toAddress, value] = popN(stackCopy, 3)

  const receiverAccount = await pStateManager.getAccount(toAddress)

  const call = {
    type: data.opcode.name,
    from: ethUtils.bufferToHex(data.address),
    to: ethUtils.bufferToHex(toAddress),
    value: convertWeiToEth(value),
    call_depth: data.depth,
    gas_limit: ethUtils.bufferToInt(gasLimit),
    gas_left: ethUtils.bufferToInt(data.gasLeft),
    stack_size: data.stack.length * WORD_SIZE,
    mem_size: data.memoryWordCount.toNumber() * WORD_SIZE,
    is_contract: receiverAccount.isContract()
  }

  console.log(call)
  console.log()
}

async function processDelegateStaticCall (data, pStateManager) {
  console.log('opcode name: ' + data.opcode.name)

  const stackCopy = data.stack.slice()
  const [gasLimit, toAddress] = popN(stackCopy, 2) // delegetacall has no value

  const receiverAccount = await pStateManager.getAccount(toAddress)

  const call = {
    type: data.opcode.name,
    to: ethUtils.bufferToHex(toAddress),
    call_depth: data.depth,
    gas_limit: ethUtils.bufferToInt(gasLimit),
    gas_left: ethUtils.bufferToInt(data.gasLeft),
    stack_size: data.stack.length * WORD_SIZE,
    mem_size: data.memoryWordCount.toNumber() * WORD_SIZE,
    is_contract: receiverAccount.isContract()
  }

  console.log(call)
  console.log()
}

function popN (array, num) {
  return array.splice(-1 * num).reverse()
}

function convertWeiToEth (value) {
  return Number(ethUnits.convert(new BN(value), 'wei', 'eth'))
}
