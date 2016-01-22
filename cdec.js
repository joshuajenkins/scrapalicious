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
  SNL: [  6,  15,22,                                                 ],
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
  var validStation
  var validSensor
  var resp

  var sensorId
  var sensorName = req.params.sensorName
  var stationId = req.params.stationId
  stationId = stationId.toUpperCase()

  if (isValidStation(stationId)) {
    validStation = true
    sensorId = stationHasDailySensor(stationId, sensorName)
    validSensor = sensorId > -1
  } else {
    validStation = false
  }

  // process data
  if (validStation && validSensor) {
    // do work
    var remoteData = fetchData(stationId, sensorId, function(remoteString) {
      resp = cleanupData(remoteString, sensorId)
      res.header("Content-Type", "text/plain")
      res.send(resp)
    })
  } else {
    // make more descriptive
    resp = "Invalid station or sensor, here are the valid stations and sensors"
    res.status(404).send(resp)
  }
  
}

var isValidStation = function(station) {
  return validStations.indexOf(station.toUpperCase()) > -1
}

var stationHasDailySensor = function(station, sensorShortName) {
  var shortNameIsValid = false
  var sensorId

  for (var i = 0; i < dailySensors.length; i++) {
    if (dailySensors[i].shortName == sensorShortName) {
      shortNameIsValid = true
      sensorId = dailySensors[i].id
      break
    }
  }

  if (shortNameIsValid) {
    if (stationDailySensors[station].indexOf(sensorId) > -1) {
      return sensorId
    } else {
      return -1
    }
  } else {
    return -1
  }
}

var fetchData = function(stationId, sensorId, callback) {
  var startDate = moment().subtract(1, 'year')
  var endDate   = moment().subtract(1, 'day')
  var sensorIdString = '000' + sensorId
  sensorIdString = sensorIdString.substr(-3)
  var url = 'http://cdec.water.ca.gov/cgi-progs/queryCSV?station_id=' + stationId + '&sensor_num=' + sensorIdString + '&dur_code=D&start_date=' + startDate.format('YYYY-MM-DD') + '&end_date=' + endDate.format('YYYY-MM-DD') + '&data_wish=View+CSV+Data'

  fetchUrl(url, function(error, meta, body) {
    callback(body.toString())
  })
}

var cleanupData = function(text, sensorId) {
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
  var unitHeading
  for (var i = 0; i < dailySensors.length; i++) {
    if (dailySensors[i].id == sensorId) {
      unitHeading = dailySensors[i].name + ' (' + dailySensors[i].unit + ')'
    }
  }
  lines[0] = 'Date,' + unitHeading

  return lines.join('\n')
}

module.exports = {
  handler: handler
}