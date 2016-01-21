var express   = require('express')
var app       = express()
var cdec      = require('./cdec')

app.listen(3000, function() {
  console.log('Alive, listening on port 3000')
})

app.get('/cdec/:station', cdec.returnResult)