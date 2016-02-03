function parseDate(dateStr) {
	var d = new Date(dateStr)
	var tzOffset = d.getTimezoneOffset()

	if (tzOffset) {
		var newTime = d.getTime()
		newTime += tzOffset * 60 * 1000
		d.setTime(newTime)
	}
	return d.toJSON().substr(0, 10)
}

function compare(a, b) {
	if (a < b) {
		return -1
	} else if (a > b) {
		return 1
	} else {
		return 0
	}
}

var sources = {
	"wapo": {name: "Washington Post", id: "ZaDH9VkMSo"},
	"guardian": {name: "The Counted", id: "382368K6Bkx"},
	"fe": {name: "Fatal Encounters", id: "1rZPfKbUtxa"},
}
if (process.env.NU_DEBUG) {
    sources = {
        "wapo": {name: "Washington Post", id: "50GeLDyATJG"},
        "guardian": {name: "The Counted", id: "2GOt9AGkmZu"},
        "fe": {name: "Fatal Encounters", id: "wEi0fKfEwR"},
    }
}

function processDependencies(dependencies) {
	var results = []
	function addResult(date, state, name, cause, version, rowIdx, source) {
		var sourceInfo = sources[source]
		var link = "https://numeracy.co/projects/" + sourceInfo.id + "/versions/" + String(version) + "?sel=A" + String(rowIdx)
		results.push([date, state, name, cause, sources[source].name, link])
	}

    var wapoDepend = dependencies[sources.wapo.id]
	var wapoVersion = wapoDepend.project.currentVersion.id
	var wapoWorkbook = wapoDepend.workbook
	var wapoWorksheet = wapoWorkbook.sheets[0]
	for (var rowIdx = 2; rowIdx <= wapoWorksheet.maxRow; rowIdx++) {
		var row = wapoWorksheet.rows[rowIdx]
		var date = parseDate(row.cells[3].v)
		var state = row.cells[10].v
		var name = row.cells[2].v
		var cause = row.cells[4].v
		addResult(date, state, name, cause, wapoVersion, rowIdx, "wapo")
	}

    var guardianDepend = dependencies[sources.guardian.id]
    var guardianVersion = guardianDepend.project.currentVersion.id
    var guardianWorkbook = guardianDepend.workbook
    var guardianWorksheet = guardianWorkbook.sheets[0]
    for (var rowIdx = 2; rowIdx <= guardianWorksheet.maxRow; rowIdx++) {
        var row = guardianWorksheet.rows[rowIdx]
        var date = parseDate(row.cells[6].v + " " + row.cells[7].v + " " + row.cells[8].v)
        var state = row.cells[11].v
        var name = row.cells[2].v
        var cause = row.cells[12].v
        addResult(date, state, name, cause, guardianVersion, rowIdx, "guardian")
    }

    var feDepend = dependencies[sources.fe.id]
    var feVersion = feDepend.project.currentVersion.id
    var feWorkbook = feDepend.workbook
    var feWorksheet = feWorkbook.sheets[0]
    for (var rowIdx = 2; rowIdx <= feWorksheet.maxRow; rowIdx++) {
        var row = feWorksheet.rows[rowIdx]
        var date = parseDate(row.cells[7].v)
        var year = Number(date.substr(0, 4))
        if (year < 2015) {
            continue
        }
        var state = row.cells[10].v
        var name = row.cells[2].v
        var cause = row.cells[14].v
        addResult(date, state, name, cause, feVersion, rowIdx, "fe")
    }

	results.sort(function(a, b) {
		return compare(a[0], b[0]) || compare(a[1], b[1]) || compare(a[2], b[2]) || compare(a[4], b[4])
	})
	results.splice(0, 0, ["Date", "State", "Name", "Cause of Death", "Source", "Link"])
    var res = ""
	for (var i=0; i < results.length; i++) {
		var result = results[i]
        res += result.join("\t") + "\n"
	}
    return res
}

function requestHandler(req, resp) {
    var body = ""
    req.on("readable", function() {
        var available = req.read()
        if (available) {
            body += available
        }
    })
    req.on("end", function() {
        var params = JSON.parse(body)
        resp.write(processDependencies(params.dependencies))
        resp.end();
    })
}

module.exports = {
    handler: requestHandler,
}
