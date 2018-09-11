import dotenv from 'dotenv'

import { Qtum } from 'qtumjs'
import { Facebook } from 'fb'
import stream from 'getstream'

import app from './app'
dotenv.config()

const fb = new Facebook({ accessToken: process.env.FACEBOOK_ACCESS_TOKEN })

const qtumRepository = require('../solar.development.json')
const qtum = new Qtum(process.env.QTUM_RPC_ADDRESS, qtumRepository)
const users = qtum.contract('contracts/Users.sol')
const achievements = qtum.contract('contracts/Achievements.sol')
const rewards = qtum.contract('contracts/Rewards.sol')

const encodeMethod = qtum.encodeMethod
const supportMethodABI = qtumRepository.contracts['contracts/Rewards.sol'].abi.find(method => method.name === 'support')
const depositMethodABI = qtumRepository.contracts['contracts/Rewards.sol'].abi.find(method => method.name === 'deposit')

const client = stream.connect(process.env.STREAM_KEY, process.env.STREAM_SECRET)
const feed = client.feed(process.env.STREAM_TRANSACTIONS_GROUP, process.env.STREAM_TRANSACTIONS_FEED)

const port = process.env.APP_PORT || 3000

const options = {
  senderAddress: process.env.SENDER_ADDRESS
}

app({
  fb, feed, users, achievements, rewards, encodeMethod, supportMethodABI, depositMethodABI, options
}).listen(port, () => {
  console.log(`Running on :${port}\n`)
})

if (module.hot) {
  module.hot.accept('./app')
}
