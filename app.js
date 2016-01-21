var express   = require('express')
var app       = express()
var fetchUrl  = require('fetch').fetchUrl
var moment    = require('moment')

app.get('/cdec/:station', function(req, res) {
  // res.send(req.params.station)
  fetchCDECdata(req.params.station, function(data) {
    var cleanData = cleanupCDECdata(data)
    res.header("Content-Type", "text/plain")
    res.send(cleanData)
  })
})

app.listen(3000, function() {
  console.log('Alive, listening on port 3000')
})

var fetchCDECdata = function(station, callback) {
  var s_id = station.toUpperCase()
  var startDate = moment().subtract(1, 'year')
  var endDate = moment().subtract(1, 'day')
  var url = 'http://cdec.water.ca.gov/cgi-progs/queryCSV?station_id=' + s_id + '&sensor_num=015&dur_code=D&start_date=' + startDate.format('YYYY-MM-DD') + '&end_date=' + endDate.format('YYYY-MM-DD') + '&data_wish=View+CSV+Data'
  console.log(url)
  fetchUrl(url, function(error, meta, body) {
    callback(body.toString())
  })
}

var cleanupCDECdata = function(text) {
  var lines = text.split('\n')
  // remove first line
  lines.splice(0, 1)

  for (var i = 0; i < lines.length; i++) {
    // Remove second "PST" col that is always "0000"
    var cols = lines[i].split(',')
    cols.splice(1, 1)

    cols[0] = moment(cols[0], 'YYYYMMDD').format('YYYY-MM-DD')
    lines[i] = cols.join(',')
  }

  lines[0] = "Date,Reservoir storage (af)"

  return lines.join('\n')
}