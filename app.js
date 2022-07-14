var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
// var popup = require('popups');
// let alert = require('alert');
const encoder = bodyParser.urlencoded();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',      // your root username
    password : 'Yash@12345',    
    database : 'onetask',   // the name of your db
    multipleStatements: true
});


//this empID will store the servicemen id of the person who logged in
var empID;

var clientID = 0;

//this variable will store the servicemen id which will be matched for the task requested by the client
var SiD=0;

app.get("/", function(req, res) {
    res.render("index");
    ClientID = 0;
    empID = 0;
    SiD = 0;
});


app.post("/sregister", function(req,res) {
    var person = {
        Firstname : req.body.first_name,
        Lastname : req.body.last_name,
        Age : req.body.age,
        Gender : req.body.gender,
        Address1 : req.body.address,
        PhoneNo : req.body.phone,
        pincode : req.body.pin_code,
        skill : req.body.skill,
        username : req.body.username,
        password : req.body.password
    }
    connection.query("insert into servicemen set ?", person, function(err, result) {
        if(err) throw err;
        res.redirect("/");
    })
}); 

app.post("/cregister", function(req,res) {
    // console.log(req);
    var person = {
        Firstname : req.body.first_name,
        Lastname : req.body.last_name,
        Age : req.body.age,
        Gender : req.body.gender,
        Address1 : req.body.address,
        PhoneNo : req.body.phone,
        pincode : req.body.pin_code,
        username : req.body.username,
        password : req.body.password
    }
    connection.query("insert into client set ?", person, function(err, result) {
        connection.on('error', function(err) {
            console.log("[mysql error]",err);
        });
        if(err) {
            console.log(err);
            throw err;
        }
        res.redirect("/");
    }) 
});



app.post("/logins",encoder, function(req,res) {
    var username = req.body.username
    var password = req.body.password

    //res.render("empdashboard");
    
    var q = "select username, password from servicemen where username = ? and password = ?";
    connection.query(q,[username,password], function(err, result, fields) {
        if(result.length > 0) {
            var q1 = "select ServicemenID as snum from servicemen where username = ? and password = ?";
            connection.query(q1, [username, password], function(err, res, fields) {
                empID = res[0].snum;
            })
            res.redirect("/emp-dashboard"); 
        } else {
            res.redirect("/logins");
        }
        
        res.end()
    })

});

app.post("/login",encoder, function(req,res) {
    var username = req.body.username
    var password = req.body.password

    //res.render("empdashboard");
    
    var q = "select username, password from client where username = ? and password = ?";
    connection.query(q,[username,password], function(err, result, fields) {
        if(result.length > 0) {
            var q1 = "select Client_no as cnum from client where username = ? and password = ?";
            connection.query(q1, [username, password], function(err, res, fields) {
                clientID = res[0].cnum;
                console.log(clientID);
            })
            console.log(result);
            res.redirect("/client-dashboard"); 
        } 
        else {
            res.redirect("/login");
            
        }
        
        res.end()
    })

});


var tname;
var pincode=0;


app.post("/loginc1",encoder, function(req,res) {
    var username = req.body.username
    var password = req.body.password

    //res.render("empdashboard");
    
    var q = "select username, password from client where username = ? and password = ?";
    connection.query(q,[username,password], function(err, result, fields) {
        if(result.length > 0) {
            var q1 = "select Client_no as cnum from client where username = ? and password = ?";
            connection.query(q1, [username, password], function(err, res, fields) {
                clientID = res[0].cnum;
                console.log(clientID);
            })

            var q2 = "select pincode as p from client where username = ? and password = ?";
            connection.query(q2, [username, password], function(err, result ,fields) {
                pincode = result[0].p;
                console.log(pincode);
            })
            
            res.redirect("/task"); 
        }
        else {
            //the user entered wrong credentials so show a dialog box and redirect on the same page
            res.redirect("/loginc1");
        }
        
    })

});

app.get("/task", function(req, res) {
    res.render("task");
})

app.post("/task",encoder, function(req, res) {
    //we have to insert into the task table
    var q1 = "select ServicemenID as Id from servicemen where skill = ? and pincode = ? and IsOccupied = false";
    connection.query(q1, [req.body.taskname, pincode], function(err, result, fields) {
        console.log(result);
            if(result.length>0) {
                console.log("inside if");
                SiD = result[0].Id;
                PDate = req.body.date;
                var task = {
                    TaskName : req.body.taskname,
                    ClientId : clientID,  
                    ServicemenId : SiD,
                    Taskdate : req.body.date,
                }
                console.log(req.body.date);
                var q = "insert into task set ?"
                connection.query(q, task, function(err, result, fields) { 
                    var q2 = "update servicemen set IsOccupied = true where ServicemenID = ?";
                    connection.query(q2, [SiD], function(err,arr, fields) {
                        res.redirect("/client-dashboard");
                    })
                })
                
            } 
            else {
                console.log(clientID);
                console.log(SiD);
                
                //the query is unsuccessful so show a dialog box
                res.redirect("/task");
            }
    });
})


