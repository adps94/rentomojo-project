var request = require('request');
var jsdom = require("jsdom");
var csvWriter = require('csv-write-stream');
var fs = require('fs');
var async = require('async');

var START_URL = "https://medium.com";

var pagesToVisit = [];
var concurrencyCount = 1;
var requestPosition = 0;

// Trigger request to url's
function startFetching(){
  var q = async.queue(function (url, callback) {
    console.log('GET '+url+'\n');
    request(url, function(error, response, body) {
      if(!response){
        console.log('Network Error');
      } else {
        console.log('\n---------------------------------------------------------------');
        console.log(response.statusCode +' Response from ' +response.request.uri.href);
        console.log('---------------------------------------------------------------');
        callback();
      }
    });
  }, 5);

  // Assign a callback
  q.drain = function() {
    console.log('All hyperlinks have been processed');
    var csvOut = {
      hyperlinks : pagesToVisit
    };
    var writer = csvWriter();
    writer.pipe(fs.createWriteStream('output.csv'));
    writer.write(csvOut);
    writer.end();
  }

  // Add urls to the queue
  for (var i = 0; i < pagesToVisit.length; i++) {
    requestPosition = i;
    q.push(pagesToVisit[i], function (err) {

    });
  }
}

// Parse hyperlinks from html body
function parseBodyText(dom){
  // for relative paths
  var relativeLinks = dom.window.document.querySelectorAll("a[href^='/']");
  for(var i=0, loopLen=relativeLinks.length; i<loopLen; i++){
    pagesToVisit.push(START_URL + relativeLinks[i].href);
  }
  // for absolute paths
  var absoluteLinksHttps = dom.window.document.querySelectorAll("a[href^='https']");
  for(var i=0, loopLen=absoluteLinksHttps.length; i<loopLen; i++){
    pagesToVisit.push(absoluteLinksHttps[i].href);
  }
  var absoluteLinksHttp = dom.window.document.querySelectorAll("a[href^='http']");
  for(var i=0, loopLen=absoluteLinksHttp.length; i<loopLen; i++){
    pagesToVisit.push(absoluteLinksHttp[i].href);
  }
}

// Get hyperlnks from start url
console.log('\n Get all hyperlinks from : ',START_URL,'\n');
request(START_URL, function(error, response, body) {
    if(!response){
      console.log('Network Error');
    }else {
      var JSDOM = jsdom.JSDOM;
      var dom = new JSDOM(body);
      parseBodyText(dom);
      console.log('\n Total '+pagesToVisit.length+' hyperlinks \n');
      console.log('\n Trigger first five requests \n');
      startFetching();
    }
});
