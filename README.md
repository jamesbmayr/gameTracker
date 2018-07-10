# gamesTimeline
see how videogame series perform over time: https://www.gamestimeline.herokuapp.com

<pre style='line-height: 1; text-align: center'>
       •        
  •••   • ••••• 
 •   • •  • • • 
 •      •   •   
 •  •• •    •   
 •   •  •   •   
  •••  •    •   
        •       
 •••••••••••••• 
 •            • 
 •  •     • • • 
 • ••• ••     • 
 •  •     • • • 
 •            • 
 •••••••••••••• 
                
</pre>
<hr>

# Resources
- built in node.JS, Javascript, and HTML Canvas
- font provided by Google Fonts: https://fonts.googleapis.com/css?family=Press+Start+2P
- all information provided by the Internet Games DataBase: https://www.igdb.com/


<hr>

# App Structure
<pre>
|- package.json
|- index.js (handleRequest, parseRequest, routeRequest; _302, _403, _404)
|
|- /main/
    |- logic.js (logError, logStatus, logMessage; getEnvironment, getAsset; isBot, renderHTML, sanitizeString; findGames, findGamesInfo, filterGames)
    |- index.html
    |- stylesheet.css
    |- script.js (submitForm, sendPost, receiveData; resizeWindow, drawCanvas, displayInfo; getDistance, getTrend, getPoints)
    |- logo.png
</pre>
