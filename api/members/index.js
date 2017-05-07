var datastore = require('./datastore');

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var assert = require('assert');
var config = require('../../config');

var mongoDb;

var url = config.mongodbUri;

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  config.logStars("All Systems Are a Go.");
  mongoDb = db;
});

// Get list of members
exports.index = function(req, res) {

  // Connect to the db
    if (mongoDb){ 
      var collection = mongoDb.collection('members');
      collection.find().toArray(function(err, items) {
        console.log(items)
          res.send(items);
      });
    }
    else
    {
        console.log('No database object!');
    }

} ;

// Creates a new contact in datastore.
exports.create = function(req, res) {

var member = req.body;
    console.log('Adding member: ' + JSON.stringify(member));
    if (mongoDb){
      var collection = mongoDb.collection('members');
      collection.insert(member, {w:1}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    }
  else
  {
    console.log('No database object!');
  }

};

// Update an existing contact in datastore.
exports.update = function(req, res) {

  var id = req.params.id;
  var member = req.body;
  console.log('Updating member: ' + id);
  console.log(JSON.stringify(member));
  var collection = mongoDb.collection('members');
  collection.update({'_id':ObjectId(id)}, member, {safe:true}, function(err, result) {
          if (err) {
              console.log('Error updating member: ' + err);
              res.send({'error':'An error has occurred'});
          } else {
              console.log('' + result + ' document(s) updated');
              res.send(member);
          }
  });

};

// delete an existing contact in datastore.
exports.delete = function(req, res) {

  var id = req.params.id;
  console.log('Deleting member: ' + id);
  var collection = mongoDb.collection('members');
  collection.deleteOne({'_id':ObjectId(id)}, {safe:true},     function(err, result) {
      if (err) {
          res.send({'error':'An error has occurred - ' + err});
      } else {
          console.log('' + result + ' document(s) deleted');
          res.send(req.body);
      }
  })

};

// find an existing member id in datastore.
exports.find = function(req, res) {

  var id = req.params.id;
  console.log('Finding member: ' + id);
  var collection = mongoDb.collection('members');
  collection.findOne({'_id':ObjectId(id)}, {safe:true},     function(err, result) {
      if (err) {
          res.send({'error':'An error has occurred - ' + err});
      } else {
          console.log('' + result + ' document(s) is found');
          res.send(req.body);
      }
  })

};

 var Datastore = require('nedb');
var db = new Datastore({ filename: __dirname + '/db.json', autoload: true });

db.findOne({ _id: 1 }, function (err, doc) {
  doc = doc || { _id: 1, counter: 0 };

  console.log('This instance of code was executed ' + doc.counter + ' times. Last access time was ' + doc.lastSeetAt);

  doc.lastSeetAt = new Date();
  doc.counter++;

  db.update({ _id: 1 }, doc, { upsert: true }, function (err, num) {
    console.log('Updated ' + num + ' records');
  });
});

 
