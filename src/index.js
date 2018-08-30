import { Facebook } from 'fb'

import app from './app'

const port = process.env.PORT || 3000
const accessToken = process.env.accessToken || ''

const fb = new Facebook({ accessToken })

app({
  fb
}).listen(port, () => {
  console.log('Running on :${port}\n')
})

if (module.hot) {
  module.hot.accpt('./app')
}