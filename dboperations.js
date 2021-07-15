require('dotenv').config();
var md5 = require('md5');
module.exports = {
  employeerequest,
  employeeauth,
  fetchemployeereq,
  addemp,
  finduser,
  Netpay
};
var Promise = require('es6-promise').Promise;
const mongoose = require('mongoose');
mongoose.connect(process.env.CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set('useFindAndModify', false);
var designation = ["Manager", "Software-Engineer", "Developer", "Sales-Assistant", "Accountant", "Intern"];
var salary = [8000, 5000, 7000, 3000, 1500, 500];
const requestSchema = new mongoose.Schema({
  _id: String,
  fullname: String,
  dob: String,
  gender: String,
  address: String,
  phone: String
});

const authSchema = new mongoose.Schema({
  _id: String,
  password: String,
  verified: String,
});

const empSchema = new mongoose.Schema({
  _id: String,
  fullname: String,
  dob: String,
  gender: String,
  address: String,
  phone: String,
  des: String,
  salaryperday: Number,
});

const request = new mongoose.model("request", requestSchema);
const auth = new mongoose.model("Authentication", authSchema);
const employee = new mongoose.model("Employee", empSchema);

function employeerequest(body) {
  var newRequest = new request({
    _id: body.email,
    fullname: body.fullname,
    dob: body.dob,
    gender: body.gender,
    address: body.address,
    phone: body.phone
  });
  var newauth = new auth({
    _id: body.email,
    password: md5(body.password),
    verified: 'No'
  });
  return [newRequest, newauth];
}

function employeeauth(body) {
  console.log(body);
  return new Promise(function(resolve, reject) {
    auth.findById(body.email, function(err, user) {
      if (err) {
        console.log(err);
      } else if (user) {
        if (user.password === md5(body.password)) {
          if (user.verified === 'Yes') {
            resolve("Login Successfull");
          } else {
            resolve("User not Verified Please wait untill admin Approval");
          }
        } else {
          resolve("Incorrect Password");
        }
      } else {
        resolve("No User Found Please Register");
      }
    });
  });
}

function fetchemployeereq() {
  return new Promise(function(resolve, reject) {
    request.find({}, function(err, requests) {
      if (err) {
        console.log(err);
        resolve("Error");
      } else {
        resolve(requests);
      }
    });
  });
}

function addemp(body) {
  return new Promise(function(resolve, reject) {
    if (body.btype === "Reject") {
      auth.deleteOne({
        _id: body.req
      }, function(err) {
        if (err) {
          console.log(err);
          resolve(false);
        }
      });
    } else {
      auth.findOneAndUpdate({
        _id: body.req
      }, {
        verified: 'Yes'
      }, null, function(err) {
        if (err) {
          console.log(err);
        }
      });
      request.findOne({
        _id: body.req
      }, function(err, user) {
        if (err) {
          console.log(err);
        } else {
          var newemp = new employee({
            _id: user._id,
            fullname: user.fullname,
            dob: user.dob,
            gender: user.gender,
            address: user.address,
            phone: user.phone,
            des: designation[body.des],
            salaryperday: salary[body.des]
          });
          newemp.save(function(err) {
            if (err) {
              console.log(err);
            }
          });
        }
      });
    }
    request.deleteOne({
      _id: body.req
    }, function(err) {
      if (err) {
        console.log(err);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function finduser(id) {
  return new Promise(function(resolve, reject) {
    employee.findById(id, function(err, user) {
      if (err) {
        console.log(err);
      } else {
        resolve(user);
      }
    });
  });
}

function Netpay(salary, worked) {
  return new Promise(function(resolve, reject) {
    var basepay = salary * worked;
    var houserent = Math.round(basepay * 0.49);
    var oncall = Math.round(basepay * 0.18);
    var bonus = Math.round(basepay * 0.07);
    var grossearn = basepay + houserent + oncall + bonus;
    var ptax = Math.round(basepay * 0.02);
    var itax = Math.round(basepay * 0.12);
    var pf = Math.round(basepay * 0.194);
    var grossdeduct = ptax + itax + pf;
    var netpay = grossearn - grossdeduct;
    resolve({
      basepay: basepay,
      houserent: houserent,
      oncall: oncall,
      bonus: bonus,
      grossearn: grossearn,
      ptax: ptax,
      itax: itax,
      pf: pf,
      grossdeduct: grossdeduct,
      netpay: netpay
    });
  });
}
