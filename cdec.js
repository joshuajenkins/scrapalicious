var express   = require('express')
var app       = express()
var fetchUrl  = require('fetch').fetchUrl
var moment    = require('moment')

var validStations = ['CLE', 'SHA', 'ORO', 'FOL', 'SNL', 'NML', 'EXC', 'DNP', 'MIL', 'PNF', 'CAS', 'PRR']

// sensors that supply daily historic data
// sensors that supply only hourly, weekly, monthly, or event data are omitted
var dailySensorCodes = [
  {id: 2,   name: "Precipitation, accumulated",       unit: "in"  },
  {id: 6,   name: "Reservoir elevation",              unit: "ft"  },
  {id: 8,   name: "Full natural flow",                unit: "cfs" },
  {id: 15,  name: "Reservoir storage",                unit: "af"  },
  {id: 22,  name: "Reservoir, storage change",        unit: "af"  },
  {id: 23,  name: "Reservoir outflow",                unit: "cfs" },
  {id: 30,  name: "Temperature, air average"          unit: "degf"},
  {id: 31,  name: "Temperature, air maximum",         unit: "degf"},
  {id: 32,  name: "Temperature, air minimum",         unit: "degf"},
  {id: 45,  name: "Precipitation, incremental",       unit: "in"  },
  {id: 64,  name: "Evaporation, pan increment",       unit: "in"  },
  {id: 48,  name: "Discharge, power generation",      unit: "cfs" },
  {id: 70,  name: "Discharge, pumping",               unit: "cfs" },
  {id: 71,  name: "Discharge, spillway",              unit: "cfs" },
  {id: 74,  name: "Evaporation, Lake computed",       unit: "cfs" },
  {id: 76,  name: "Reservoir inflow",                 unit: "cfs" },
  {id: 85,  name: "Discharge, control regulating",    unit: "cfs" },
  {id: 93,  name: "Wind, travel length"               unit: "mi"  },
  {id: 94,  name: "Reservoir, top conserv storage",   unit: "af"  },
  {id: 200, name: "Res, ABV top of conserv storage",  unit: "af"  },
  {id: 203, name: "Precipitation, incrmnt 4A-4A",     unit: "in"  }
]

var stationDailySensors = [
  { stationId: 'CLE', sensors: [  6,8,15,22,23,         45,         71,74,76,85              ] },
  { stationId: 'SHA', sensors: [2,6,8,15,22,23,         45,         71,74,76,85,   94,200    ] },
  { stationId: 'ORO', sensors: [2,6,8,15,22,23,         45,            74,76,      94,200,203] },
  { stationId: 'FOL', sensors: [  6,8,15,22,23,         45,      70,71,74,76,85,   94,200    ] },
  { stationId: 'SNL', sensors: [  6,  15,22,23,                           76                 ] },
  { stationId: 'NML', sensors: [  6,8,15,22,23,         45,48,      71,74,76,85,   94,200    ] },
  { stationId: 'EXC', sensors: [  6,  15,22,23,30,31,32,45,               76,      94,200    ] },
  { stationId: 'DNP', sensors: [  6,  15,22,23,         45,               76,      94,200    ] },
  { stationId: 'MIL', sensors: [  6,8,15,22,23,         45,         71,74,76,85,   94,200    ] },
  { stationId: 'PNF', sensors: [  6,8,15,22,23,   31,32,45,   64,         76,   93,94,200,203] },
  { stationId: 'CAS', sensors: [  6,  15,22,                                                 ] },
  { stationId: 'PRR', sensors: [  6,  15,22,            45                                   ] }
]

var isValidStation = function(station) {
  return validStations.indexOf(station.toUpperCase()) > -1
}

var returnResult = function(req, res) {
  var stationId = req.params.stationId
  stationId = stationId.toUpperCase()

  if (isValidStation(stationId)) {
    returnData(req, res, stationId)
  } else {
    returnError(req, res, stationId)
  }
}

var returnData = function(req, res, stationId) {
  fetchData(stationId, function(data) {
    var cleanData = cleanupData(data)
    res.header("Content-Type", "text/plain")
    res.send(cleanData)
  })
}

var returnError = function(req, res, stationId) {
  var errorString = stationId + ' isn\'t a valid station. The only valid stations are: \n'
  for (var i = 0; i < validStations.length; i++) {
    errorString += validStations[i] + ' '
  }
  res.status(404).send(errorString)
}

var fetchData = function(stationId, callback) {
  var startDate = moment().subtract(1, 'year')
  var endDate   = moment().subtract(1, 'day')
  var url = 'http://cdec.water.ca.gov/cgi-progs/queryCSV?station_id=' + stationId + '&sensor_num=015&dur_code=D&start_date=' + startDate.format('YYYY-MM-DD') + '&end_date=' + endDate.format('YYYY-MM-DD') + '&data_wish=View+CSV+Data'

  fetchUrl(url, function(error, meta, body) {
    callback(body.toString())
  })
}

var cleanupData = function(text) {
  var lines = text.split('\n')
  // remove first line
  lines.splice(0, 1)

  for (var i = 0; i < lines.length -1; i++) {
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
  returnResult: returnResult
}