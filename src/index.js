import dotenv from 'dotenv'
dotenv.config()

import { Facebook } from 'fb'
import { Qtum } from 'qtumjs'
import stream from 'getstream'

import app from './app'

const fb = new Facebook({ accessToken: process.env.ACCESS_TOKEN })

const repoData = require('../solar.json')
const qtum = new Qtum(process.env.RPC_URL, repoData)
const users = qtum.contract('Users.sol')
const achievements = qtum.contract('Achievements.sol')

const client = stream.connect(process.env.STREAM_KEY, process.env.STREAM_SECRET)
const feed = client.feed(process.env.STREAM_FEED, 'common')

const port = process.env.PORT || 3000
app({
  fb, users, achievements, feed
}).listen(port, () => {
  console.log('Running on :${port}\n')
})

if (module.hot) {
  module.hot.accept('./app')
}