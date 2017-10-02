var request = require('request');
var jsdom = require("jsdom");
var csvWriter = require('csv-write-stream');
var fs = require('fs');

var START_URL = "https://medium.com";

var pagesToVisit = [];
var concurrencyCount = 1;
var requestPosition = 0;

function parseBodyText(dom){
  var relativeLinks = dom.window.document.querySelectorAll("a[href^='/']");
  for(var i=0, loopLen=relativeLinks.length; i<loopLen; i++){
    pagesToVisit.push(START_URL + relativeLinks[i].href);
  }
  var absoluteLinksHttps = dom.window.document.querySelectorAll("a[href^='https']");
  for(var i=0, loopLen=absoluteLinksHttps.length; i<loopLen; i++){
    pagesToVisit.push(absoluteLinksHttps[i].href);
  }
  var absoluteLinksHttp = dom.window.document.querySelectorAll("a[href^='http']");
  for(var i=0, loopLen=absoluteLinksHttp.length; i<loopLen; i++){
    pagesToVisit.push(absoluteLinksHttp[i].href);
  }
}

console.log('\n Get all hyperlinks from : ',START_URL,'\n');
request(START_URL, function(error, response, body) {
    // Check status code (200 is HTTP OK)
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

function startFetching(){
  for (var i = 0; i < 5; i++) {
    fireRequest(pagesToVisit[requestPosition]);
    requestPosition++;
  }
}


function fireRequest(url){
  console.log('GET '+url+'\n');
  concurrencyCount++;
  request(url, function(error, response, body) {
    if(!response){
      console.log('Network Error');
    } else {
      console.log('\n---------------------------------------------------------------');
      console.log(response.statusCode +' Response from ' +response.request.uri.href);
      console.log('---------------------------------------------------------------');
      concurrencyCount--;
      requestPosition++;
      if(requestPosition < pagesToVisit.length && concurrencyCount < 6){
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
