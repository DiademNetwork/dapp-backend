import dotenv from 'dotenv'
dotenv.config()

import stream from 'getstream'

describe('Feeds', () => {
  let client = null
  let feed = null
  let response = null
  let results = null

  const exampleAchievement = {
    "actor": "100004609778664",
    "foreign_id": "",
    "id": "3de25a00-adf5-11e8-95a4-1231d51167b4",
    "link": "https://medium.com/@igorberlenko/diadem-network-is-moving-to-qtum-blockchain-f09887233733",
    "name": "Igor Berlenko",
    "object": "55684912a4c55e4008388c3278fb1228e2a20d0b4703d50f202280e39d7d34fc",
    "origin": null,
    "target": "",
    "time": "2018-09-01T14:42:25.163725",
    "title": "Igor published winning announcement",
    "verb": "create"
  }

  const exampleConfirmation = {
    "actor": "kulachenko",
    "foreign_id": "",
    "id": "3ddea3b4-adf5-11e8-9a15-0a081e7097fe",
    "object": "55684912a4c55e4008388c3278fb1228e2a20d0b4703d50f202280e39d7d34fc",
    "origin": null,
    "target": "",
    "time": "2018-09-01T14:42:25.139397",
    "verb": "confirm"
  }

  beforeAll(async () => {
    client = stream.connect(process.env.STREAM_KEY, process.env.STREAM_SECRET, process.env.STREAM_APPID, { browser: false })
    feed = client.feed(process.env.STREAM_FEED, 'common')
    response = await feed.get()
    results = response.results
  })

  it('should have a list of achievements', () => {
    const achievements = results.find((item) => {
      return item.group == 'create'
    }).activities

    const foundExampleAchievement = achievements.find((item) => {
      return item.id === exampleAchievement.id
    })

    expect(foundExampleAchievement).toEqual(exampleAchievement)
  })

  it('should have a list of confirmations for every achievement', () => {
    const groupOfAchievementConfirmations = `confirm_${exampleAchievement.object}`

    const confirmations = results.find((item) => {
      return item.group == groupOfAchievementConfirmations
    }).activities

    const foundExampleConfirmation = confirmations.find((item) => {
      return item.id === exampleConfirmation.id
    })

    expect(foundExampleConfirmation).toEqual(exampleConfirmation)
  })
})