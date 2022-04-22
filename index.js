const express = require("express");
const cors = require("cors")
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const port = process.env.PORT||4000
app.use(cors())

app.use(express.json())
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const dbPath = path.join(__dirname, "user.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log("Server Running at http://localhost:4000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//get user//
app.get("/userdata/", async (request, response) => {
  const getBooksQuery = `
    SELECT
      *
    FROM
      user
    ORDER BY
      name;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});




//user register//
app.post("/users/", async (request, response) => {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          user (username, name, password, gender, location) 
        VALUES 
          (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
          )`;
      const dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.send(`Created new user with ${newUserId}`);
    } else {
      response.status = 400;
      response.send("User already exists");
    }
  });

  //user logins//
  app.post("/logins", async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
    response.status(400);
     response.send("Invalid User");
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
        response.send("Login Success!");
      } else {
        response.status(400);
      response.send("Invalid Password");
   }
   }
  });

  app.use(function(req, res, next){
    res.removeHeader('Access-Control-Allow-Origin');
    res.header('Access-Control-Allow-Origin', 'https://*.mycompany.com'); 
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if(req.method==='OPTIONS'){
        res.sendStatus(200);
    }
    next()
});

 //user login//
 app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});