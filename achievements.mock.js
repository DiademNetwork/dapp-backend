require('dotenv').config()

const stream = require('getstream')
const p = require('lorem-ipsum')

const client = stream.connect(process.env.STREAM_KEY, process.env.STREAM_SECRET, process.env.STREAM_APPID)
const feed = client.feed(process.env.STREAM_ACHIEVEMENTS_GROUP, process.env.STREAM_ACHIEVEMENTS_FEED)

let activities = []

const w = (wordsCount) => {
  return {
    units: 'words',
    count: wordsCount
  }
}

const createAchievement = () => ({
  title: p(w(4)),
  name: p(w(2)),
  link: 'https://'.concat(p(w(1))),
  wallet: '0x'.concat(p(w(1))),
  object: p(w(1)),
  actor: p(w(1)),
  verb: 'create'
})

const confirmAchievement = (object) => ({
  object: object,
  actor: p(w(1)),
  verb: 'confirm'
})

const depositReward = (object, witness) => ({
  object: object,
  witness: witness,
  actor: p(w(1)),
  amount: Math.random() * 1000,
  verb: 'reward'
})

const nAchievements = 20
const nWitnesses = 5
const nRewards = 5

for (let i = 0; i < nAchievements; i++) {
  const achievement = createAchievement()
  activities.push(achievement)

  for (let j = 0; j < nWitnesses; j++) {
    const witness = confirmAchievement(achievement.object)
    activities.push(witness)

    const reward = depositReward(achievement.object, witness.actor)
    activities.push(reward)
  }
}

const purge = () => {
  feed.get({ limit: 100 }).then((list) => {
    list.results.forEach((item) => {
      if (item.activities) {
        item.activities.forEach((activity) => {
          feed.removeActivity(activity.id)
        })
      } else {
        feed.removeActivity(item.id)
      }
    })
  })
}

const populate = () => {
  activities.forEach((activity) => {
    feed.addActivity(activity)
  })
}

populate()
