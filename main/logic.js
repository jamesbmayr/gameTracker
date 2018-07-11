/*** modules ***/
	var http  = require("http")
	var https = require("https")
	var fs    = require("fs")
	module.exports = {}

/*** logs ***/
	/* logError */
		module.exports.logError = logError
		function logError(error) {
			console.log("\n*** ERROR @ " + new Date().toLocaleString() + " ***")
			console.log(" - " + error)
			console.dir(arguments)
		}

	/* logStatus */
		module.exports.logStatus = logStatus
		function logStatus(status) {
			console.log("\n--- STATUS @ " + new Date().toLocaleString() + " ---")
			console.log(" - " + status)
		}

	/* logMessage */
		module.exports.logMessage = logMessage
		function logMessage(message) {
			console.log(" - " + new Date().toLocaleString() + ": " + message)
		}

/*** maps ***/
	/* getEnvironment */
		module.exports.getEnvironment = getEnvironment
		function getEnvironment(index) {
			try {
				if (process.env.DOMAIN !== undefined) {
					var environment = {
						port:   process.env.PORT,
						domain: process.env.DOMAIN,
						apikey: process.env.APIKEY
					}
				}
				else {
					var environment = {
						port:    3000,
						domain:  "localhost",
						apikey:  "afa35c5ab9533dbda5bd6403c2d14d40"
					}
				}

				return environment[index]
			}
			catch (error) {
				logError(error)
				return false
			}
		}

	/* getAsset */
		module.exports.getAsset = getAsset
		function getAsset(index) {
			try {
				switch (index) {
					case "logo":
						return "logo.png"
					break
					
					case "google fonts":
						return '<link href="https://fonts.googleapis.com/css?family=Press+Start+2P" rel="stylesheet">'
					break

					case "meta":
						return '<meta charset="UTF-8"/>\
								<meta name="description" content="gamesTimeline lets you see how videogame series perform over time."/>\
								<meta name="keywords" content="game,videogame,rating,track,tracker,play,fun,series"/>\
								<meta name="author" content="James Mayr"/>\
								<meta property="og:title" content="gamesTimeline: see how videogame series perform over time"/>\
								<meta property="og:url" content="https://www.gamestimeline.herokuapp.com"/>\
								<meta property="og:description" content="gamesTimeline lets you see how videogame series perform over time."/>\
								<meta property="og:image" content="https://www.gamestimeline.herokuapp.com/banner.png"/>\
								<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>'
					break

					default:
						return null
					break
				}
			}
			catch (error) {
				logError(error)
				return false
			}
		}

