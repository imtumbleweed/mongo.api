// IP address
const ip = require('ip');
// Add mysql drivers
const mysql = require('mysql');
// Standard MD5 hashing algorithm
const md5 = require('./../md5/md5.js');
// Standard FIPS 202 SHA-3 implementation
const { SHA3 } = require('sha3');
// The Keccak hash function is also available
const { Keccak } = require('sha3');
// write to a file
const fs = require('fs');
// axios/fetch
const axios = require('axios');
// console colors
let colors = require('colors');
// image uploads
let multer  = require('multer');



const imageFilter = function(request, file, callback) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        request.fileValidationError = 'Only image files are allowed!';
        return callback(new Error('Only image files are allowed!'), false);
    }
    callback(null, true);
};

let sales_initialized = false;
let total = 0;       // total money made from all book sales (read from /var/www/total.txt on server start up)
let impressions = 0; // ad impressions since last time something was sold (reset every time a book is sold)

// Generate timestamp: if full argument is false/undefined,
// timestamp is divided by 1000 to generate linux-length timestamp
function timestamp(full) {
    let date = new Date();
    let timestamp = date.getTime();
    return full ? Math.floor(timestamp) : Math.floor(timestamp / 1000);
}

// var time = "16:30:00"; // your input
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

// Check if  property with value exists on an object
Object.prototype.exists = function(property_name, value) {
    for (let i = 0; i < this.length; i++) {
        let o = this[i];
        if (o[property_name] != undefined)
            if (o[property_name] == value)
                return true;
    }
    return false;
}

// Check if value exists in array
Array.prototype.exists = function(value) {
     for (let i = 0; i < this.length; i++)
         if (this[i] == value)
             return true;
     return false;
}

class database {
    constructor() { }
    static create() {
        let message = "Creating MySQL connection...";
        this.connection = mysql.createConnection({
            host     : '45.79.79.114', // or localhost
            user     : 'root',
            password : 'Murzik55723105',
            database : 'databasename'
        });
        this.connection.connect();
        console.log(message + "Ok.");
    }
}

// Register email address in database
function action_register_email ( request, payload ) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        if (payload.email_address == "")
            resolve(`{"success": false, "message": "Email address is empty."}`);
        if (payload.email_address) { // Simply write email to a file, for now
            if(/(.+)@(.+){2,}\.(.+){2,}/.test(payload.email_address)) {
                // Email is valid

                // add to statistics
                const ip = request.connection.remoteAddress;
                const year_now = new Date().getFullYear();
                const day_now = day_today();
                const id = `jstnews`;
                const entry1 = `${year_now} ${day_now} ${ip} ${id} ${payload.email_address}\r\n`;
                const dir = `${stats_dir}/${year_now}`;
                const path = `${dir}/log.txt`;
                fs.mkdir(dir, { recursive: true }, error => {
                    fs.appendFile( path, entry1, error => console.log(`[+newsletter] ${entry1}`) )
                });

                //axios.get(`https://ipinfo.io/${request.connection.remoteAddress}/?token=51f794932f040f`).then(response => {
                    console.log("+1 signup by <" + payload.email_address.magenta + ">");// from " + response.data.city + " " + response.data.region + " " + response.data.country);
                    //console.log(response.data.loc);
                    //console.log(response.data.postal);
                    //console.log(response.data.org);
                    //console.log(response.data.hostname);
                    //console.log(response.data.timezone);
                    let entry = `${payload.email_address}`;// : ${request.connection.remoteAddress} : ${response.data.city} : ${response.data.region} : ${response.data.country} : ${response.data.loc} : ${response.data.postal} : ${response.data.timezone} : ${response.data.hostname} : ${response.data.org}`;
                    fs.appendFile('/var/www/javascriptteacher.com/subscribers.txt', entry + "\r\n", function (err) {
                        //console.log(`Email address <${payload.email_address}> was added!`);
                        resolve(`{"success": true, "message": "email address ${payload.email_address} was added"}`);
                    });
                /*}).catch(error => {
                    console.log(error);
                    reject(`{"success": false, "message": "Something went wrong during IP geo-lookup."}`);
                });*/
            } else {
                  console.log(`Sorry email address <${payload.email_address}> is not a valid email address!`);
                  reject(`{"success": false, "message": "Error: wrong request, missing request headers or missing payload."}`);
            }
        }
    });
}

