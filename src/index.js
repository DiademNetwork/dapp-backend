import dotenv from 'dotenv'

import { Facebook } from 'fb'
import stream from 'getstream'

import app from './app'
dotenv.config()

const achievements = null
const users = {
  send: () => Promise.resolve('0x123'),
  call: () => Promise.resolve({ outputs: [''] })
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
