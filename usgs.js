var express   = require('express')
var app       = express()
var fetchUrl  = require('fetch').fetchUrl
var moment    = require('moment')

var handler = function(req, res) {
  if (req.params.sensorName == "reservoir-storage" && req.params.stationId == "hetch-hetchy") {
    remoteData = fetchData(function(remoteString) {
      resp = cleanupData(remoteString)
      res.header("Content-Type", "text/plain")
      res.send(resp)
    })
  } else {
    resp.status(404).send("/reservoir-storage/hetch-hetchy is the only valid USGS request at this time")
  }
  
}

var fetchData = function(callback) {
  var startDate = moment().subtract(1, 'year')
  var endDate   = moment().subtract(1, 'day')
  var url = 'http://nwis.waterdata.usgs.gov/usa/nwis/uv/?cb_00054=on&format=rdb&site_no=11275500&begin_date=' + startDate.format('YYYY-MM-DD')+ '&end_date='  + endDate.format('YYYY-MM-DD')

  fetchUrl(url, function(error, meta, body) {
    callback(body.toString())
  })
}

var cleanupData = function(data) {

  var lines = data.split('\n')
  lines = stripCommentRows(lines)

  // strip non-data rows
  lines = stripNonDataRows(lines)

  // one per day
  lines = removeNonNoonRows(lines)

  // remove unnecessary columns and clean up dates
  lines = finalPass(lines)

  // newest first
  lines.reverse()

  // replace first row which ends up being blank with the proper heading
  lines[0] = "Date,Reservoir storage (af),Data-value qualification"

  return lines.join('\n')
}

var stripCommentRows = function(lines) {
  for (var i = lines.length - 1; i >= 0; i--) {
    var isComment = lines[i].substr(0,1) == "#"
    if (isComment) {
      lines.splice(i, 1)
    }
  }
  return lines
}

var stripNonDataRows = function(lines) {
  for (var i = lines.length - 1; i >= 0; i--) {
    if (lines[i].length > 0) {
      var cols = lines[i].split('\t')
      // check to see if the third column is a standard width for dates in YYYY-MM-DD HH:MM format
      var isData = cols[2].length == 16
      if (!isData) {
        lines.splice(i, 1)
      }
    }
  }
  return lines
}

var removeNonNoonRows = function(lines) {
  for (var i = lines.length - 1; i >= 0; i--) {
    if (lines[i].length > 0) {
      var cols = lines[i].split('\t')
      // check to see if the third column is a standard width for dates in YYYY-MM-DD HH:MM format
      // only keep rows where the third column ends in "12:00"
      var isNoon = cols[2].substr(11,5) == "12:00"
      if (!isNoon) {
        lines.splice(i, 1)
      }
    }
  }
  return lines
}

var finalPass = function(lines) {
  for (var i = lines.length - 1; i >= 0; i--) {
    var cols = lines[i].split('\t')
    if (lines[i].length > 0 && cols.length > 0) {
      // remove first 2 cols
      cols.splice(0,2)
      // remove what was the third col
      cols.splice(1,1)
      // remove timestamp
      cols[0] = cols[0].substr(0,10)

      lines[i] = cols.join(',')
    }
  }
  return lines
}

// TODO just split the cols once and save them in lines, don't redo at each step

module.exports = {
  handler: handler
}