const http = require('http')

const url = require('url')

const proxy = url.parse(process.env.QUOTAGUARDSTATIC_URL)
const target = url.parse('http://ip.quotaguard.com/')

const options = {
  hostname: proxy.hostname,
  port: proxy.port || 80,
  path: target.href,
  headers: {
    'Proxy-Authorization': 'Basic ' + (Buffer.from(proxy.auth).toString('base64')),
    'Host': target.hostname
  }
}

http.get(options, function (res) {
  res.pipe(process.stdout)
  return console.log('status code', res.statusCode)
})
