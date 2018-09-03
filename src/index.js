import dotenv from 'dotenv'

import { Facebook } from 'fb'
import stream from 'getstream'

import app from './app'
dotenv.config()

let usersRegistered = {}

const achievements = null
const users = {
  send: (command, [address, user]) => {
    usersRegistered[user] = address
    return Promise.resolve()
  },
  call: (command, user) => {
    if (usersRegistered[user]) {
      return Promise.resolve({
        exists: true,
        address: usersRegistered[user],
        user
      })
    } else {
      return Promise.resolve([''])
    }
  }
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
