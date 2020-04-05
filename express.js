const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const multer = require('multer');
const sharp = require('sharp');
const app = express();
const port = 443;

//Middleware
const storage = multer.diskStorage({
    destination: function (req, file, cb) {cb(null, './sunsets')},
    filename: function (req, file, cb) {cb(null, file.fieldname + '-' + Date.now())}
});
//multer({storage: storage});
const upload = multer( { storage : storage } );

// body-parser is middleware included with express installation
// The following 3 lines are required to send POST body
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/static', express.static('images'));
app.use('/sunsets', express.static('sunsets'));
app.use('/api', express.static('api'));
app.use('/static', express.static('css'));
app.get('/', function(req, res) { res.sendFile(path.join(__dirname + '/index.html')); });

// General use respond function -- send json object back to the browser in response to a request
function respond( response, content ) {
    const jsontype = "{ 'Content-Type': 'application/json' }";
    response.writeHead(200, jsontype);
    response.end(content, 'utf-8');
}

// Convert buffer to JSON object
function json( chunks ) { return JSON.parse( Buffer.concat( chunks ).toString() ) }

// Connect to Mongo server
if (false) MongoClient.connect(`mongodb://localhost/`, function(err, db) {

  let callback = null;
  
  if (err)
    throw err;

  console.log("Mongo Connected on mongodb://localhost/");

  // Create Photographer collection
  let Photographer = db.collection('Photographer');

  //db.collection.deleteMany({});

  // Wipe the slate clean
  //Photographer.remove();
  
  Photographer.deleteMany(null, (err, result) => {
      if (err)
        throw err;
      console.log("result.deleteCount = ", result.deleteCount);
  });

  // Insert some data into it
  let user = { id: 14, name: "John", last: "Smith", x: 0, y: 0, lat: 0, lon: 0 };
  Photographer.insertOne(user, (err, result) => {
      if (err)
          throw err;
      // console.log("ops = ", result.ops);
      //console.log("insertedCount = ", result.insertedCount);
      // console.log("insertedId = ", result.insertedId);
      // console.log("insertedId.id = ", result.insertedId.id);
      //console.log(result.insertedId === result.insertedId);
  });

  console.log("Inserting Many...");
  let rnd1 = Math.floor(Math.random()*10);
  let rnd2 = Math.floor(Math.random()*10);
  let rnd3 = Math.floor(Math.random()*10);
  let rnd4 = Math.floor(Math.random()*10);
  let rnd5 = Math.floor(Math.random()*10);
  let rnd6 = Math.floor(Math.random()*10);
  Photographer.insertMany([ // Insert many
      { id: 5, name: "Luna", last:"Smith", x:rnd1,y:rnd2,lon:0,lat:0 },
      { id: 6, name: "Felix", last:"Black", x:rnd3,y:rnd4,lon:0,lat:0 },
      { id: 7, name: "Rita", last:"Bear",  x:rnd5,y:rnd6,lon:0,lat:0 }
  ], (err, result) => {
    if (err)
        throw err;
    //console.log("result.ops", result.ops);
    console.log("result.result", result.result);
    console.log("result.insertedCount", result.insertedCount);
    //console.log("result.insertedIds", result.insertedIds);
  });

  // Find all/many
  // Update (U in CRUD)
  //Photographer.findAndModify({id : 4}, function(err, result){
  //if (err)
  //    throw err;
  //  console.log("Photographer.findAndModify = ");
  //console.log(result);
  
  // Update photographer with id = 4
  const match = { id: 4 };
  const update = { $set: { name: "Mark" } };
  callback = (err, result) => {
    if (err)
        throw err;
    console.log( "matchedCount = ", result.matchedCount );
    console.log( "modifiedCount = ", result.modifiedCount );
  };
  Photographer.updateOne(match, update, callback);

  // Delete one
  Photographer.deleteOne({id : 4 }, function(err, result) {
    if (err)
        throw err;
    console.log("Photographer.deleteOne({id: 4}) = ");
    console.log("result.deletedCount = ", result.deletedCount);
    if (result.deletedCount == 1) {
        console.log("One has been deleted!");
    }
  });

  setTimeout(time => {
      Photographer.count().then(count => {
          console.log("Photographer.count().then(...) = " + count);          
      });
    }, 1000);    

    // Count number of documents in Photogrpher so far
    setTimeout(time => {
        
        console.log("Photographer.find (returns Cursor object)"); 
        Photographer.find({}, {}, function(err, cursor) {    
          let counter = 0;
          // NOTE: You must apply limit() to the cursor
          // before retrieving any documents from the database.
          cursor.limit(0);
          //cursor.limit(2);
          cursor.each(function(error, result) {
            if (error) throw error;
            if (result)             
                console.log(`${counter++} => name=${result.name} last=${result.last} x=${result.x} y=${result.y} lat=${result.lat} lon=${result.lon}`);
            });
        }); 

      //});

      // Finally close the database
      db.close();

    }, 2000);

  
  // Output some info
  //const { databaseName } = db.s;
  //const { dbName, namespace, name } = Collection.s;
  //console.log(databaseName, dbName, namespace, name);
  // let x = db.collection("user");
  // console.log(x);
});

