var app = require('express')()
var raven = require('raven')

var cdec      = require('./cdec')
var usgs      = require('./usgs')
var policeViolence = require('./policeViolence')

var sentryDsn = process.env.SCRAP_SENTRY_DSN

if (sentryDsn) {
    app.use(raven.middleware.express.requestHandler(sentryDsn))
} else {
    console.warn("SCRAP_SENTRY_DSN not set; not reporting errors")
}

app.get('/', function(req, resp) {
    resp.write("I'm alive!\n")
    resp.end()
})
app.get('/cdec/:sensorName/:stationId', cdec.handler)
app.get('/usgs/:sensorName/:stationId', usgs.handler)

app.post('/policeviolence', policeViolence.handler)

if (sentryDsn) {
    app.use(raven.middleware.express.errorHandler("https://5a2d8ea98fe8401eb2ca8461a66f3a98:bd14f6838c8a485d89babe5b6da1d740@app.getsentry.com/66483"))
}

app.listen(3000, function() {
  console.log('Alive, listening on port 3000')
})
