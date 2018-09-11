import express from 'express'
import bodyParser from 'body-parser'
import { isAddress, isAccountOwner, isAddressOwner, toHexAddress, toContentHash, toUserProfileName } from './helpers'

export default ({ fb, feed, users, achievements, rewards, encodeMethod, rawCall, token, depositMethodABI, supportMethodABI, options }) => {
  const app = express()
  app.use(bodyParser())

  const transactionsPending = {}

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

      if (transactionsPending[user] === true) {
        return res.json({ exists: false, pending: true })
      }

      const account = (await users.call('accountExists', [user])).outputs[0]

      if (account) {
        return res.json({ exists: true })
      } else {
        return res.json({ exists: false })
      }
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: error.toString() })
    }
  })

  app.post('/getAccessToken', async (req, res) => {
    try {
      const { address, user, token } = req.body

      if (!isAddress(address)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS ' })
      }

      if (!isAccountOwner(fb, user, token)) {
        return res.status(500).json({ error: 'INVALID_TOKEN' })
      }

      const hexAddress = toHexAddress(address)

      if (!isAddressOwner(users, hexAddress, user)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS_OWNER' })
      }

      const accessToken = token(address)

      res.json({ accessToken: accessToken, address, user })
    } catch (error) {
      console.error(error)
      res.status(500).send({ error: error.toString() })
    }
  })

  app.post('/register', async (req, res) => {
    try {
      const { address, user, token } = req.body

      if (!isAddress(address)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS' })
      }

      if (!isAccountOwner(fb, user, token)) {
        return res.status(500).json({ error: 'INVALID_TOKEN' })
      }

      const hexAddress = toHexAddress(address)

      const userExists = (await users.call('exists', [hexAddress])).outputs[0]

      if (userExists) {
        return res.status(500).json({ error: 'USER_EXISTS' })
      }

      const transaction = await users.send('register', [hexAddress, user], options)

      const { txid } = transaction

      const userProfileName = await toUserProfileName(fb, user)

      await feed.addActivity({
        actor: user,
        object: address,
        target: txid,
        name: userProfileName,
        verb: 'register'
      })

      res.json({ user, address, hexAddress, userProfileName, txid })

      transactionsPending[user] = true
      await transaction.confirm(1)
      transactionsPending[user] = false
    } catch (e) {
      console.error(e)
      res.status(500).send({ error: e.toString() })
    }
  })

  app.post('/confirm', async (req, res) => {
    try {
      const { address, user, token, link } = req.body

      if (!isAddress(address)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS ' })
      }

      if (!isAccountOwner(fb, user, token)) {
        return res.status(500).json({ error: 'INVALID_TOKEN' })
      }

      const hexAddress = toHexAddress(address)

      if (!isAddressOwner(users, hexAddress, user)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS_OWNER' })
      }

      const transaction = await achievements.send('confirmFrom', [hexAddress, link], options)

      const { txid } = transaction

      const userProfileName = await toUserProfileName(fb, user)

      await feed.addActivity({
        actor: user,
        object: link,
        target: txid,
        name: userProfileName,
        verb: 'confirm'
      })

      res.json({ user, address, hexAddress, link, userProfileName, txid })
    } catch (e) {
      console.error(e)
      res.status(500).send({ error: e.toString() })
    }
  })

  app.post('/create', async (req, res) => {
    try {
      const { user, token, address, link, title, previousLink } = req.body

      if (!isAddress(address)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS' })
      }

      if (!isAccountOwner(fb, user, token)) {
        return res.status(500).json({ error: 'INVALID_TOKEN' })
      }

      const hexAddress = toHexAddress(address)

      if (!isAddressOwner(users, hexAddress, user)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS_OWNER' })
      }

      const contentHash = toContentHash(link)

      let args = [hexAddress, link, contentHash, title]

      if (previousLink) {
        args.push(previousLink)
      }

      const transaction = await achievements.send('createFrom', args, options)

      const { txid } = transaction

      const verb = previousLink ? 'update' : 'create'

      const userProfileName = await toUserProfileName(fb, user)

      await feed.addActivity({
        actor: user,
        object: link,
        target: txid,
        verb: verb,
        name: userProfileName
      })

      res.json({ user, address, hexAddress, link, title, previousLink, txid, userProfileName, contentHash })
    } catch (e) {
      console.error(e)
      res.sendStatus(500).send({ error: e.toString() })
    }
  })

  app.post('/withdraw', async (req, res) => {
    try {
      const { link, witness } = req.body

      if (!isAddress(witness)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS' })
      }

      const hexWitness = toHexAddress(witness)
      const { txid } = await rewards.send('withdraw', [link, hexWitness], options)

      await feed.addActivity({
        actor: witness,
        object: link,
        target: txid,
        verb: 'withdraw'
      })

      res.json({ txid, link, witness, hexWitness })
    } catch (e) {
      console.error(e)
      res.status(500).send({ error: e.toString() })
    }
  })

  app.post('/encodeSupport', async (req, res) => {
    try {
      const { link } = req.body

      const encodedData = encodeMethod(supportMethodABI, [link], options)

      res.status(500).json({ encodedData })
    } catch (e) {
      console.error(e)
      res.status(500).send({ error: e.toString() })
    }
  })

  app.post('/encodeDeposit', async (req, res) => {
    try {
      const { link, witness } = req.body

      const witnessAddress = (await users.call('getAddressByAccount', [witness])).outputs[0]

      const encodedData = encodeMethod(depositMethodABI, [link, witnessAddress], options)

      res.json({ encodedData })
    } catch (e) {
      console.error(e)
      res.status(500).send({ error: e.toString() })
    }
  })

  app.post('/support', async (req, res) => {
    try {
      const { rawTx, link, address, user, token } = req.body

      if (!isAddress(address)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS' })
      }

      if (!isAccountOwner(fb, user, token)) {
        return res.status(500).json({ error: 'INVALID_TOKEN' })
      }

      const hexAddress = toHexAddress(address)

      if (!isAddressOwner(users, hexAddress, user)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS_OWNER' })
      }

      const { txid } = await rawCall('sendrawtransaction', [rawTx])

      const userProfileName = await toUserProfileName(fb, user)

      await feed.addActivity({
        actor: address,
        object: link,
        target: txid,
        name: userProfileName,
        verb: 'support'
      })

      res.json({ txid, link, address, userProfileName, user })
    } catch (e) {
      console.error(e)
      res.status(500).send({ error: e.toString() })
    }
  })

  app.post('/deposit', async (req, res) => {
    try {
      const { rawTx, link, witness, address, user, token } = req.body

      if (!isAddress(address)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS' })
      }

      if (!isAccountOwner(fb, user, token)) {
        return res.status(500).json({ error: 'INVALID_TOKEN' })
      }

      const hexAddress = toHexAddress(address)

      if (!isAddressOwner(users, hexAddress, user)) {
        return res.status(500).json({ error: 'INVALID_ADDRESS_OWNER' })
      }

      const { txid } = await rawCall('sendrawtransaction', [rawTx])

      const userProfileName = await toUserProfileName(fb, user)

      await feed.addActivity({
        actor: address,
        object: link,
        witness: witness,
        target: txid,
        name: userProfileName,
        verb: 'support'
      })

      res.json({ txid, link, witness, address, userProfileName, user })
    } catch (e) {
      console.error(e)
      res.status(500).send({ error: e.toString() })
    }
  })

  return app
}