// Requires payload.email_address = <email_address>
function action_register_user ( request, payload ) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        let q = `SELECT email_address FROM user WHERE email_address = '${payload.email_address}' LIMIT 1`;
        database.connection.query(q,
        (error, results) => { // Check if user already exists in database
            if (error)
                throw(error);
            let result = results[0];
            if (results && results.length != 0 && result.email_address == payload.email_address)
                resolve(`{"success": false, "message": "user already exists"}`);
            else {
                let avatar = JSON.stringify({"head": 1, "eyes": 1});
                // Encrypt payload.password with md5 algorithm
                let password_md5 = md5(payload.password);
                let fields = "( `username`, `email_address`, `password_md5`, `first_name`, `last_name`, `avatar` )";
                let values = `VALUES( '${payload.username}', '${payload.email_address}', '${password_md5}', 'first', 'last', '${avatar}')`;
                database.connection.query("INSERT INTO user " + fields + " " + values,
                (error, results) => { // Create new user in database
                    if (error)
                        throw(error);
                    resolve(`{"success": true, "message": "user registered"}`);
                });
            }
        });
    }).catch((error) => { console.log(error) });
}

// Requires payload.id = <Numeric User ID>
function action_get_user ( request, payload ) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        database.connection.query("SELECT * FROM user WHERE id = '" + payload.id + "' LIMIT 1",
        (error, results) => { // Check if user already exists in database
            if (error) throw(error);
            let result = results[0];
            if (results && results.length != 0 && result.id == payload.id) {
                result.found = true;
                resolve(`{"found": true, "user": ${JSON.stringify(result)}, "message": "user found"}`);
            } else
                resolve(`{"found": false, "user": null, "message": "user with this id doesn't exist"}`);
        });
    }).catch(error => console.log(error));
}

function action_get_user_promiseless ( request, payload ) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        database.connection.query("SELECT * FROM user WHERE id = '" + payload.id + "' LIMIT 1",
        (error, results) => { // Check if user already exists in database
            if (error) throw(error);
            let result = results[0];
            if (results && results.length != 0 && result.id == payload.id) {
                resolve(`{"found": true, "user": ${JSON.stringify(result)}, "message": "user found"}`);
            } else
                resolve(`{"found": false, "user": null, "message": "user with this id doesn't exist"}`);
        });
    }).catch(error => console.log(error));
}

function action_delete_user ( request, payload ) {
    return new Promise((resolve, reject) => {
        // Header or payload are missing
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        // Payload must specify user id
        if (!payload.id)
            reject("User id not specified!");
        let query = "DELETE from `user` WHERE `id` = " + payload.id;
        database.connection.query(query, (error, results) => {
            if (error)
                throw(error);
            let result = results[0];
            console.log("results[0] = ", results[0]);
            console.log("result = ", result);
            resolve(`{"success": true, "message": "user updated!"}`);
        });
    }).catch(error => console.log(error));
}

function action_update_user ( request, payload ) {
    return new Promise((resolve, reject) => {
        // Header or payload are missing
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        // Payload must specify user id
        if (!payload.id)
            reject("User id not specified!");
        // Columns allowed to be changed:
        let allowed = ["id", "email_address", "password_md5"];
        // Exclude not-allowed fields from payload
        Object.entries(payload).map((value, index, obj) => {
            let name = value[0];
            if (!allowed.exists(name)) delete payload[name];
        });
        // Start MySQL query
        let query = "UPDATE user SET ";
        // Build the rest of MySQL query from payload
        Object.entries(payload).map((item, index, object) => {
            let name = item[0];
            let value = payload[name];
            index != 0 ? query += ", " : null;
            query += "`" + name + "` = '" + value + "'";
        });
        // End query
        query += " WHERE `id` = '" + payload.id + "'";
        // Execute MySQL query we just created
        database.connection.query(query, (error, results) => {
            if (error)
                throw(error);
            let result = results[0];
            console.log("results[0] = ", results[0]);
            console.log("result = ", result);
            resolve(`{"success": true, "message": "user updated!"}`);
        });

    }).catch(error => null );
}

