var request = require('request');
var jsdom = require("jsdom");
var csvWriter = require('csv-write-stream');
var fs = require('fs');

var START_URL = "https://medium.com";

var pagesToVisit = [];
var requestPosition = 0;

// Trigger request to url's

function fireRequest(url){
  console.log('GET '+url+'\n');
  request(url, function(error, response, body) {
    if(!response){
      console.log('Network Error');
    } else {
      console.log('\n---------------------------------------------------------------');
      console.log(response.statusCode +' Response from ' +response.request.uri.href);
      console.log('---------------------------------------------------------------');
      requestPosition++;
      if(requestPosition < pagesToVisit.length){
        fireRequest(pagesToVisit[requestPosition]);
      }else {
        var csvOut = {
          hyperlinks : pagesToVisit
        };
        var writer = csvWriter();
        writer.pipe(fs.createWriteStream('output.csv'));
        writer.write(csvOut);
        writer.end();
        return;
      }
    }
  });
}

// Initiate first 5 requests

function startFetching(){
  for (var i = 0; i < 5; i++) {
    fireRequest(pagesToVisit[requestPosition]);
    requestPosition++;
  }
}

// Parse hyperlinks from html body.

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

// Fetch all hyperlinks from START_URL

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
