require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const db = require(__dirname + "/dboperations.js");
const app = express();
const port = process.env.PORT || 3000;
var adminAuth = false;
var invalidcred = false;


app.set('view engine', 'ejs');
app.use(express.static("public"));
 app.use(express.urlencoded({
   extended: true
 }));

app.listen(port, function() {
  console.log("Server is running at port 3000");
});

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/adminlogin", function(req, res) {
  if (invalidcred) {
    res.render("AdminLogin", {
      invalid: "Invalid Credientials"
    });
  } else {
    res.render("AdminLogin", {
      invalid: ""
    });
  }
});

app.post("/adminlogin", function(req, res) {
  
  if (process.env.EMAIL === req.body.email && process.env.PASSWORD === req.body.password) {
    adminAuth = true;
    invalidcred = false;
    res.redirect("/adminhome");
  } else {
    invalidcred = true;
    res.redirect("/adminlogin");
  }
});

app.get("/adminhome", async function(req, res) {
  if (adminAuth) {
    var emprequest = await db.fetchemployeereq();
    if (emprequest !== "Error") {
      res.render("Adminhome", {
        emprequest: emprequest
      });
    } else {
      res.send("Something Went wrong");
    }
  } else {
    res.redirect("/adminlogin");
  }
});

app.post("/adminhome", async function(req, res) {
  console.log(req.body);
  if (await db.addemp(req.body)) {
    res.redirect("/adminhome");
  } else {
    res.send("Something went wrong");
  }
});

app.get("/employeelogin", function(req, res) {
  res.render("EmployeeLogin", {
    invalid: ""
  });
});

app.post("/employeelogin", async function(req, res) {
  var logintext = await db.employeeauth(req.body);
  if (logintext === "Login Successfull") {
    var user = await db.finduser(req.body.email);
    res.render("emphome", {
      username: user
    });
  } else {
    res.render("EmployeeLogin", {
      invalid: logintext
    });
  }
});

app.get("/employeeregister", function(req, res) {
  res.render("EmployeeRegister");
});

app.post("/employeeregister", function(req, res) {
  var newRequest = db.employeerequest(req.body);
  console.log(newRequest);
  newRequest[1].save(function(err) {
    if (err) {
      console.log(err);
    }
  });
  newRequest[0].save(function(err) {
    if (err && err.code === 11000) {
      console.log(err);
      res.render("success", {
        msg: "Already a Registered User"
      });
    } else if (err) {
      console.log(err);
      res.render("success", {
        msg: "Something went wrong"
      });
    } else {
      res.render("success", {
        msg: "Request Submitted please wait until Admin approval and try login after sometime"
      });
    }
  });
});

app.post("/report", async function(req, res) {
  console.log(req.body);
  var user = await db.finduser(req.body.id);
  console.log(user);
  var days = Number(req.body.Work);
  var details = await db.Netpay(user.salaryperday, days);
  console.log(details);
  res.render("Empreport.ejs", {
    username: user,
    details: details,
    days: days,
    month: getMon()
  });
});


function getMon(){
  var monthNames = ["January","February","March","April","May","June","July","August","September","August","November","December"];
  var month = Number(new Date().getMonth());
  if(month - 1 === -1){
      month = 12;
  }
  return monthNames[Number(month-1)];
}
