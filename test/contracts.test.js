import { Qtum } from 'qtumjs'

import dotenv from 'dotenv'
dotenv.config()

jest.setTimeout(100000)

describe('Contracts', () => {
  const options = {
    senderAddress: process.env.SENDER_ADDRESS
  }

  let qtum = null
  let users = null
  let achievements = null
  let rewards = null

  beforeAll(() => {
    const repo = require('../solar.development.json')
    qtum = new Qtum(process.env.QTUM_RPC_ADDRESS, repo)

    users = qtum.contract('contracts/Users.sol')
    achievements = qtum.contract('contracts/Achievements.sol')
    rewards = qtum.contract('contracts/Rewards.sol')
  })

  describe('Sponsors support author of book for publishing new chapters', () => {
    const authorAddress = '0xA6279eF0c0C4BEa836E7e22AcC445f74BEa33CbD'
    const sponsorAddress = '0x66428098A4455EA8C69171f590Dd49De5F1b1419'
    const witnessAddress = '0xA233eA027eCBCC10F0cC58Db5A0E77eaB57FeCC6'
    const authorAccount = 'authorID'
    const sponsorAccount = 'sponsorID'
    const postLink = 'facebook.com/postid'
    const postContentHash = '0xA6279eF0c0C4BEa836E7e22AcC445f74BEa33CbD'
    const title = 'John is going to publish second chapter of his book'

    it('author can verify his identity with profile in facebook', async () => {
      const tx = await users.send('register', [authorAddress, authorAccount], options)

      await tx.confirm(1)

      console.log(`${authorAccount} => ${authorAddress} at ${tx.txid}`)
    })

    it('author should have his identity verified', async () => {
      const tx1 = await users.call('getAccountByAddress', [authorAddress])
      const account = tx1.outputs[0]

      const tx2 = await users.call('exists', [authorAddress])
      const exists = tx2.outputs[0]

      expect(typeof account).toBe('string')
      expect(exists).toBe(true)
    })

    it('author can create achievement with link to the post with published chapter', async () => {
      const tx = await achievements.send('createFrom', [authorAddress, postLink, postContentHash, title], options)

      await tx.confirm(1)

      console.log(`${authorAddress} => ${title} at ${tx.txid}`)
    })

    it('achievement should be created with by author', async () => {
      const tx = await users.call('getAchievementCreatorRaw', [postLink])
      const creator = tx.outputs[0]

      expect(creator).toBe(authorAddress)
    })

    it('sponsor can send funds to author if he likes published chapter', async () => {
      const tx = await rewards.send('support', [postLink], { senderAddress: options.senderAddress, value: 10 })

      await tx.confirm(1)

      console.log(`${options.senderAddress} sent funds for ${postLink} at ${tx.txid}`)
    })

    it('sponsor can create reward that will be available when witness will confirm achievement', async () => {
      const tx = await rewards.send('deposit', [postLink, witnessAddress], { senderAddress: options.senderAddress, value: 20 })

      await tx.confirm(1)

      console.log(`${options.senderAddress} => ${postLink} when ${witnessAddress} at ${txid}`)
    })

    it('reward should be created by sponsor and associated with witness', async () => {
      const tx = await rewards.call('getRewardAmount', [postLink, witnessAddress])
      const amount = tx.outputs[0]

      expect(amount).toBe(20)
    })

    it('anyone can witness that achievement was accomplished', async () => {
      const tx = await achievements.send('confirmFrom', [witnessAddress, postLink], options)

      await tx.confirm(1)

      console.log(`${witnessAddress} has confirmed accomplishment of ${postLink}`)
    })

    it('achievement should be confirmed by witness', async () => {
      const tx = await achievements.call('confirmedByRaw', [postLink, witnessAddress], options)
      const confirmed = tx.outputs[0]

      expect(confirmed).toBe(true)
    })

    it('anyone can initiate withdrawal of funds when specific witness has confirmed accomplishment of achievement', async () => {
      const tx = await rewards.send('withdraw', [postLink, witnessAddress], options)

      await tx.confirm(1)

      console.log(`someone initiated withrawal associated with ${witnessAddress} for ${postLink}`)
    })

    it('deposit should be withdrawn to creator of achievement', async () => {
      const tx = await rewards.call('getRewardAmount', [postLink, witnessAddress])
      const amount = tx.outputs[0]

      expect(amount).toBe(0)
    })
  })
})
