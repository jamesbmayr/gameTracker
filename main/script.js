/*** globals ***/
	/* data */
		var data = {
			games:  [],
			trend:  {},
			points: []
		}
		window.data = data

	/* navbar */
		var button = document.querySelector("#search-button")
		var input  = document.querySelector("#search-field")

	/* canvas */
		var info   = document.querySelector("#info")
		var canvas = document.querySelector("#canvas")
		var context = canvas.getContext("2d")

/*** search ***/
	/* onload */
		if (location.hash) {
			input.value = decodeURI(location.hash.slice(1))
			submitForm()
		}

	/* submitForm */
		document.querySelector("#search").addEventListener("submit", submitForm)
		function submitForm(data) {
			// update hash
				location.hash = "#" + encodeURI(input.value)

			// loading spinner
				button.setAttribute("loading", true)

			// get data
				sendPost({
					action: "findGames",
					search: (input.value || "")
				}, receiveData)
		}

	/* sendPost */
		function sendPost(post, callback) {
			var request = new XMLHttpRequest()
				request.open("POST", location.pathname, true)
				request.onload = function() {
					if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
						callback(JSON.parse(request.responseText))
					}
					else {
						console.log({success: false, readyState: request.readyState, message: request.status})
					}
				}

				request.send(JSON.stringify(post))
		}

	/* receiveData */
		function receiveData(response) {
			// save data
				data.games  = response.data
				data.trend  = getTrend(data.games)
				data.points = getPoints(data.games, data.trend)

			// canvas
				drawCanvas(data)

			// loading spinner
				button.removeAttribute("loading")
		}

/*** canvas ***/		
	/* resizeWindow */
		resizeWindow()
		window.addEventListener("resize", resizeWindow)
		function resizeWindow(event) {
			// set dimensions
				canvas.height = window.innerHeight
				canvas.width  = window.innerWidth

			// redraw
				data.trend  = getTrend(data.games)
				data.points = getPoints(data.games, data.trend)
				drawCanvas(data)
		}

	/* rotateCanvas */
		function rotateCanvas(x, y, degrees, callback) {
			// rotate
				context.translate(x, y)
				context.rotate(degrees * Math.PI / 180)
				context.translate(-x, -y)

			// do whatever
				callback()

			// rotate back
				context.translate(x, y)
				context.rotate(-degrees * Math.PI / 180)
				context.translate(-x, -y)
		}

	/* drawCanvas */
		function drawCanvas(data) {
			// clear
				context.clearRect(0, 0, canvas.width, canvas.height)

			if (data.points.length || true) {
				// draw axes
					context.beginPath()
					context.strokeStyle = "#333333"
					context.lineWidth = 5
					context.moveTo(100, 150)
					context.lineTo(100, canvas.height - 100)
					context.lineTo(canvas.width - 100, canvas.height - 100)
					context.stroke()

				// label axes
					context.font = "30px 'Press Start 2P', monospace"
					context.fillStyle = "#333333"
					context.textAlign = "center"
					context.fillText("release date", canvas.width / 2, canvas.height - 25)
					rotateCanvas(canvas.width / 2, canvas.height / 2, 90, function() {
						context.fillText("rating", (canvas.width / 2) + 25, (canvas.height / 2) + (canvas.width / 2) - 25)
					})

				// label x-axis values
					context.font = "10px 'Press Start 2P', monospace"
					context.fillStyle = "#333333"
					context.textAlign = "left"

					for (var i = getRounded(data.trend.min + 2.5, 5); i < data.trend.max; i += 5) {
						var x = 100 + ((i - data.trend.min) * (canvas.width - 200) / data.trend.range)
						context.fillText(1970 + i, x, canvas.height - 85)
					}

				// label y-axis values
					context.font = "10px 'Press Start 2P', monospace"
					context.fillStyle = "#333333"
					context.textAlign = "right"

					for (var i = 0; i <= 100; i += 25) {
						var y = canvas.height - 95 - (i * (canvas.height - 250) / 100)
						context.fillText(i, 95, y)
					}

				// draw trendline
					if (data.trend.start) {
						context.beginPath()
						context.strokeStyle = "#773333"
						context.lineWidth = 5
						context.moveTo(data.trend.start.x, data.trend.start.y)
						context.lineTo(data.trend.end.x,   data.trend.end.y)
						context.stroke()
					}
					
				// draw lines
					context.beginPath()
					context.strokeStyle = "#333377"
					context.lineWidth = 3
					for (var p in data.points) {
						if (!p) {
							context.moveTo(data.points[p].x, data.points[p].y)
						}
						else {
							context.lineTo(data.points[p].x, data.points[p].y)
						}
					}
					context.stroke()

				// draw points
					for (var p in data.points) {
						context.beginPath()
						context.fillStyle = "#337733"
						context.arc(data.points[p].x, data.points[p].y, 5, 0, 2 * Math.PI)
						context.fill()

						context.font = "8px 'Press Start 2P', monospace"
						context.fillStyle = "#77aa77"
						context.textAlign = "left"
						rotateCanvas(data.points[p].x, data.points[p].y, 90, function() {
							context.fillText(data.points[p].name, data.points[p].x + 16, data.points[p].y + 4)	
						})
					}
			}
		}

	/* displayInfo */
		document.querySelector("#canvas").addEventListener("mousemove", displayInfo)
		function displayInfo(event) {
			// coordinates
				var x = event.clientX
				var y = event.clientY

			// already displayed?
				if (info.getAttribute("visible") && info.getAttribute("game-id")) {
					var point = data.points.find(function (point) {
						return point.id == info.getAttribute("game-id")
					}) || {}

					if (getDistance(x, y, point.x, point.y) > 10) {
						info.removeAttribute("visible")
						info.removeAttribute("game-id")
						info.querySelector("#info-name").innerText = ""
						info.querySelector("#info-name").href = "#"
						info.querySelector("#info-date").innerText = ""
						info.querySelector("#info-rating").innerText = ""
						info.querySelector("#info-image").style.backgroundImage = "url()"
					}
				}

			// none displayed
				else {
					for (var p in data.points) {
						if (getDistance(x, y, data.points[p].x, data.points[p].y) < 10) {
							var game = data.games.find(function (game) {
								return game.id == data.points[p].id
							})
							break
						}
					}

					if (game) {
						info.setAttribute("visible", true)
						info.setAttribute("game-id", game.id)
						info.style.left = x + "px"
						info.style.top  = y + "px"
						info.querySelector("#info-name").innerText = game.name
						info.querySelector("#info-name").href = game.url
						info.querySelector("#info-date").innerText = new Date(game.date).toLocaleString().split(/[,\s]/gi)[0]
						info.querySelector("#info-rating").innerText = game.rating.toFixed(0) + "/100"
						info.querySelector("#info-image").style.backgroundImage = "url(" + game.image + ")"
					}
				}
		}

