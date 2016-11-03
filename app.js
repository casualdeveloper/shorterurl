var express = require("express");
var app = express();

app.get("/",function(req,res){
   res.send("HELLO!") 
});

app.listen(process.env.PORT || 8080, function(){
   console.log("server is on listening to PORT "+ process.env.PORT || 8080); 
});