// Get all users
app.post('/api/get/users', function (req, res, next) {
  MongoClient.connect(`mongodb://localhost/`, function(err, db) {
    const Photographer = db.collection('Photographer');
    Photographer.find({}, {}, function(err, cursor) {    
      // NOTE: You must apply limit() to the cursor
      // before retrieving any documents from the database.
      cursor.limit(1000);      
      let users = [];
      //console.log(cursor);
      cursor.each(function(error, result) {
          if (error) throw error;
          if (result) {
            //console.log(result);
            let user = { x: result.x, y: result.y, lat: result.lat, lon: result.lon };
            //console.log("user["+users.length+"]=", user);
            users.push(user);
          }
        });

        (async function() {
          const cursor = db.collection("foo").find({});
          while (await cursor.hasNext()) {
            const doc = await cursor.next();
            // process doc heret
          }
        })();

        setTimeout(time => {
          const json = `{"success":true,"count":${users.length},"userList":${JSON.stringify(users)}}`;
          respond(res, json);
        }, 2000);
    }); 
  });
});

app.post('/api/add/user', function (req, res, next) {
  const ip = req.connection.remoteAddress;
  const { x, y, lat, lon } = req.body;  
  // Connect to mongo and insert this user if doesn't already exist
  MongoClient.connect(`mongodb://localhost/`, function(err, db) {
    const Photographer = db.collection('Photographer');
    //Photographer.remove();
    // Check if this user already exists in collection
    Photographer.count({ip:ip}).then(count => {
        if (count == 1) {
            console.log(`User with ${ip} already exists in mongo.`);
            db.close();
        } else {
            console.log(`User with ${ip} does not exist in mongo...inserting...`);
            let user = { ip: ip, x: x, y: y, lat: lat, lon: lon };
            Photographer.insertOne(user, (erro, result) => {
                if (erro)
                    throw erro;
                //console.log("insertedCount = ", result.insertedCount);
                //console.log("ops = ", result.ops);
                db.close();
            });
        }
    });
    res.end('ok');
  });
});

// POST method route
app.post('/api/sunset/upload', upload.single('file'), function (req, res, next) {
    if (req.file) {
      // console.log("req.file.mimetype", req.file.mimetype);
      // const { filename: image } = req.file.filename;
      let ext = req.file.mimetype.split('/')[1];
      let stamp = new Date().getTime();
      //console.log("ext=",ext);
      output = `./sunsets/sunset-${stamp}.${ext}`;
      output2 = `https://www.infinitesunset.app/sunsets/sunset-${stamp}.${ext}`;
      console.log("output=",output);
      //console.log("output2=",output2);
      sharp(req.file.path)
          .resize(200).toFile(output, (err, info) => {
            //console.log(err);
            //console.log(info.format); 
          });
      //fs.unlinkSync(req.file.path);
      res.end(`<html><body style = 'font-size: 50px'><img src = "${output2}" style = "width: 100%;"><div style = "text-align: center; margin-top: 50px;">Picture uploaded! <a href = 'https://www.infinitesunset.app' target = 'sunset'>Go Back</a></div></body></html>`,`utf-8`);
    }
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any
    res.end(`<html><body>Something went wrong.</body></html>`,`utf-8`);
})

app.get('/api/image/upload', (req, res) => res.send('Uploading Image...'));

let site = 'infinitesunset.app';

const certificates = {
    "key": fs.readFileSync(`/etc/letsencrypt/live/${site}/privkey.pem`),
    "cert": fs.readFileSync(`/etc/letsencrypt/live/${site}/fullchain.pem`)
};

const server = event => {
    console.log(`${site} is listening on port ${port}!`);
};

// Launch Node server with Express "app"
https.createServer(certificates, app).listen(port, server);
