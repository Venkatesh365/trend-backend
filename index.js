const express = require("express");
const cors = require("cors")
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const port = process.env.PORT||4001
app.use(cors())

app.use(express.json())
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const { request } = require("http");
const { response } = require("express");
const { title } = require("process");
const console = require("console");
const dbPath = path.join(__dirname, "user.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log("Server Running at http://localhost:4001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();






 app.use(function(req, res, next){
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if(req.method==='OPTIONS'){
      res.sendStatus(200);
  }
  next()
});

 //user upload//
 app.post("/upload", async (request, response) => {
  const bookDetails = request.body;
  const {
    title,
    brand,
    id,
    price,
    image_url,
    rating,
    category
  } = bookDetails;
  const addBookQuery = `
    INSERT INTO
      products (title,brand,id,price,image_url,rating, category)
    VALUES
      (
        '${title}',
         '${brand}',
         ${id},
         ${price},
        '${image_url}',
        '${rating}',
        '${category}'
      );`;

  const dbResponse = await db.run(addBookQuery);
  const bookId = dbResponse.lastID;
  response.send({ bookId: bookId });
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






const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};




app.get("/profile/", authenticateToken, async (request, response) => {
  let { username } = request;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const userDetails = await db.get(selectUserQuery);
  response.send(userDetails);
});



app.get("/products/", authenticateToken,async (request, response) => {
  const {
    sort_by = "ASC",
    title_search="",
    category="",
  } = request.query;
  const getBooksQuery = `
    SELECT
      *
    FROM
     products
    WHERE
     title LIKE '%${title_search}%' AND category LIKE '%${category}%' 
    ORDER BY price ${sort_by}
    ;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

