/*** modules ***/
	var http = require("http")
	var fs   = require("fs")
	var qs   = require("querystring")
	var main = require("./main/logic")

/*** server ***/
	var port = main.getEnvironment("port")
	var server = http.createServer(handleRequest)
		server.listen(port, function (error) {
			if (error) { main.logError(error) }
			else { main.logStatus("listening on port " + port) }
		})

/*** handleRequest ***/
	function handleRequest(request, response) {
		// collect data
			var data = ""
			request.on("data", function (chunk) { data += chunk })
			request.on("end", parseRequest)

		/* parseRequest */
			function parseRequest() {
				try {
					// get request info
						request.get    = qs.parse(request.url.split("?")[1]) || {}
						request.path   = request.url.split("?")[0].split("/") || []
						request.url    = request.url.split("?")[0] || "/"
						request.post   = data ? JSON.parse(data) : {}
						request.cookie = request.headers.cookie ? qs.parse(request.headers.cookie.replace(/; /g, "&")) : {}
						request.ip     = request.headers["x-forwarded-for"] || request.connection.remoteAddress || request.socket.remoteAddress || request.connection.socket.remoteAddress
						request.bot    = main.isBot(request.headers["user-agent"]) || false

					// log it
						if (request.url !== "/favicon.ico") {
							main.logStatus((request.cookie.session || "new") + " @ " + request.ip + "\n[" + request.method + "] " + request.path.join("/") + "\n" + JSON.stringify(request.method == "GET" ? request.get : request.post))
						}

					// where next ?
						routeRequest()
				}
				catch (error) { _403("unable to parse request") }
			}

		/* routeRequest */
			function routeRequest() {
				try {
					// assets
						if (request.method == "GET") {
							switch (true) {
								// logo
									case (/\/favicon[.]ico$/).test(request.url):
									case (/\/icon[.]png$/).test(request.url):
									case (/\/logo[.]png$/).test(request.url):
									case (/\/apple\-touch\-icon[.]png$/).test(request.url):
									case (/\/apple\-touch\-icon\-precomposed[.]png$/).test(request.url):
									case (/\/banner[.]png$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "image/png"})
											fs.readFile("./main/logo.png", function (error, file) {
												if (error) { _404(error) }
												else { response.end(file, "binary") }
											})
										}
										catch (error) { _404(error) }
									break

								// stylesheet
									case (/\/stylesheet[.]css$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "text/css"})
											fs.readFile("./main/stylesheet.css", "utf8", function (error, data) {
												if (error) { _403(error) }
												else { response.end(data) }
											})
										}
										catch (error) { _404(error) }
									break

								// script
									case (/\/script[.]js$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "text/javascript"})
											fs.readFile("./main/script.js", "utf8", function (error, data) {
												if (error) { _403(error)
												}
												else { response.end("window.onload = function() { \n" + data + "\n}") }
											})
										}
										catch (error) { _404(error) }
									break

								// main
									case (/^\/$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "text/html; charset=utf-8"})
											main.renderHTML(request, "./main/index.html", function (html) {
												response.end(html)
											})
										}
										catch (error) { _403(error) }
									break

								// others
									default:
										_302()
									break
							}
						}

					// post
						else if (request.method == "POST" && request.post.action) {
							switch (request.post.action) {
								// main
									case "findGames":
										try {
											response.writeHead(200, {"Content-Type": "text/json"})
											main.findGames(request, function (data) {
												response.end(JSON.stringify(data))
											})
										}
										catch (error) { _403(error) }
									break

								// others
									default:
										_403()
									break
							}
						}

					// others
						else { _403("unknown route") }
				}
				catch (error) { _403("unable to route request") }
			}

		/* _302 */
			function _302(data) {
				main.logStatus("redirecting to /")
				response.writeHead(302, { Location: data || "../../../../" })
				response.end()
			}

		/* _403 */
			function _403(data) {
				main.logError(data)
				response.writeHead(403, { "Content-Type": "text/json" })
				response.end( JSON.stringify({success: false, error: data}) )
			}

		/* _404 */
			function _404(data) {
				main.logError(data)
				response.writeHead(404, { "Content-Type": "text/plain" })
				response.end("404: page not found")
			}

	}