/*** tools ***/
	/* isBot */
		module.exports.isBot = isBot
		function isBot(agent) {
			try {
				switch (true) {
					case (typeof agent == "undefined" || !agent):
						return "no-agent"
					break
					
					case (agent.indexOf("Googlebot") !== -1):
						return "Googlebot"
					break
				
					case (agent.indexOf("Google Domains") !== -1):
						return "Google Domains"
					break
				
					case (agent.indexOf("Google Favicon") !== -1):
						return "Google Favicon"
					break
				
					case (agent.indexOf("https://developers.google.com/+/web/snippet/") !== -1):
						return "Google+ Snippet"
					break
				
					case (agent.indexOf("IDBot") !== -1):
						return "IDBot"
					break
				
					case (agent.indexOf("Baiduspider") !== -1):
						return "Baiduspider"
					break
				
					case (agent.indexOf("facebook") !== -1):
						return "Facebook"
					break

					case (agent.indexOf("bingbot") !== -1):
						return "BingBot"
					break

					case (agent.indexOf("YandexBot") !== -1):
						return "YandexBot"
					break

					default:
						return null
					break
				}
			}
			catch (error) {
				logError(error)
				return false
			}
		}

	/* renderHTML */
		module.exports.renderHTML = renderHTML
		function renderHTML(request, path, callback) {
			try {
				var html = {}
				fs.readFile(path, "utf8", function (error, file) {
					if (error) {
						logError(error)
						callback("")
					}
					else {
						html.original = file
						html.array = html.original.split(/<script\snode>|<\/script>node>/gi)

						for (html.count = 1; html.count < html.array.length; html.count += 2) {
							try {
								html.temp = eval(html.array[html.count])
							}
							catch (error) {
								html.temp = ""
								logError("<sn>" + Math.ceil(html.count / 2) + "</sn>\n" + error)
							}
							html.array[html.count] = html.temp
						}

						callback(html.array.join(""))
					}
				})
			}
			catch (error) {
				logError(error)
				callback("")
			}
		}

	/* sanitizeString */
		module.exports.sanitizeString = sanitizeString
		function sanitizeString(string) {
			try {
				return string.replace(/[^a-zA-Z0-9_\s\!\@\#\$\%\^\&\*\(\)\+\=\-\[\]\\\{\}\|\;\'\:\"\,\.\/\<\>\?]/gi, "")
			}
			catch (error) {
				logError(error)
				return ""
			}
		}

/*** find ***/
	/* findGames */
		module.exports.findGames = findGames
		function findGames(request, callback) {
			// options
				var options = {
					host: "api-endpoint.igdb.com",
					path: "/games/?search=" + encodeURI(sanitizeString(request.post.search)) + "&filter[rating][gt]=0&order=popularity:desc&limit=50",
					method: "GET",
					headers: {
						"user-key": getEnvironment("apikey"),
						"Accept": "application/json"
					}
				}

			// api request
				var apiRequest = https.request(options, function(apiResponse) {
					// receiving data
						var apiData = ""
						apiResponse.setEncoding("utf8")
						apiResponse.on("data", function(chunk) { apiData += chunk })

					// complete
						apiResponse.on("end",  function() {
							try {
								request.gameIds = JSON.parse(apiData).map(function(obj) {
									return obj.id
								})

								findGamesInfo(request, callback)
							} catch (error) {
								logError(error)
								callback({success: false, error: error})
							}
						})
				})

			// error?
				apiRequest.on("error", function (error) {
					logError(error)
					callback({success: false, message: error})
				})

				apiRequest.end()
		}

	/* findGamesInfo */
		module.exports.findGamesInfo = findGamesInfo
		function findGamesInfo(request, callback) {
			// options
				var options = {
					host: "api-endpoint.igdb.com",
					path: "/games/" + request.gameIds.join(","),
					method: "GET",
					headers: {
						"user-key": getEnvironment("apikey"),
						"Accept": "application/json"
					}
				}

			// api request
				var apiRequest = https.request(options, function(apiResponse) {
					// receiving data
						var apiData = ""
						apiResponse.setEncoding("utf8")
						apiResponse.on("data", function(chunk) { apiData += chunk })

					// complete
						apiResponse.on("end",  function() {
							try {
								request.games = filterGames(request, JSON.parse(apiData))

								callback({success: true, data: request.games})
							} catch (error) {
								logError(error)
								callback({success: false, error: error})
							}
						})
				})

			// error?
				apiRequest.on("error", function (error) {
					logError(error)
					callback({success: false, message: error})
				})

				apiRequest.end()
		}

	/* filterGames */
		module.exports.filterGames = filterGames
		function filterGames(request, games) {
			// keywords
				games = games || []
				
				var keywords = request.post.search.split(/\s/gi)
					keywords = keywords.map(function(keyword) {
						return keyword.toLowerCase().replace(/[^A-Za-z0-9]/gi, "")
					})

			// filter results without all keywords
				games = games.filter(function(game) {
					var okay = true
					for (var k in keywords) {
						if (!game.name.toLowerCase().replace(/[^A-Za-z0-9]/gi, "").includes(keywords[k])) { okay = false }
					}
					return okay
				})

			// map results to certain fields
				games = games.map(function(game) {
					return ({
						id:     (game.id                     || null),
						name:   (game.name                   || null),
						date:   (game.first_release_date     || null),
						rating: (game.aggregated_rating      || game.rating || game.total_rating || null),
						image:  (game.cover ? game.cover.url || null : null),
						url:    (game.url                    || null)
					})
				})

			// filter results without a rating or date
				games = games.filter(function(game) {
					return (game.rating && game.date)
				})

			// sort results by release date
				games.sort(function(a, b) {
					return (b.date - a.date)
				})

			return games
		}
