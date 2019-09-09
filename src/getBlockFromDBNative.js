const level = require('level')
const rlp = require('rlp')
const ethUtils = require('ethereumjs-util')

const BN = ethUtils.BN

const db = level('/Volumes/2nd/geth/ethereum/geth/chaindata') // path to geth database

// geth compatible db keys extracted from go-ethereum source code (schema.go)
const headerPrefix = Buffer.from('h') // headerPrefix + number + hash -> header
const bodyPrefix = Buffer.from('b') // bodyPrefix + number + hash -> block body

// utility functions extracted from ethereumjs-blockchain
const bufBE8 = n => n.toArrayLike(Buffer, 'be', 8) // convert BN to big endian Buffer
const headerKey = (n, hash) => Buffer.concat([headerPrefix, bufBE8(n), hash])
const bodyKey = (n, hash) => Buffer.concat([bodyPrefix, bufBE8(n), hash])

const receiptsPrefix = Buffer.from('r') // blockReceiptsPrefix + num (uint64 big endian) + hash -> block receipts
const receiptsKey = (n, hash) => Buffer.concat([receiptsPrefix, bufBE8(n), hash])

// ropsten block
const blockNumber = new BN(38517)
const blockHash = '0xc8458a27426cf34a3e562e44fc3ccc5f849da246c017334134e73a7cae9bdc99'

getBlock(blockNumber, ethUtils.toBuffer(blockHash))

async function getBlock (number, hash) {
  console.log('Block-Header:')
  let key = headerKey(number, hash)
  const header = await getDecodedValueFromDb(key)
  console.log(header)
  console.log()

  console.log('Block-Body:')
  key = bodyKey(number, hash)
  const body = await getDecodedValueFromDb(key)
  console.log(body)
  console.log()

  console.log('Block-Receipt:')
  key = receiptsKey(number, hash)
  const receipt = await getDecodedValueFromDb(key)
  console.log(receipt)
  console.log()
}

async function getDecodedValueFromDb (key) {
  const dbOpts = {
    keyEncoding: 'binary',
    valueEncoding: 'binary'
  }

  const encoded = await db.get(key, dbOpts)
  return rlp.decode(encoded)
}
