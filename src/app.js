import express from 'express'
import bodyParser from 'body-parser'
import { isAddress, isAccountOwner, toHexAddress, toContentHash } from './helpers'

export default ({ fb, feed, users, achievements, rewards }) => {
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

      const account = (await users.call('accountExists', [user])).outputs[0]

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

      const hexAddress = toHexAddress(address)

      const userExists = (await users.call('exists', [hexAddress])).outputs[0]

      if (userExists) {
        return res.status(400).json({ error: 'USER_EXISTS' })
      }

      const { txid } = await users.send('register', [hexAddress, user])

      await feed.addActivity({
        actor: user,
        object: address,
        target: txid,
        verb: 'register'
      })

      res.json({ user, address, hexAddress, txid })
    } catch (e) {
      console.error(e)
      res.sendStatus(500)
    }
  })

  app.post('/confirm', async (req, res) => {
    try {
      const { address, user, token, link } = req.body

      if (!isAddress(address)) {
        return res.status(400).json({ error: 'INVALID_ADDRESS ' })
      }

      if (!isAccountOwner(fb, user, token)) {
        return res.status(400).json({ error: 'INVALID_TOKEN' })
      }

      const hexAddress = toHexAddress(address)
      const { txid } = await users.send('confirmFrom', [hexAddress, link])

      await feed.addActivity({
        actor: user,
        object: link,
        target: txid,
        verb: 'confirm'
      })

      res.json({ user, address, hexAddress, link, txid })
    } catch (e) {
      console.error(e)
      res.sendStatus(500)
    }
  })

  app.post('/create', async (req, res) => {
    try {
      const { user, token, address, link, title, previousLink } = req.body

      if (!isAddress(address)) {
        return res.status(400).json({ error: 'INVALID_ADDRESS' })
      }

      if (!isAccountOwner(fb, user, token)) {
        return res.status(400).json({ error: 'INVALID_TOKEN' })
      }

      const contentHash = toContentHash(link)
      const hexAddress = toHexAddress(address)

      let args = [hexAddress, link, contentHash, title]

      if (previousLink) {
        args.push(previousLink)
      }

      const { txid } = await achievements.send('createFrom', args)

      await feed.addActivity({
        actor: user,
        object: link,
        target: txid,
        verb: 'create'
      })

      res.json({ user, address, hexAddress, link, title, previousLink, txid, contentHash })
    } catch (e) {
      console.error(e)
      res.sendStatus(500)
    }
  })

  app.post('/withdraw', async (req, res) => {
    try {
      const { link, witness } = req.body

      if (!isAddress(witness)) {
        return res.status(400).json({ error: 'INVALID_ADDRESS' })
      }

      const hexWitness = toHexAddress(witness)
      const { txid } = await rewards.send('withdraw', [link, hexWitness])

      await feed.addActivity({
        actor: witness,
        object: link,
        target: txid,
        verb: 'withdraw'
      })

      res.json({ txid, link, witness, hexWitness })
    } catch (e) {
      console.error(e)
      res.sendStatus(500)
    }
  })

  return app
}
