// let ip = require("ip");
let http = require('http');
let https = require('https');
let dns = require('dns');
let fs = require('fs');
let path = require('path');
let request = require('request');
// let axios = require('axios'); // axios/fetch
// let mobile = require('is-mobile'); // axios/fetch
let colors = require('colors');
let mongo = require('mongodb');

//const tls = require('tls');
//tls.DEFAULT_MIN_VERSION = 'TLSv1.2';
//tls.DEFAULT_MAX_VERSION = 'TLSv1.3';
//console.log("TLS,", tls);

/* note, mysql must be installed (npm install mysql) and mysql server running on localhost or elsewhere*/
let { API/*, database*/ } = require('./module/api/api.js'); 
//let { timestamp, EST, military_to_standard, elapsed } = require('./module/api/time.js');

// Generate timestamp now: if full argument is false/undefined,
// timestamp is divided by 1000 to generate linux-length timestamp
function timestamp(full) {
    let date = new Date();
    let timestamp = date.getTime();
    return full ? Math.floor(timestamp) : Math.floor(timestamp / 1000);
}

// Converts string "16:30:02" to "4:30:02PM"
function military_to_standard(time) {
    time = time.split(':'); // convert to array
    let hours = Number(time[0]);
    let minutes = Number(time[1]);
    let seconds = Number(time[2]);
    let timeValue;
    if (hours > 0 && hours <= 12) { timeValue= "" + hours; } else if (hours > 12) { timeValue= "" + (hours - 12); } else if (hours == 0) { timeValue= "12"; }
    timeValue += (minutes < 10) ? ":0" + minutes : ":" + minutes;  // get minutes
    timeValue += (seconds < 10) ? ":0" + seconds : ":" + seconds;  // get seconds
    timeValue += (hours >= 12) ? " PM" : " AM";  // get AM/PM
    return timeValue;
}

// Get time now in EST format
function EST() {
    let timestamp1 = (new Date).toString().split(" ");
    timestamp1[4] = military_to_standard(timestamp1[4]);
    return timestamp1[4]; //timestamp1.filter((s, i) => i < 6).toString().replace(/,/g, ' ');
}

// Generate string "1s", "2h", etc between now and "time" argument
function elapsed( time ) {
    const $SECONDS = Math.abs(timestamp() - time);
    const $iv_table = ["s","min","h","d","mo","y","s","min","h","d","mo","y"];
    const $iv = [$SECONDS,
        ($SECONDS-($SECONDS%60))/60,
        ($SECONDS-($SECONDS%3600))/3600,
        ($SECONDS-($SECONDS%(3600*24)))/(3600*24),
        ($SECONDS-($SECONDS%(3600*24*30)))/(3600*24*30),
        ($SECONDS-($SECONDS%(3600*24*30*12)))/(3600*24*30*12)];
    for (let $i = 5; $i >= 0; $i--) {
        $r = $iv[$i];
        if ($r > 0) {
            if (($r > 1 || $r == 0))
                $i += 6;
            return $r + "" + $iv_table[$i];
        }
    }
}

process.env.node_env = "production";

// replace xx.xx.xx.xxx with your own remote IP address or localhost (127.0.0.1)
const ip = '45.56.83.20';
const port = process.env.node_env === 'production' ? 443 : 3000;
const key = `/etc/letsencrypt/live/infinitesunset.app/privkey.pem`; // privkey.pem;
const cert = `/etc/letsencrypt/live/infinitesunset.app/fullchain.pem`; // cert.pem`;

// const chain = ["/var/www/infinitesunset.app/infinitesunset.app.chain.crt"];

const options = {
    //ca: chain,
    key: fs.readFileSync(key),
    cert: fs.readFileSync(cert)
};

/*
    ca: [
        fs.readFileSync('etc/letsencrypt/live/root_ca.crt'),
        fs.readFileSync('path/to/ca_bundle_certificate.crt')
     ]
*/

// Handle redirects from http to https
http.createServer((request, response) => {
    // remote IP
    let ip = request.connection.remoteAddress;
    // console.log("Redirecting from HTTP to HTTPS;");
    // console.log(`${ip} HTTP request.url was = `, request.url);
    response.writeHead(303, { Location: `https://www.infinitesunset.app/${request.url}` })
    response.end()
}).listen(80);