function action_login ( request, payload ) {
    return new Promise((resolve, reject) => {
        // First, get the user from database by payload.id
        let query = `SELECT * FROM \`user\` WHERE \`username\` = '${payload.username}'`;
        console.log(query);
        database.connection.query(query,
        (error, results) => { // Check if user already exists in database
            if (error)
                throw(error);
            let result = results[0];
            /* console.log("result = ", result);
            console.log("payload.username = ", payload.username);
            console.log("payload.password = ", payload.password);
            console.log("password 1 = ", md5(payload.password));
            console.log("password 2 = ", result.password_md5); */
            if (results && results.length != 0 && result.username == payload.username) {
                // result.found = true;
                // Check if submitted password is correct
                if (md5(payload.password) == result.password_md5) {
                    delete result.email_address; // don't send email to front-end
                    delete result.password_md5; // don't send md5 password to front-end
                    resolve(`{"success": true, "user": ${JSON.stringify(result)}, "message": "user successfully logged in!"}`);
                } else
                    resolve(`{"success": false, "user": null, "message": "incorrect username or password"}`);
            }
            // User not found
            resolve(`{"success": false, "user": null, "message": "user with this username(${payload.username}) doesn't exist"}`);
        });
    }).catch(error => console.log(error));
}

function action_logout ( request, payload ) {
    return new Promise((resolve, reject) => {
        /* implement */
    }).catch(error => console.log(error));;
}

function action_create_session( request, payload ) {
    // Create unique authentication token
    function create_auth_token() {
        let token = md5( timestamp( true ) + "");
        return token;
    }
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        database.connection.query("SELECT * FROM session WHERE user_id = '" + payload.id + "' LIMIT 1",
        (error, results) => { // Check if session already exists
            if (error) throw(error);
            let result = results[0];
            if (results && results.length != 0 && result.user_id == payload.id) {
                result.found = true;
                resolve(`{"found": true,
                          "token": token,
                          "session": ${JSON.stringify(result)},
                          "message": "session already exists"}`);
            } else { // This session doesn't exist, create it
                // Create auth token
                let token = create_auth_token();
                database.connection.query("INSERT INTO session ( `user_id`, `timestamp`, `token`) VALUES( '" + payload.id + "', '" + timestamp() + "', '" + token + "')",
                    (error, results) => {
                        if (error) throw(error);
                        resolve(`{"found" : false,
                                  "token" : token,
                                  "user_id": ${payload.user_id},
                                  "message": "session was created"}`);
                    });
            }
        });
    }).catch(error => { console.log(error) });
}

function action_get_session( request, payload ) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        database.connection.query("SELECT * FROM session WHERE user_id = '" + payload.id + "' LIMIT 1",
        (error, results) => { // Return session
            if (error)
                throw(error);
            let result = results[0];
            if (results && results.length != 0 && result.user_id == payload.id) {
                result.found = true;
                resolve(`{"found": true,
                          "session": ${JSON.stringify(result)},
                          "message": "session found"}`);
            } else
                resolve(`{"found": false, "session": null, "message": "session found"}`);
        });
    }).catch((error) => { console.log(error) });
}

function action_authenticate_user( request, payload ) {
    return new Promise((resolve, reject) => {
        if (!request || !request.headers || !payload)
            reject("Error: Wrong request, missing request headers, or missing payload");
        database.connection.query("SELECT * FROM session WHERE token = '" + payload.token + "' LIMIT 1",
        (error, results) => { // Return session
            if (error)
                throw(error);
                if (results.length == 0) {
                    console.log("API.authenticate, results.length == 0 (session with token not found)");
                    reject(`{"success": false, "message": "token not found in session"}`);
                } else {
                    //console.log( results );
                    //console.log( results[0] );
                    let token = JSON.stringify({ token: results[0].token, type: "admin" });
                    resolve(`{"success": true, "message": "user (id=${results[0].user_id}) was successfully authenticated", "token" : ${token}}`);
                }
        });
    }).catch((error) => { console.log(error) });
}

