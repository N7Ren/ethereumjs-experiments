const level = require('level')
const rlp = require('rlp')
const ethUtils = require('ethereumjs-util')

const Blockchain = require('ethereumjs-blockchain').default
const BN = ethUtils.BN

const db = level('/Volumes/2nd/geth/ethereum/geth/chaindata') // path to geth database
const blockNumber = 38517 // ropsten block with logs

// geth compatible db keys extracted from go-ethereum source code (schema.go)
const receiptsPrefix = Buffer.from('r') // blockReceiptsPrefix + num (uint64 big endian) + hash -> block receipts

// utility functions extracted from ethereumjs-blockchain
const bufBE8 = n => n.toArrayLike(Buffer, 'be', 8) // convert BN to big endian Buffer
const receiptsKey = (n, hash) => Buffer.concat([receiptsPrefix, bufBE8(n), hash])

console.log(`Getting receipts for block number: ${blockNumber}`)
console.log()

const bc = new Blockchain({ db: db })
bc.getBlock(
  blockNumber, (err, block) => {
    if (err) {
      console.log(err)
    } else {
      // get block receipts
      const key = receiptsKey(new BN(block.header.number), block.hash())
      db.get(key, { keyEncoding: 'binary', valueEncoding: 'binary' }, (err, receipts) => {
        if (err) {
          console.log(err)
        } else {
          const decodedReceipts = rlp.decode(receipts)
          console.log(decodedReceipts)
          console.log()

          decodedReceipts.forEach((item) => {
            console.log(item[0]) // receipts root
            console.log(item[1]) // cumulative gas used
            console.log(item[2]) // logs bloom
            console.log(item[3]) // transaction hash
            console.log(item[4]) // created address
            console.log(item[5]) // logs
            console.log(item[6]) // gas used
          })
        }
      })
    }
  }
)
