var express   = require('express')
var app       = express()

var cdec      = require('./cdec')
var usgs      = require('./usgs')
var policeViolence = require('./policeViolence')

app.listen(3000, function() {
  console.log('Alive, listening on port 3000')
})

app.get('/cdec/:sensorName/:stationId', cdec.handler)
app.get('/usgs/:sensorName/:stationId', usgs.handler)
app.get('/cdec/reservoir-storage/:stationId', cdec.returnResult)

app.post('/policeviolence', policeViolence.handler)
