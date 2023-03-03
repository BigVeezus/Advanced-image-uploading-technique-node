const express = require("express");
const app = express();
const bodyparser = require("body-parser");
const mysql = require("mysql");
const multer = require("multer");
const path = require("path");
const ejsMate = require("ejs-mate");
const fileUpload = require("express-fileupload");

//use express static folder
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.use(express.static("./public"));

app.use(fileUpload());

// body-parser middleware use
app.use(bodyparser.json());
app.use(
  bodyparser.urlencoded({
    extended: false,
  })
);

// Database connection
const db = mysql.createPool({
  host: "sql9.freesqldatabase.com",
  user: "sql9602491",
  password: "eZZXRh9J4I",
  database: "sql9602491",
});

db.query("SELECT 1 + 1 AS solution", function (err) {
  if (err) {
    return console.error("error: " + err.message);
  }
  console.log("Connected to the MySQL server.");
});

//! Use of Multer
var storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, "uploads"); // './public/images/' directory name where save the file
  },
  filename: (req, file, callBack) => {
    callBack(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({
  storage: storage,
});

//! Routes start

//route for Home page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

//@type   POST
//route for post data
app.post("/post", upload.single("image"), (req, res) => {
  if (!req.file) {
    console.log("No file upload");
  } else {
    console.log(req.file.filename);
    var imgsrc = "http://127.0.0.1:3000/images/" + req.file.filename;
    var insertData = "INSERT INTO users_file(file_src)VALUES(?)";
    db.query(insertData, [imgsrc], (err, result) => {
      if (err) throw err;
      console.log("file uploaded");
      res.send("file uploaded!");
    });
  }
});

app.get("/get", (req, res) => {
  var id = req.params.id;

  var query = `SELECT file_src FROM users_file WHERE id = 1;`;
  db.query(query, (err, result) => {
    if (err) throw err;
    // res.contentType('image/jpeg');
    const myJSON = result[0].file_src;
    console.log(myJSON);
    const src = myJSON;
    res.render("display", (data = src));
  });
});

app.post("/place", (req, res) => {
  if (!req.files) {
    return res.status(400).send("No files were uploaded.");
  }

  const file = req.files.image;
  var img_name = JSON.stringify(file.name);
  // console.log(req.files.image.name)
  console.log(img_name);
  console.log(file.mimetype);
  if (
    file.mimetype == "image/jpeg" ||
    file.mimetype == "image/png" ||
    file.mimetype == "image/gif"
  ) {
    file.mv("public/images/uploaded_images/" + file.name, function (err) {
      if (err) {
        return res.status(500).send(err);
      }

      var sql = `INSERT INTO users_file (file_src) VALUES (${img_name});`;
      db.query(sql, (err, result) => {
        if (err) throw err;
        res.redirect("profile/" + result.insertId);
      });
    });
  } else {
    message =
      "This format is not allowed , please upload file with '.png','.gif','.jpg'";
    res.render("index.ejs", { message: message });
  }
});

app.get("/profile/:id", (req, res) => {
  var message = "";
  var id = req.params.id;
  var sql = "SELECT * FROM `users_file` WHERE `id`='" + id + "'";
  db.query(sql, function (err, result) {
    if (err) throw err;
    if (result.length <= 0) {
      message = "Profile not found!";
    }
    console.log(result[0].file_src);
    var img = result[0].file_src;
    res.render("profile.ejs", { data: img, message: message });
  });
});

//create connection
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running at port ${PORT}`));
