var express   = require('express')
var app       = express()
var fetchUrl  = require('fetch').fetchUrl
var moment    = require('moment')

var returnData = function(req, res) {
  fetchData(req.params.station, function(data) {
    var cleanData = cleanupData(data)
    res.header("Content-Type", "text/plain")
    res.send(cleanData)
  })
}

var fetchData = function(station, callback) {
  var s_id = station.toUpperCase()
  var startDate = moment().subtract(1, 'year')
  var endDate = moment().subtract(1, 'day')
  var url = 'http://cdec.water.ca.gov/cgi-progs/queryCSV?station_id=' + s_id + '&sensor_num=015&dur_code=D&start_date=' + startDate.format('YYYY-MM-DD') + '&end_date=' + endDate.format('YYYY-MM-DD') + '&data_wish=View+CSV+Data'
  
  fetchUrl(url, function(error, meta, body) {
    callback(body.toString())
  })
}

var cleanupData = function(text) {
  var lines = text.split('\n')
  // remove first line
  lines.splice(0, 1)

  for (var i = 0; i < lines.length; i++) {
    // Remove second "PST" col that is always "0000"
    var cols = lines[i].split(',')
    cols.splice(1, 1)

    // clean up date formate
    cols[0] = moment(cols[0], 'YYYYMMDD').format('YYYY-MM-DD')
    lines[i] = cols.join(',')
  }

  // replace header row with better headings
  lines[0] = "Date,Reservoir storage (af)"

  return lines.join('\n')
}

module.exports = {
  returnData: returnData
}