// Check if API.parts match a URL pattern, example: "api/user/get"
function identify(a, b) {
     // console.log("idenfity = ", a, b);
     return API.parts[0] == "api" && API.parts[1] == a && API.parts[2] == b;
}

// General use respond function -- send json object back to the browser in response to a request
function respond( response, content ) {
    // console.log("responding = ", [ content ]);
    const jsontype = "{ 'Content-Type': 'application/json' }";
    response.writeHead(200, jsontype);
    response.end(content, 'utf-8');
}

// Convert buffer to JSON object
function json( chunks ) {
    return JSON.parse( Buffer.concat( chunks ).toString() );
}

const stats_dir = `/var/www/javascriptteacher.com/stats`;

function day_today() {
    let now = new Date();
    let start = new Date(now.getFullYear(), 0, 0);
    let diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    let one_day = 1000 * 60 * 60 * 24;
    let day_of_year = Math.floor(diff / one_day);
    return day_of_year;
}

// Clicked on a link "get my 3-book bundle" (book_ad_bundle) usually from FCC
function action_stats_book_ad_bundle( request, response ) {
    return new Promise((resolve, reject) => {
        // console.log(`[new Promise] action_stats_fcctwitter`);
        const ip = request.connection.remoteAddress;
        const year_now = new Date().getFullYear();
        const day_now = day_today();
        const id = `book_ad_3bundle`;
        const entry = `${year_now} ${day_now} ${ip} ${id}`;
        const dir = `${stats_dir}/${year_now}`;
        const path = `${dir}/log.txt`;
        fs.mkdir(dir, { recursive: true }, error => {
            fs.appendFile(path, entry + '\r\n', error => console.log(EST().yellow + ' [marketing] ' + entry.magenta))
            response.writeHead(303, { Location: `https://www.javascriptteacher.com/jsgrammar.html` });
            response.end();
        });
    }).catch((error) => { console.log(error) });
}

// For Medium links exclusively (book_me_bundle)
function action_stats_book_ad_bundle2( request, response ) {
    return new Promise((resolve, reject) => {
        // console.log(`[new Promise] action_stats_fcctwitter`);
        const ip = request.connection.remoteAddress;
        const year_now = new Date().getFullYear();
        const day_now = day_today();
        const id = `book_me_3bundle`;
        const entry = `${year_now} ${day_now} ${ip} ${id}`;
        const dir = `${stats_dir}/${year_now}`;
        const path = `${dir}/log.txt`;
        fs.mkdir(dir, { recursive: true }, error => {
            fs.appendFile(path, entry + '\r\n', error => console.log(EST().yellow + ' [marketing] ' + entry.magenta))
            response.writeHead(303, { Location: `https://www.javascriptteacher.com/jsgrammar.html` });
            response.end();
        });
    }).catch((error) => { console.log(error) });
}

// someone clicked follow me on Twitter link
function action_stats_fcctwitter( request, response ) {
    return new Promise((resolve, reject) => {
        // console.log(`[new Promise] action_stats_fcctwitter`);
        const ip = request.connection.remoteAddress;
        const year_now = new Date().getFullYear();
        const day_now = day_today();
        const id = `fcctwitter`;
        const entry = `${year_now} ${day_now} ${ip} ${id}`;
        const dir = `${stats_dir}/${year_now}`;
        const path = `${dir}/log.txt`;
        fs.mkdir(dir, { recursive: true }, error => {
            fs.appendFile( path, entry + '\r\n', error => { console.log(`${EST().yellow} [follow-me] ${entry}`) } )
            response.writeHead(303, { Location: `https://twitter.com/js_tut` });
            response.end();
        });
    }).catch((error) => { console.log(error) });
}

