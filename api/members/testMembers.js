var supertest = require("supertest");
var should = require("should");

// This agent refers to PORT where program is runninng.
var server = supertest.agent("http://localhost:8000");

// UNIT test begin

describe("Members GET unit test",function(){
  // #1 should return contacts representation in json
  it("should return collection of JSON documents",function(done){

    // calling home page api
    server
    .get("/api/members")
    .expect("Content-type",/json/)
    .expect(200) // THis is HTTP response
    .end(function(err,res){
      // HTTP status should be 200
      res.status.should.equal(200);
      done();
    });
  });
});

// #2 add a contact
it("should add a new member",function(done){

  // post to /api/contacts
  server.post("/api/members/")
  .send({name:"Frank",address:"282820"})
  .expect("Content-type",/json/)
  .expect(201)
  .end(function(err,res){
    res.status.should.equal(201);
    done();
  });
});


/*
// #3 update a member
it("should add a new member",function(done){

  // post to /api/contacts
  server.put("/api/members/591387622f1095277c865a5e")
  
  .expect("Content-type",/json/)
  .expect(200)
  .end(function(err,res){
    res.body._id.should.equal(" 591387622f1095277c865a5e";
    done();
  });
});*/
