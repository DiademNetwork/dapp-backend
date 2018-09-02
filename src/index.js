var http, options, proxy, url;

http = require("http");

url = require("url");

proxy = url.parse(process.env.QUOTAGUARDSTATIC_URL);
target  = url.parse("http://ip.quotaguard.com/");

options = {
  hostname: proxy.hostname,
  port: proxy.port || 80,
  path: target.href,
  headers: {
    "Proxy-Authorization": "Basic " + (new Buffer(proxy.auth).toString("base64")),
    "Host" : target.hostname
  }
};

http.get(options, function(res) {
  res.pipe(process.stdout);
  return console.log("status code", res.statusCode);
});