// Make a historic record of all analytics from *today* only
// This data can be used later to access analytics for each day individually
function action_stats_today( request, response ) {
    return new Promise((resolve, reject) => {
        const year_now = new Date().getFullYear();
        const day_now = day_today();
        fs.readFile(`/var/www/javascriptteacher.com/stats/${year_now}/log.txt`,
            function(err, data) {
                if (err) throw err;
                // console.log("data,", data.toString('utf8'));
                // get entries from today only
                let incl = `${year_now} ${day_now}`;
                // console.log("incl,", incl);
                let list = data.toString('utf8').split("\r\n").filter(item => item.includes(incl));
                let fcctwitter = 0;
                let jstnews = 0;
                let books = 0;
                let fcchit = 0;
                let book_ad_3bundle = 0;
                list.forEach(item => {
                    item.includes("fcctwitter") ? fcctwitter++ : null;
                    item.includes("jstnews") ? jstnews++ : null;
                    item.includes("books") ? books++ : null;
                    item.includes("book_ad_3bundle") ? book_ad_3bundle++ : null;
                    item.includes("fcchit") ? fcchit++ : null;
                });
                const counts = {
                    "fcctwitter": fcctwitter, // clicked on "follow me on Twitter" link
                    "jstnews": jstnews, // signed up to newsletter
                    "books": books, // books sold; still need to implement this by reading from learning curvemysql database
                    "book_ad_3bundle" : book_ad_3bundle, // clicked on bundle link, from FFC article, or similar
                    "fcchit": fcchit,
                };
                // update numbers for this day
                const dir = `${stats_dir}/${year_now}/days`;
                const path = `${dir}/${day_now}.json`;
                const json = JSON.stringify(counts);
                fs.mkdir(dir, { recursive: true }, I => fs.writeFile(path, json, C => response.end(json, 'utf-8')));
        });
        //response.end('ok', 'utf-8');
    }).catch((error) => { console.log(error) });
}

function action_stats_jst_news( request, response ) {
    return new Promise((resolve, reject) => {

    });
}

let mysql_connection_1 = null;
function action_get_twitter_followers(request, response) {
    return new Promise((resolve, reject) => {
        mysql_connection_1 = mysql.createConnection({
            host: '45.56.86.152',
            user: 'root',
            password: 'Murzik55723!',
            database: 'audience'
        });
        mysql_connection_1.connect();
        let query = "SELECT year, day_of_year, followers FROM followers";
        mysql_connection_1.query(query, (error, results) => {
            if (error) throw(error);
            let result = results[0];
            if (results && results.length != 0) {
                console.log("Twitter followers successfully fetched from live database at 45.56.86.152");
                // write to file so we don't have to do this often
                const stats_dir = `/var/www/javascriptteacher.com/stats`;
                const year_now = new Date().getFullYear();
                const dir = `${stats_dir}/twitter`;
                const path = `${dir}/followers.json`;
                const json = JSON.stringify(results);
                fs.mkdir(dir, { recursive: true }, I => fs.writeFile(path, json, C => response.end(json, 'utf-8')));
                resolve(json); // return json to front-end
                mysql_connection_1.end(); // close this database connection
                mysql_connection_1 = null;
            } else { console.log("MySQL query error: failed to read followers"); reject(`reject: mysql error`); }
        });
    });
}

function action_sale_2499(request, response) {
    return new Promise((resolve, reject) => {
        total = parseFloat(total) + 24.99;
        total = total.toFixed(2);
        const ip = request.connection.remoteAddress;
        const year_now = new Date().getFullYear();
        const day_now = day_today();
        const id = `sale_2499`;
        const entry = `${year_now} ${day_now} ${ip} ${id}\r\n`;
        const entry_usd = `${year_now} ${day_now} ${ip} $24.99`;
        const dir = `${stats_dir}/${year_now}`;
        const path = `${dir}/log.txt`;
        fs.mkdir(dir, { recursive: true }, error => fs.appendFile(path, entry, error => {
            console.log(EST().brightGreen + ' [marketing] '.brightGreen + entry_usd.brightGreen + ' ($' + total + ')');
            fs.writeFile("/var/www/total.txt", total, error => {}); // save new total in "/var/www/total.txt";
        }));
        response.end('ok', 'utf-8');
    }).catch((error) => { console.log(error) });
}

