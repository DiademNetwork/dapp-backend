import dotenv from 'dotenv'

import { Qtum } from 'qtumjs'
import { Facebook } from 'fb'
import stream from 'getstream'

import app from './app'
dotenv.config()

const fb = new Facebook({ accessToken: process.env.FACEBOOK_ACCESS_TOKEN })

const qtumRepository = require('../solar.development.json')
const qtum = new Qtum(process.env.QTUM_RPC_URL, qtumRepository)
const users = qtum.contract('contracts/Users.sol')
const achievements = qtum.contract('contracts/Achievements.sol')
const rewards = qtum.contract('contracts/Rewards.sol')

const client = stream.connect(process.env.STREAM_KEY, process.env.STREAM_SECRET)
const feed = client.feed(process.env.STREAM_FEED, stream.STREAM_TRANSACTIONS_FEED)

const port = process.env.APP_PORT || 3000
app({
  fb, feed, users, achievements, rewards
}).listen(port, () => {
  console.log(`Running on :${port}\n`)
})

if (module.hot) {
  module.hot.accept('./app')
}