/*** math ***/
	/* getDistance */
		function getDistance(x1, y1, x2, y2) {
			return Math.pow(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2), 0.5)
		}

	/* getTrend */
		function getTrend(games) {
			// empty variables
				var count = 0
				var sumX  = 0
				var sumY  = 0
				var sumXX = 0
				var sumYY = 0
				var sumXY = 0
				var min   =  1000
				var max   = -1000

			// loop through games to get values
				for (var g in games) {
					// years
						var years = (games[g].date / 1000 / 60 / 60 / 24 / 365.2425)
						if (years < min) { min = years }
						if (years > max) { max = years }

					// sums
						count += 1
						sumX  += years
						sumY  += games[g].rating
						sumXX += (years * years)
						sumYY += (games[g].rating * games[g].rating)
						sumXY += (years * games[g].rating)
				}

			// get slope & y-intercept
				var slope     = ((count * sumXY) - (sumX * sumY )) / ((count * sumXX) - (sumX * sumX))
				var intercept = (( sumY * sumXX) - (sumX * sumXY)) / ((count * sumXX) - (sumX * sumX))

			// get average
				var average = (sumY || 0) / (count || 1)
				var range = max - min

			// get endpoints
				var start = {
					x: 100,
					y: (canvas.height) - 100 - (( ((slope * min) + intercept) / 100) * (canvas.height - 250))
				}
				var end   = {
					x: (canvas.width - 100),
					y: (canvas.height) - 100 - (( ((slope * max) + intercept) / 100) * (canvas.height - 250))
				}

			// return trend
				return ({
					count: count,
					min: min,
					max: max,
					average: average,
					range: range,
					slope: slope,
					intercept: intercept,
					start: start,
					end: end
				})
		}

	/* getPoints */
		function getPoints(games, trend) {
			// empty points
				var points = []

			// loop through to find (x,y) adjusted for ranges / canvas size
				for (var g in games) {
					var x = (games[g].date / 1000 / 60 / 60 / 24 / 365.2425)
					var y = games[g].rating

						x = (100) + (((x - trend.min) / trend.range) * (canvas.width - 200))
						y = (canvas.height) - 100 - ((y / 100) * (canvas.height - 250))

					points.push({
						x: x,
						y: y,
						id: games[g].id,
						name: games[g].name
					})
				}

			// return points
				return points
		}

	/* getRounded */
		function getRounded(num, nearest) {
			return Math.round(num / nearest) * nearest
		}