function action_sale_3499(request, response) {
    return new Promise((resolve, reject) => {
        total = parseFloat(total) + 34.99;
        total = total.toFixed(2);
        const ip = request.connection.remoteAddress;
        const year_now = new Date().getFullYear();
        const day_now = day_today();
        const id = `sale_3499`;
        const entry_usd = `${year_now} ${day_now} ${ip} $34.99`;
        const entry = `${year_now} ${day_now} ${ip} ${id}\r\n`;
        const dir = `${stats_dir}/${year_now}`;
        const path = `${dir}/log.txt`;
        fs.mkdir(dir, { recursive: true }, error => fs.appendFile(path, entry, error => {
            console.log(EST().brightGreen + ' [marketing] '.brightGreen + entry_usd.brightGreen + ' ($' + total + ')');
            fs.writeFile("/var/www/total.txt", total, error => {}); // save new total in "/var/www/total.txt";
        }));
        response.end('ok', 'utf-8');
    }).catch((error) => { console.log(error) });
}

function action_sale_init(request, response) {
    return new Promise((resolve, reject) => {
        fs.readFile("/var/www/total.txt", 'utf8', function (error, content) {
            total = parseFloat(content).toFixed(2);
            console.log("Starting total.txt value is ", total);
            response.end('ok', 'utf-8');
        });
        // fs.mkdir(dir, { recursive: true }, error => fs.appendFile(path, entry, error => console.log(EST().brightGreen + ' [marketing] '.brightGreen + entry_usd.brightGreen)))
        // resolve(`{"ok": true}`);
    }).catch((error) => { console.log(error) });
}

function action_sunset_upload(request, response) {
    console.log("action_sunset_upload");
    //return new Promise((resolve, reject) => {



//, fileFilter: imageFilter
      //let upload = multer({ storage: storage})
      //let upload = multer({ dest: 'sunsets-123/' });
        //console.log(request.chunks.toString())
        let image = request.chunks.toString();

        //image = image.replace(/------WebKitFormBoundary.*\r/, '');
        //image = image.replace(/Content-Disposition.*\r/, '');
        //image = image.replace(/Content-Type: image\/png.*\r/, '');

      //  fs.writeFile("/var/www/infinitesunset.app/total.png", image, error => {});

        //multer({dest:'./uploads-test'});

        //Middleware
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {cb(null, './sunsets')},
            filename: function (req, file, cb) {cb(null, file.fieldname + '-' + Date.now())}
        });

        //multer({storage: storage});

        let upload = multer( { storage : storage } );

        upload.single('file')(request, {}, function (err) {
          if (err) throw err
          console.log(request);
          console.log(request.file);
          console.log(request.files);
          response.end(`You have uploaded this image: <hr/><img src = "" width = "300" />`, 'utf-8');
          // req.file, req.files...
        });

        //upload(request, response, function(err) {
            //if (err) throw err;
            // Display uploaded image for user validation

        //});
    //});
}

class Action { }

// Link counters, analytics
Action.sale_init = action_sale_init;                       // Init sales counter (on server startup only)
Action.sale_2499 = action_sale_2499;                       // record a sale of 24.99
Action.sale_3499 = action_sale_3499;                       // record a sale of 34.99
Action.stats_today = action_stats_today;                   // fetch results for today only and save them in history for that day
Action.stats_book_ad_bundle = action_stats_book_ad_bundle; // link to my 3-book bundle ad page has been clicked (Free Code Camp, usually)
Action.stats_book_ad_bundle2 = action_stats_book_ad_bundle2; // Same as above but for Medium-based articles
Action.stats_fcc_twitter = action_stats_fcctwitter;        // twitter link from Free Code Camp
Action.stats_jst_news = action_stats_jst_news;             // newsletter sign up via JST website
Action.stats_get_twitter_followers = action_get_twitter_followers; // get twitter followers from a remote database

