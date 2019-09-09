const level = require('level')
const rlp = require('rlp')
const ethUtils = require('ethereumjs-util')

const db = level('/Volumes/2nd/geth/ethereum/geth/chaindata') // path to geth database

const txLookupPrefix = Buffer.from('l') // txLookupPrefix + hash -> transaction/receipt lookup metadata
const txKey = (hash) => Buffer.concat([txLookupPrefix, hash])

// ropsten transaction
const txHash = ethUtils.toBuffer('0x0166dacd5aae393474e46d6e25804c21c7525542d9646dc8b222e40851d4c250')
getTransaction(txHash)

async function getTransaction (number, hash) {
  console.log('Transaction:')
  const key = txKey(txHash)
  const tx = await getDecodedValueFromDb(key)
  console.log(tx)
}

async function getDecodedValueFromDb (key) {
  const dbOpts = {
    keyEncoding: 'binary',
    valueEncoding: 'binary'
  }

  const encoded = await db.get(key, dbOpts)
  return rlp.decode(encoded)
}
