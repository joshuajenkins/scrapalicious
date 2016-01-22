var express   = require('express')
var app       = express()
var fetchUrl  = require('fetch').fetchUrl
var moment    = require('moment')

var validStations = ['CLE', 'SHA', 'ORO', 'FOL', 'SNL', 'NML', 'EXC', 'DNP', 'MIL', 'PNF', 'CAS', 'PRR']

// sensors that supply daily historic data
// sensors that supply only hourly, weekly, monthly, or event data are omitted
var dailySensors = [
  { id:         2,
    shortName:  "precip-accumulated",
    name:       "Precipitation, accumulated",
    unit:       "in"
  },
  { id:         6,
    shortName:  "reservoir-elevation",
    name:       "Reservoir elevation",
    unit:       "ft"
  },
  { id:         8,
    shortName:  "full-natural-flow",
    name:       "Full natural flow",
    unit:       "cfs"
  },
  { id:         15, 
    shortName:  "reservoir-storage",
    name:       "Reservoir storage",
    unit:       "af"
  },
  { id:         22,
    shortName:  "reservoir-storage-change",
    name:       "Reservoir, storage change",
    unit:       "af"
  },
  { id:         23,
    shortName:  "reservoir-outflow",
    name:       "Reservoir outflow",
    unit:       "cfs"
  },
  { id:         30,
    shortName:  "avg-temp",
    name:       "Temperature, air average",
    unit:       "degf"
  },
  { id:         31,
    shortName:  "max-temp",
    name:       "Temperature, air maximum",
    unit:       "degf"
  },
  { id:         32,
    shortName:  "min-temp",
    name:       "Temperature, air minimum",
    unit:       "degf"
  },
  { id:         45,
    shortName:  "precip-incremental",
    name:       "Precipitation, incremental",
    unit:       "in"
  },
  { id:         64,
    shortName:  "evaporation-pan-increment",
    name:       "Evaporation, pan increment",
    unit:       "in"
  },
  { id:         48,
    shortName:  "discharge-power-gen",
    name:       "Discharge, power generation",
    unit:       "cfs"
  },
  { id:         70,
    shortName:  "discharge-pumping",
    name:       "Discharge, pumping",
    unit:       "cfs"
  },
  { id:         71,
    shortName:  "discharge-spillway",
    name:       "Discharge, spillway",
    unit:       "cfs"
  },
  { id:         74,
    shortName:  "evaporation-lake-computed",
    name:       "Evaporation, Lake computed",
    unit:       "cfs"
  },
  { id:         76,
    shortName:  "reservoir-inflow",
    name:       "Reservoir inflow",
    unit:       "cfs"
  },
  { id:         85,
    shortName:  "discharge-control-regulating",
    name:       "Discharge, control regulating",
    unit:       "cfs"
  },
  { id:         93,
    shortName:  "wind-travel-length",
    name:       "Wind, travel length",
    unit:       "mi"
  },
  { id:         94,
    shortName:  "reservoir-top-conserv-storage",
    name:       "Reservoir, top conserv storage",
    unit:       "af"
  },
  { id:         200,
    shortName:  "reservoir-abv-top-conserv-storage",
    name:       "Res, ABV top of conserv storage",
    unit:       "af"
  },
  { id:         203,
    shortName:  "precip-incremental-4a-4a",
    name:       "Precipitation, incrmnt 4A-4A",
    unit:       "in"
  }
]

var stationDailySensors = {
  CLE: [  6,8,15,22,23,         45,         71,74,76,85              ],
  SHA: [2,6,8,15,22,23,         45,         71,74,76,85,   94,200    ],
  ORO: [2,6,8,15,22,23,         45,            74,76,      94,200,203],
  FOL: [  6,8,15,22,23,         45,      70,71,74,76,85,   94,200    ],
  SNL: [  6,  15,22,23,                           76                 ],
  NML: [  6,8,15,22,23,         45,48,      71,74,76,85,   94,200    ],
  EXC: [  6,  15,22,23,30,31,32,45,               76,      94,200    ],
  DNP: [  6,  15,22,23,         45,               76,      94,200    ],
  MIL: [  6,8,15,22,23,         45,         71,74,76,85,   94,200    ],
  PNF: [  6,8,15,22,23,   31,32,45,   64,         76,   93,94,200,203],
  CAS: [  6,  15,22,                                                 ],
  PRR: [  6,  15,22,            45                                   ]
}

var handler = function(req, res) {
  // parse params
  // call func
  // render resp
}

var isValidStation = function(station) {
  return validStations.indexOf(station.toUpperCase()) > -1
}

var stationHasDailySensor = function(station, sensor) {
 return stationDailySensors[station].indexOf(sensor) > -1
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