// API
Action.sunset_upload = action_sunset_upload;
Action.email_register = action_register_email;
Action.register_user = action_register_user;
Action.login = action_login;
Action.logout = action_logout;
Action.get_user = action_get_user;
Action.delete_user = action_delete_user;
Action.update_user = action_update_user;
Action.authenticate_user = action_authenticate_user;
Action.create_session = action_create_session;
Action.get_session = action_get_session;

const resp = response => content => respond(response, content);

// utility function
function prepare(request) {
    request.url[0] == "/" ? request.url = request.url.substring(1, request.url.length) : null;
    request.parts = request.url.split("/");
    request.chunks = [];
}

class API {

    constructor() { }

    static exec( request, response ) {

        let func = null;

        if (request.method == 'GET') {

            if (identify("sale", "init")) func = Action.sale_init; // read total.txt on server startup
            if (identify("sale", "2499")) func = Action.sale_2499; // record sale of 24.99 product (and update total.txt)
            if (identify("sale", "3499")) func = Action.sale_3499; // record sale of 34.99 product (and upadte total.txt)
            if (identify("get", "followers")) func = Action.stats_get_twitter_followers; // Update twitter followers now
            if (identify("get", "books")) func = Action.stats_book_ad_bundle; // (FCC, usually) Link to 3 book bundle has been clicked
            if (identify("get", "book")) func = Action.stats_book_ad_bundle2; // (Medium) Link to 3 book bundle has been clicked
            if (identify("stats", "today")) func = Action.stats_today; // Link from Free Code Camp published article
            if (identify("stats", "fcctwitter")) func = Action.stats_fcc_twitter; // Link from Free Code Camp published article
            if (identify("stats", "jstnews")) func = Action.stats_jst_news; // JavaScript Teacher newsletter sign up

            // console.log(func);

            if (func) func(request, response).then(content => respond(response, content));

        } else if (request.method == 'POST') {

            //prepare(request); // parse request URL parts, reset chunks to []
            request.url[0] == "/" ? request.url = request.url.substring(1, request.url.length) : null;
            request.parts = request.url.split("/");
            request.chunks = [];

            // Start reading POST data chunks
            request.on('data', segment => { // 413 = "Request Entity Too Large"
                if (segment.length > 1e6)  response.writeHead(413, {'Content-Type': 'text/plain'}).end(); else request.chunks.push(segment);});

            // Finish reading POST data chunks
            request.on('end', () => { // POST data fully received

                API.parts = request.parts;

                console.log(API.parts);
                //console.log(request);

                // Identify API function associated with this request
                if (identify("sunset", "upload")) func = Action.sunset_upload; // Register email address
                if (identify("email", "signup")) func = Action.email_register; // Register email address
                if (identify("user", "register")) func = Action.register_user; // Register (create) user
                if (identify("user", "login")) func = Action.login; // Log in
                if (identify("user", "logout")) func = Action.logout; // Log out
                if (identify("user", "delete")) func = Action.delete_user; // Delete user
                if (identify("user", "get")) func = Action.get_user; // Get user data
                if (identify("user", "update")) func = Action.update_user; // Update user
                if (identify("session", "create")) func = Action.create_session; // Create session
                if (identify("user", "authenticate")) func = Action.authenticate_user; // Authenticate user

                // Execute the API function -- *unless* it's an image upload (processed by function)
                //if (func !== Action.sunset_upload)
                  //  func(request, json(request.chunks)).then(content => respond(response, content));
                //else {
                    Action.sunset_upload(request, response);
                //}
            });
        }
    }

    static initSales() {
        // initialize sales on any 1st request to the server
        if (!sales_initialized) fs.readFile("/var/www/total.txt", 'utf8', function (error, content) {
            total = parseFloat(content).toFixed(2);
            console.log("One-time event; sales init starting value is ", total);
            sales_initialized = true;
        });
    }

    // utility function
    static catchAPIrequest(request) {

        request[0] == "/" ? request = request.substring(1, request.length) : null;
        if (request.constructor === String)
            if (request.split("/")[0] == "api") {
                API.parts = request.split("/");
                return true;
            }
        return false;
    }
}

API.parts = null;

module.exports = { API, database };
