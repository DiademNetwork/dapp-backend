import express from 'express'
import bodyParser from 'body-parser'
import { isAddress } from './helpers'

export default ({ fb, users, achievements, feed }) => {
  const app = express()
  app.use(bodyParser())

  app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'https://diademnetwork.github.io')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

    next()
  })

  app.get('/ping', (req, res) => {
    res.json({ pong: 'pong' })
  })

  app.post('/register', async (req, res) => {
    try {
      const { address, user, token } = req.body

      if (!isAddress(address)) { throw new Error(`${address} is not valid wallet`) }

      const response = await fb.api('debug_token', { input_token: token })

      if (!response.is_valid || response.user_id !== user) {
        res.json({ invalidToken: true })
      }

      const existingUser = await users.call('getUser', [user])

      if (existingUser.outputs && existingUser.outputs[0].toString().length > 0) {
        res.json({ alreadyExists: true })
      }

      const txid = await users.send('register', [address, user])

      res.json({ txid })
    } catch (e) {
      console.error(e)
      res.sendStatus(500)
    }
  })

  app.post('/confirm', async (req, res) => {
    try {
      const { user, token, object } = req.body

      const response = await fb.api('debug_token', { input_token: token })

      if (!response.is_valid || response.user_id !== user) { throw new Error(`${token} is not valid access for ${user}`) }

      await feed.addActivity({
        actor: user,
        verb: 'confirm',
        object
      })

      res.sendStatus(200)
    } catch (e) {
      console.error(e)
      res.sendStatus(500)
    }
  })

  app.post('/create', async (req, res) => {
    try {
      const { user, object, title } = req.body

      await feed.addActivity({
        actor: user,
        verb: 'create',
        object,
        title
      })

      res.sendStatus(200)
    } catch (e) {
      console.error(e)
      res.sendStatus(500)
    }
  })

  return app
}
