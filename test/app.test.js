import request from 'supertest'
import app from '../src/app'

const port = process.env.PORT || 3000
const address = '0xA6279eF0c0C4BEa836E7e22AcC445f74BEa33CbD'
const user = '7flash'
const existingUser = '8flash'
const token = 'facebookauth'
const target = 'link_to_facebook_post'
const title = 'john posted 5 chapter'

const fb = {
  api: jest.fn(() => Promise.resolve({ user_id: user, is_valid: true }))
}

const txid = '0xd6ed9643ffe97dd5b43613f0b5602db5c10ebc819ccad795c4fd188e9239290f'
const users = {
  send: jest.fn(() => Promise.resolve(txid)),
  call: jest.fn((requestedUser) => {
    return requestedUser === existingUser ?
      Promise.resolve({ outputs: [user, address] }) :
      Promise.resolve({ outputs: [''] })
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
        .send({ user, target, title })
        .expect(200)

      expect(feed.addActivity).toHaveBeenCalledWith({
        actor: user,
        verb: 'create',
        target,
        title
      })
    })
  })

  describe('Confirmation handler', () => {
    it('should confirm achievement on behalf of user', async () => {
      await request(server)
        .post('/confirm')
        .send({ user, token, target })
        .expect(200)

      expect(feed.addActivity).toHaveBeenCalledWith({
        actor: user,
        verb: 'confirm',
        target
      })

      expect(feed.addActivity).toHaveBeenCalledWith({
        actor: user,
        verb: 'create',
        target,
        title
      })
    })
  })

  describe('Register handler', () => {
    it('should save valid user in smart contract', async () => {
      await request(server)
        .post('/register')
        .send({ address, user, token })
        .expect({ txid })

      expect(fb.api).toHaveBeenCalledWith('debug_token', { input_token: token })
      expect(users.call).toHaveBeenCalledWith('getUser', [user])
      expect(users.send).toHaveBeenCalledWith('register', [address, user])
    })

    it('should throw error for invalid address', async () => {
      await request(server)
        .post('/register')
        .send({ address: '', user, token })
        .expect(500)
    })

    it('should throw error for already registered user', async () => {
      await request(server)
        .post('/register')
        .send({ address, user: existingUser, token })
    })
  })
})