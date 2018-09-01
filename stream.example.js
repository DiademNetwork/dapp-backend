require('dotenv').config()

var stream = require('getstream')

const client = stream.connect(process.env.STREAM_KEY, process.env.STREAM_SECRET, process.env.STREAM_APPID)
const feed = client.feed(process.env.STREAM_FEED, 'common')

const activities = [{
  title: 'Igor published winning announcement', // message that will be displayed
  name: 'Igor Berlenko', // author of achievement
  link: 'https://medium.com/@igorberlenko/diadem-network-is-moving-to-qtum-blockchain-f09887233733', // link to achievement
  object: '55684912a4c55e4008388c3278fb1228e2a20d0b4703d50f202280e39d7d34fc', // sha256 from link
  actor: '100004609778664', // id of author in facebook,
  verb: 'create'
}, {
  object: '55684912a4c55e4008388c3278fb1228e2a20d0b4703d50f202280e39d7d34fc',
  actor: 'kulachenko',
  verb: 'confirm'
}, {
  object: '55684912a4c55e4008388c3278fb1228e2a20d0b4703d50f202280e39d7d34fc',
  actor: 'nikkulikov',
  verb: 'confirm'
}]

activities.forEach((item) => {
  feed.addActivity(item)
})
