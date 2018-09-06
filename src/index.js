import dotenv from 'dotenv'

import { Qtum } from 'qtumjs'
import { Facebook } from 'fb'
import stream from 'getstream'

import app from './app'
dotenv.config()

const repo = require('../solar.json')
const qtum = new Qtum(process.env.RPC_URL, repo)
const users = qtum.contract("Users.sol")
const achievements = qtum.contract("Achievements.sol")
const rewards = qtum.contract("Rewards.sol")

const client = stream.connect(process.env.STREAM_KEY, process.env.STREAM_SECRET)
const feed = client.feed(process.env.STREAM_FEED, 'common')

const port = process.env.PORT || 3000
app({
  fb, feed, users, achievements, rewards
}).listen(port, () => {
  console.log(`Running on :${port}\n`)
})

if (module.hot) {
  module.hot.accept('./app')
}
