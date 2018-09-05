import request from 'supertest'
import app from '../src/app'

const port = process.env.PORT || 3000
const address = 'qb9u5JU9vFCZ7bdN4odZezvYgk6JnQmVkq'
const existingUserAddress = 'qUphwvjrPEGuDo4t8E1FQNq7YXzgzwx9k7'
const user = '7flash'
const existingUser = '8flash'
const token = 'facebookauth'
const object = 'link_to_facebook_post'
const title = 'john posted 5 chapter'

const fb = {
  api: jest.fn((method, args) => {
    if (args.input_token == token) return { user_id: user, is_valid: true }
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
    if (command == 'register') {
      addr2acc[address] = user
    }
    return Promise.resolve(txid)
  }),
  call: jest.fn((command, [user]) => {
    let response = null
    if (command === 'exists') {
      response = addr2acc[user]
    } else {
      response = acc2addr[user]
    }
    return Promise.resolve(response)
  })
}
const achievements = {
  send: jest.fn(() => Promise.resolve(txid))
}
const feed = {
  addActivity: jest.fn(() => Promise.resolve())
}

describe('App', () => {
  let server = null

  beforeAll(() => {
    server = app({ fb, users, achievements, feed }).listen(port)
  })
  afterAll(() => {
    server.close()
  })

  describe('Creation handler', () => {
    it('should add achievement to common feed', async () => {
      await request(server)
        .post('/create')
        .send({ user, object, title })
        .expect(200)
    })
  })

  describe('Confirmation handler', () => {
    it('should confirm achievement on behalf of user', async () => {
      await request(server)
        .post('/confirm')
        .send({ user, token, object })
        .expect(200)
    })
  })

  describe('Register handler', () => {
    it('should save valid user in smart contract', async () => {
      await request(server)
        .post('/register')
        .send({ address, user, token })
        .expect({ user, address, txid })

      expect(fb.api).toHaveBeenCalledWith('debug_token', { input_token: token })
      expect(users.call).toHaveBeenCalledWith('exists', [address])
      expect(users.send).toHaveBeenCalledWith('register', [address, user])
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
})
