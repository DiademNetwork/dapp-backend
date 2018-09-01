import express from 'express'
import bodyParser from 'body-parser'
import { isAddress } from './helpers'

export default ({ fb, users, achievements, feed }) => {
  const app = express()
  app.use(bodyParser())

  app.post('/register', async (req, res) => {
    try {
      const { address, user, token } = req.body

      if (!isAddress(address)) { throw new Error(`${address} is not valid wallet`) }

      const response = await fb.api('debug_token', { input_token: token })

      if (!response.is_valid || response.user_id !== user) { throw new Error(`${token} is not valid access token for ${user}`) }

      const existingUser = await users.call('getUser', [user])

      if (existingUser.outputs && existingUser.outputs[0]) { throw new Error(`${user} has already registered`) }

      const txid = await users.send('register', [address, user])

      res.json({ txid })
    } catch (e) {
      res.sendStatus(500)
    }
  })

  app.post('/confirm', async (req, res) => {
    try {
      const { user, token, target } = req.body

      const response = await fb.api('debug_token', { input_token: token })

      if (!response.is_valid || response.user_id !== user) { throw new Error(`${token} is not valid access for ${user}`) }

      await feed.addActivity({
        actor: user,
        verb: 'confirm',
        target: target
      })

      res.sendStatus(200)
    } catch (e) {
      res.sendStatus(500)
    }
  })

  app.post('/create', async (req, res) => {
    try {
      const { user, target, title } = req.body

      await feed.addActivity({
        actor: user,
        verb: 'create',
        target,
        title
      })

      res.sendStatus(200)
    } catch (e) {
      res.sendStatus(500)
    }
  })

  return app
}
