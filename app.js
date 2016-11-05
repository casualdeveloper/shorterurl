const express = require("express");
const app = express();
const MongoClient = require('mongodb').MongoClient;
const urlBuilder = require('url');


// export MONGOLAB_URL=mongodb://<dbuser>:<dbpassword>@ds143777.mlab.com:43777/short-url
var url = process.env.MONGOLAB_URL;
var db, collection, counter;

MongoClient.connect(url, (err, database) => {
    if (err) return console.log(err);
    console.log("connected to the database");
    db = database;
    db.collection('url').find({title:"counter"}).toArray(function(err,document){
        if(err) console.log("error "+err);
        counter = parseInt(document[0].count);
    });
});

app.get("/",function(req,res){
   res.send("Please put in valid short url"); 
});

app.get("/:id",function (req,res) {
    
    collection = db.collection('url');
    if(req.params.id==undefined || req.params.id=="favicon.ico")
        return res.send("Invalid URL");
    
    collection.find({short_url:(req.params.id).toString()}).toArray(function(err,document){
        if(err) return console.log("error "+err);
        if(document.length==0)
            return res.send("url not found");
            
        res.redirect(document[0].original_url);
    });
     
});

app.get("/new/:target*", function(req,res) {
    
    collection = db.collection('url');
    
    
    var reqResult = req.params.target;
    var objArr = Object.keys(req.params);
    for(var i = 0;i<objArr.length;i++){
        if(objArr[i]!="target")
            reqResult+=req.params[objArr[i]];
    }
    if(req.params.target!=="http:" && req.params.target!=="https:")
        reqResult="http://"+reqResult;
    
    
    //check if website already exsists in database
    collection.find({"original_url":reqResult}).toArray(function(err,document){
        if(err) console.log("error"+err);
        //if website exists
        
        var obj;
        
        if(document.length!==0){
            obj = document[0];
            return res.send({ "original_url":obj["original_url"],"short_url":fullUrl(req)+obj["short_url"]});
        }
        //if it doesn't exists
        obj = {
            "original_url": reqResult,
            "short_url": (counter+1).toString()
        };
    
        //insert website into the databse
        collection.insert(obj,function(err,result){
            if(err) return console.log("error occured while inserting"+err);
            counter+=1;
            updateCounter(counter);
            return res.send({ "original_url":obj["original_url"],"short_url":fullUrl(req)+obj["short_url"]});//creating object without _id that was added upon insertation
        });
    });
    
    
});


app.listen(process.env.PORT || 8080, function(){
   console.log("server is on listening to PORT "+ process.env.PORT || 8080); 
});


function updateCounter(newCounter){
    var filter = {
        "title": "counter"
    };
    var update = {
        $set: {
            "count": newCounter.toString(),
        }
    };
    
    collection.update(filter,update,function(err){
        if(err) return console.log("error occured while updating "+err);
    });
}

function fullUrl(req) {
  return urlBuilder.format({
    protocol: req.protocol,
    hostname: req.hostname
  })+"/";
}