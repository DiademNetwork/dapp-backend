import request from 'supertest'
import app from '../src/app'

const port = process.env.PORT || 3000
const address = 'qb9u5JU9vFCZ7bdN4odZezvYgk6JnQmVkq'
const existingUserAddress = 'qUphwvjrPEGuDo4t8E1FQNq7YXzgzwx9k7'
const user = '7flash'
const existingUser = '8flash'
const token = 'facebookauth'
const link = 'link_to_facebook_post' // `object` field in feeds
const title = 'john posted 5 chapter'
const contentHash = '0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce'
const hexAddress = 'c10141756952bc618876bc056ab52b88249cbbc8'
const hexWitness = '7b8f4f2aac669fccbda9e96c70616bc3c2f0de11'
const previousLink = '' // previous link is empty when user creates new chain

const fb = {
  api: jest.fn((method, args) => {
    if (args.input_token === token) return { user_id: user, is_valid: true }
    else return { user_id: existingUser, is_valid: true }
  })
}

const txid = '0xd6ed9643ffe97dd5b43613f0b5602db5c10ebc819ccad795c4fd188e9239290f'

let addr2acc = {}
let acc2addr = {}
addr2acc[existingUserAddress] = existingUser
acc2addr[existingUser] = existingUserAddress
const users = {
  send: jest.fn((command, [address, user]) => {
    if (command === 'register') {
      addr2acc[address] = user
      acc2addr[user] = address
    }
    return Promise.resolve({ txid })
  }),
  call: jest.fn((command, [user]) => {
    let response = null
    if (command === 'exists') {
      response = addr2acc[user]
    } else {
      response = acc2addr[user]
    }
    return Promise.resolve({ outputs: [response] })
  })
}
const achievements = {
  send: jest.fn(() => Promise.resolve({ txid }))
}
const rewards = {
  send: jest.fn(() => Promise.resolve({ txid }))
}
const feed = {
  addActivity: jest.fn(() => Promise.resolve())
}

const createTxActivity = {
  actor: user,
  object: link,
  target: txid,
  verb: 'create'
}
const confirmTxActivity = {
  actor: user,
  object: link,
  target: txid,
  verb: 'confirm'
}
const registerTxActivity = {
  actor: user,
  object: address,
  target: txid,
  verb: 'register'
}
const withdrawTxActivity = {
  actor: existingUserAddress,
  object: link,
  target: txid,
  verb: 'withdraw'
}

describe('App', () => {
  let server = null

  beforeAll(() => {
    server = app({ fb, feed, users, achievements, rewards }).listen(port)
  })
  afterAll(() => {
    server.close()
  })

  describe('Creation handler', () => {
    it('should add achievement to common feed', async () => {
      await request(server)
        .post('/create')
        .send({ user, token, address, link, title, previousLink })
        .expect({ user, address, link, contentHash, title, txid, hexAddress, previousLink })

      expect(feed.addActivity).toHaveBeenCalledWith(createTxActivity)
    })
  })

  describe('Confirmation handler', () => {
    it('should confirm achievement on behalf of user', async () => {
      await request(server)
        .post('/confirm')
        .send({ user, address, token, link })
        .expect({ user, address, link, txid, hexAddress })

      expect(feed.addActivity).toHaveBeenCalledWith(confirmTxActivity)
    })
  })

  describe('Register handler', () => {
    it('should save valid user in smart contract', async () => {
      await request(server)
        .post('/register')
        .send({ address, user, token })
        .expect({ user, address, txid, hexAddress })

      expect(fb.api).toHaveBeenCalledWith('debug_token', { input_token: token })

      expect(users.call).toHaveBeenCalledWith('exists', [hexAddress])
      expect(users.send).toHaveBeenCalledWith('register', [hexAddress, user])

      expect(feed.addActivity).toHaveBeenCalledWith(registerTxActivity)
    })

    it('should throw error for invalid address', async () => {
      await request(server)
        .post('/register')
        .send({ address: '', user, token })
        .expect({ error: 'INVALID_ADDRESS' })
    })

    it('should throw error for already registered user', async () => {
      await request(server)
        .post('/register')
        .send({ address, user: existingUser, token })
        .expect({ error: 'USER_EXISTS' })
    })
  })

  describe('Withdraw handler', () => {
    it('should transfer funds to creator of achievement when witness associated with reward has confirmed achievement', async () => {
      await request(server)
        .post('/withdraw')
        .send({ link, witness: existingUserAddress })
        .expect({ txid, link, witness: existingUserAddress, hexWitness })

      expect(feed.addActivity).toHaveBeenCalledWith(withdrawTxActivity)
    })
  })
})
