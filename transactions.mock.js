require('dotenv').config()

const stream = require('getstream')
const p = require('lorem-ipsum')

const client = stream.connect(process.env.STREAM_KEY, process.env.STREAM_SECRET, process.env.STREAM_APPID)
const feed = client.feed(process.env.STREAM_TRANSACTIONS_GROUP, process.env.STREAM_TRANSACTIONS_FEED)

let activities = []

const w = (wordsCount) => {
  return {
    units: 'words',
    count: wordsCount
  }
}

const address = (() => {
  let index = 0
  const addresses = ['15vkcKf7gB23wLAnZLmbVuMiiVDc1Nm4a2',
    '1A6ut1tWnUq1SEQLMr4ttDh24wcbJ5o9TT',
    '1BpbpfLdY7oBS9gK7aDXgvMgr1DPvNhEB2',
    '1Jz2yCRd5ST1p2gUqFB5wsSQfdm3jaFfg7',
    '2N7FuwuUuoTBrDFdrAZ9KxBmtqMLxce9i1C',
    '2NEWDzHWwY5ZZp8CQWbB7ouNMLqCia6YRda',
    '2MxgPqX1iThW3oZVk9KoFcE5M4JpiETssVN',
    '2NB72XtkjpnATMggui83aEtPawyyKvnbX2o']

  return () => {
    index++
    if (index == addresses.length) {
      index = 0
    }
    return addresses[index]
  }
})()

const tx = (() => {
  let index = 0
  const transactions = [
    'cd97ba7851a829f913a6f872e505b798e464646ea279ca9d8b3b3f471920c379',
    '508c21f1588e8775fb8b451a785217d04fcb64b39d45d5878c1a638537f05778',
    '32a0381c26bb36ea4190429081661e4c5d0fc21bf6caddf67a3ef0ac54b1efce',
    '961c295ce19fb8ffaf1183b9b95f59322aef79b5a3ef1d1ca5b6cf16cfab0262',
    '191a9f949474f78faa5d384ee5c30893c466a45a2c5754623d1fc34e52bcd67f'
  ]

  return () => {
    index++
    if (index == transactions.length) {
      index = 0
    }
    return transactions[index]
  }
})()

const register = () => ({
  actor: p(w(2)),
  object: address(),
  target: tx(),
  verb: 'register'
})

const create = () => ({
  actor: p(w(2)),
  object: 'https://'.concat(p(w(1))),
  target: tx(),
  verb: 'create'
})

const confirm = () => ({
  actor: p(w(2)),
  object: 'https://'.concat(p(w(1))),
  target: tx(),
  verb: 'confirm'
})

const withdraw = () => ({
  actor: p(w(2)),
  object: 'https://'.concat(p(w(1))),
  target: tx(),
  verb: 'withdraw'
})

const numberOfEach = 5

for (let i = 0; i < numberOfEach; i++) {
  activities.push(...[
    register(), create(), confirm(), withdraw()
  ])
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
    console.log(activity)
    feed.addActivity(activity)
  })
}

populate()