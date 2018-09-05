import express from 'express'
import bodyParser from 'body-parser'
import { isAddress, isAccountOwner } from './helpers'

export default ({ fb, users, achievements, feed }) => {
  const app = express()
  app.use(bodyParser())

  app.use((req, res, next) => {
    console.log(req.body)
    next()
  })

  app.get('/ping', (req, res) => {
    res.json({ pong: 'pong' })
  })

  app.post('/check', async (req, res) => {
    try {
      const { user } = req.body

      const account = await users.call('accountExists', [user])

      if (account) {
        return res.json({ exists: true, account })
      } else {
        return res.json({ exists: false })
      }
    } catch (error) {
      console.error(error)
      res.sendStatus(500)
    }
  })

  app.post('/register', async (req, res) => {
    try {
      const { address, user, token } = req.body

      if (!isAddress(address)) {
        return res.status(400).json({ error: 'INVALID_ADDRESS' })
      }

      if (!isAccountOwner(fb, user, token)) {
        return res.status(400).json({ error: 'INVALID_TOKEN' })
      }

      const userExists = await users.call('exists', [address])

      if (userExists) {
        return res.status(400).json({ error: 'USER_EXISTS' })
      }

      const txid = await users.send('register', [address, user])

      res.json({ user, address, txid })
    } catch (e) {
      console.error(e)
      res.sendStatus(500)
    }
  })

  app.post('/confirm', async (req, res) => {
    try {
      const { user, token, object } = req.body

      if (!isAccountOwner(fb, user, token)) {
        return res.status(400).json({ error: 'INVALID_TOKEN' })
      }

      const txid = await users.send('confirmFrom', [user, object])

      res.json({ user, object, txid })
    } catch (e) {
      console.error(e)
      res.sendStatus(500)
    }
  })

  app.post('/create', async (req, res) => {
    try {
      const { user, object, contentHash, title } = req.body

      const txid = await achievements.send('createFrom', [user, object, contentHash, title])

      res.sendStatus({ txid })
    } catch (e) {
      console.error(e)
      res.sendStatus(500)
    }
  })

  return app
}
