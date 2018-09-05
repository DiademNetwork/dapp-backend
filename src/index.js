import dotenv from 'dotenv'

import { Facebook } from 'fb'
import stream from 'getstream'

import app from './app'
dotenv.config()

// mock smart contracts
const txid = '0xd6ed9643ffe97dd5b43613f0b5602db5c10ebc819ccad795c4fd188e9239290f'
let addr2acc = {}
let acc2addr = {}
const users = {
  send: (command, [address, user]) => {
    if (command === 'register') {
      addr2acc[address] = user
      acc2addr[user] = address
    }
    return Promise.resolve(txid)
  },
  call: (command, [user]) => {
    let response = null
    if (command === 'exists') {
      response = addr2acc[user]
    } else {
      response = acc2addr[user]
    }
    return Promise.resolve(response)
  }
}
const achievements = {
  send: () => Promise.resolve(txid)
}

const fb = new Facebook({ accessToken: process.env.ACCESS_TOKEN })

const client = stream.connect(process.env.STREAM_KEY, process.env.STREAM_SECRET)
const feed = client.feed(process.env.STREAM_FEED, 'common')

const port = process.env.PORT || 3000
app({
  fb, users, achievements, feed
}).listen(port, () => {
  console.log(`Running on :${port}\n`)
})

if (module.hot) {
  module.hot.accept('./app')
}