https.createServer(options, function(request, response) {

    // remote IP
    let ip = request.connection.remoteAddress;

    // block IP addresses
    if (ip === "::ffff:27.124.3.24" || ip === "5.8.16.163" || ip === "186.77.192.171") {
        console.log(`${ip} Server error 500 <this IP address is blocked>`);
        console.log(request.url);
        //response.writeHead(500);
        //response.end('Server error: ' + error.code + ' ..\n');
        let responses = ["woof woof", "meow meow", "okay okay"];
        response.end('meow meow purrr purrr', 'utf-8');
    }

    // is this mobile?
    // let is_mobile = mobile(request);

    //if (ip === "74.218.210.164")
        //console.log('\x1b[36m%s\x1b[0m', `${ip} request ${request.url}`);
    //else

    let newsletter = "";

    // Only if it's not my own IP address
    //if (request.connection.remoteAddress !== "74.218.210.163")
        // Only show HTML files
        if ((request.url.includes(".html") || request.url.includes(".pdf")) && // only log .html content pages
            !request.url.includes("404.html")) { // skip 404.html logs

                
            //axios.get(`https://ipinfo.io/${request.connection.remoteAddress}/?token=51f794932f040f`).then(response => {
                /* console.log(response.data.city);
                console.log(response.data.region);
                console.log(response.data.country);
                console.log(response.data.loc);
                console.log(response.data.postal);
                console.log(response.data.org);
                console.log(response.data.hostname);
                console.log(response.data.timezone); */
                //if (newsletter) newsletter = "[newsletter]";

                // remove everything after ?
                if (request.url.includes("?")) request.url = request.url.split("?")[0];

                //let { city, region, country, hostname } = response.data;
                let city = 1;
                let region = 1;
                let country = 1;
                let hostname = 1;
                //let first = `[${is_mobile?"Mobile":"PC"}] ${where} `;
                let loca = `${city} ${region}`;
                loca = loca.cyan;

                if (request.url.includes(".pdf")) {
                    let download = ip + " " + request.url;
                    fs.appendFile('/var/www/infinitesunset.app/downloads.txt', download + "\r\n", function (err) {
                        // Skip logging PDFs, at least for now (server is focusing on more important tokens)
                        // console.log(EST().brightYellow + " " + ip + " " + request.url.brightCyan);
                    });

                } else {
                    console.log(ip + " " + newsletter + loca.cyan + " " + country.brightMagenta + " " + request.url);
                }
            //});
        }

    // response.writeHead(301, { Location: `https://${request.url}` })

    let filename = '.' + request.url;
    if (filename == './') filename = './index.html';
    if (filename.includes("?")) {
        filename = filename.split("?")[0];
        //let uri = filename = filename.split("?")[1];
        // console.log("? sign removed everything after; became ===> " + filename);
    }

    let extension = String(path.extname(filename)).toLowerCase();

    let mime = { '.html': 'text/html',
                 '.css' : 'text/css',
                 '.js'  : 'text/javascript',
                 '.php' : 'text/php',
                 '.json': 'application/json',
                 '.pdf' : 'application/pdf',
                 '.png' : 'image/png',
                 '.ico' : 'image/ico',
                 '.jpg' : 'image/jpg',
                 '.gif' : 'image/gif' }

    let contentType = mime[extension] || ''; // application/octet-stream

    // API.initSales(); // Initialize a variable for tracking sales

    fs.readFile(filename, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                if (API.catchAPIrequest( request.url )) {
                    // console.log(`${ip} API request... ${request.url}`);
                    API.exec(request, response);
                } else {
                    // console.log(`${ip} Entity not found; send 404.html...`);
                    fs.readFile('./404.html', function (error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8') });
                }
            } else {
                console.log(`${ip} Server error 500`);
                response.writeHead(500)
                response.end('Server error: ' + error.code + ' ..\n');
                response.end();
            }
        } else {
            // console.log(`${ip} Found physical entity (directory or file...)`);
            response.writeHead(200, { 'Content-Type': contentType });
            // axios.get(`https://ipinfo.io/${request.connection.remoteAddress}/?token=51f794932f040f`).then(r => {
                //let co = "";
                //if (r.data.country == "IN") co = "IN";
                response.end(content, 'utf-8');
            // });
        }
    });

}).listen(port, ip);

//process.on('exit', function () { /*database.connection.end();*/ console.log('process.exit'); });
//process.on('SIGINT', function () { console.log('Ctrl-C...'); /*database.connection.end();*/ process.exit(2) });
//process.on('uncaughtException', function(e) { /*console.log(e.stack); database.connection.end();*/ process.exit(99); });

console.log('Server running at https://' + ip + ':' + port + '/');

//setTimeout(event => { // Wait two seconds, then get total.txt
    /*
    request('https://www.javascriptteacher.com/api/sales/init', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body)
        } else {
          console.log("Error "+response.statusCode);
        }
    })
    */
//}, 1000);