// var taskname;
// // var taskdesc;
// var empfname;
// var emplname;
var PDate;
app.get("/client-dashboard", function(req, res) {
    var q = "select task.TaskName as Tname,task.Taskdate as Tdate,servicemen.Firstname as Fname,servicemen.Lastname as Lname,servicemen.PhoneNo as Contact from task inner join servicemen on servicemen.ServicemenID = task.ServicemenId where task.IsCompleted = false;"
    connection.query(q, function(err, result, fields) {
        var q1 = "select avg(Ratings) as r from Ratings where ServicemenId = ?";
        connection.query(q1,[SiD], function(err, results, fields) { 
            res.render("clientdashboard", {items: result, avgratings:results}); 
        })
    })
    
})

app.post("/client-dashboard", function(req, res) {
    console.log("inside post");
    var r = {
        ratings : req.body.estrellas,
        ClientId: clientID,
        ServicemenId: SiD  
    }
    
    console.log(clientID);
    console.log(SiD);
    var q = "insert into ratings set ?";

    connection.query(q,r, function(err, result, fields) {
        var q1 = "update task set IsCompleted = true where clientID = ? and ServicemenId = ?";
        connection.query(q1,[clientID, SiD], function(err, result, fields) {
            var q2 = "update servicemen set NoOfTasks = NoOfTasks + 1 where ServicemenID = ?";
            connection.query(q2, [SiD], function(err, result, fields) {
                var q4="update client set NoofServices = NoofServices + 1 where Client_no = ?";
                connection.query(q4, [clientID], function(err, result, fields) {
                    var q3 = "update servicemen set IsOccupied = false where ServicemenID = ?";
                    connection.query(q3, [SiD], function(err, result, fields) {
                        var pay = {
                            PaymentDate: PDate,
                            Clientno : clientID,
                        }
                        var q4 = "insert into payment set ?";
                        connection.query(q4, pay, function(err, result, fields) {
                            console.log(result);
                            res.redirect("/client-dashboard");
                        })
                    })
                })
            })
        })
    })
})

app.get("/client-previous-tasks", function(req, res) {
    //dashboard should show ongoing task
    var q = "select task.TaskName as Tname,servicemen.Firstname as Fname,servicemen.Lastname as Lname,servicemen.PhoneNo as Contact from task inner join servicemen on servicemen.ServicemenID = task.ServicemenId where task.IsCompleted = true and task.ClientId = ?;"
    connection.query(q,[clientID] ,function(err, result, fields) {
        res.render("clientdashboard1", {items: result});
    })
})

app.get("/emp-dashboard", function(req, res) {
    var q = "select task.TaskName as Tname,task.Taskdate as Tdate,client.Firstname as Fname,client.Lastname as Lname,client.Address1 as address,client.pincode as pincode,client.PhoneNo as Contact from task inner join client on client.Client_no = task.ClientId where task.isCompleted = false;"
    connection.query(q, function(err, result, fields) {
        res.render("empdashboard", {items: result});
    })
});

app.post("/emp-dashboard", function(req, res) {
    var q = "update task set IsCompleted = true where clientID = ? and ServicemenId = ?";
    connection.query(q,[clientID, SiD], function(err, result, fields) {
        var q1 = "update servicemen set NoOfTasks = NoOfTasks + 1 where ServicemenID = ?";
            connection.query(q1, [SiD], function(err, result, fields) {
                var q3="update client set NoofServices = NoofServices + 1 where Client_no = ?";
                connection.query(q3, [clientID], function(err, result, fields) {
                    console.log(result);
                    var q2 = "update servicemen set IsOccupied = false where ServicemenID = ?";
                    connection.query(q2,[SiD], function(err, result, fields) {
                        var pay = {
                            PaymentDate: PDate,
                            Clientno : clientID,
                        }
                        var q4 = "insert into payment set ?";
                        connection.query(q4, pay, function(err, result, fields) {
                            console.log(result);
                            res.redirect("/emp-dashboard");
                        })
                    })
              })
            })
    })
});

app.get("/emp-previous-tasks", function(req, res) {
    var q = "select task.TaskName as Tname,client.Firstname as Fname,client.Lastname as Lname,client.Address1 as address,client.pincode as pincode,client.PhoneNo as Contact from task inner join client on client.Client_no = task.ClientId where task.isCompleted = true and task.ServicemenId = ?;"
    connection.query(q,[empID], function(err, result, fields) {
        res.render("empdashboard1", {items: result});
    })
});


app.get("/emp-salary", function(req, res) {
    var q = "select SalaryAmount as salamount, NoOfTasks as NoofTasks, bonus as b from servicemen where ServicemenID = ?;"
    var q1 = "select curdate() as date, last_day(curdate()) as Sdate;"
    console.log(empID);
    connection.query(q,[empID], function(err, result, fields) {
        connection.query(q1, function(err, arr, fields) {
            res.render("salary", {items: result,dateinfo: arr});
        })  
    })
})



app.get("/login", function(req,res) {
    res.render("login");
});

app.get("/logins", function(req,res) {
    res.render("logins");
})

app.get("/loginc1", function(req,res) {
    res.render("loginc1");
})

app.get("/empSignUp", function(req, res) {
    res.render("empSignUp");
});

app.get("/signupc", function(req, res) {
    res.render("signupc");
});


app.get("/random_num", function(req,res) {
    var num = Math.floor(Math.random() * 10) + 1;
    res.send("Your lucky number is " + num);
});

app.listen(8080,function(){
    console.log("Server running on 8080!!!");
});