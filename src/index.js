import dotenv from 'dotenv'
dotenv.config()

import { Facebook } from 'fb'
import { Qtum } from 'qtumjs'

import app from './app'

const fb = new Facebook({ accessToken: process.env.ACCESS_TOKEN })

const repoData = require('../solar.json')
const qtum = new Qtum(process.env.RPC_URL, repoData)
const users = qtum.contract('Users.sol')
const achievements = qtum.contract('Achievements.sol')

const port = process.env.PORT || 3000
app({
  fb, users, achievements
}).listen(port, () => {
  console.log('Running on :${port}\n')
})

if (module.hot) {
  module.hot.accept('./app')
}