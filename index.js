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
      console.log("Server Running at http://localhost:4000/");
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



//high-price//
app.get("/high-price", async (request, response) => {
  const {
    order = "DESC",
    order_by = "price",
    search_q = "",
  } = request.query;
  const getBooksQuery = `
    SELECT
      *
    FROM
     products
    WHERE
     title LIKE '%${search_q}%'
    ORDER BY ${order_by} ${order}`;
    
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
//low-price//
app.get("/low-price", async (request, response) => {
  const {
    order = "ASC",
    order_by = "price",
    search_q = "",
  } = request.query;
  const getBooksQuery = `
    SELECT
      *
    FROM
     products
    WHERE
     title LIKE '%${search_q}%'
    ORDER BY ${order_by} ${order}`;
    
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
//clothing//
app.get("/clothing", async (request, response) => {
  
  const getBooksQuery = `
    SELECT
      *
    FROM
     products
    WHERE
    category LIKE 'clothing'`;
    
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
//electronics//
app.get("/electronics", async (request, response) => {
  
  const getBooksQuery = `
    SELECT
      *
    FROM
     products
    WHERE
    category LIKE 'electronics'`;
    
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//appliances//
app.get("/appliances", async (request, response) => {
  
  const getBooksQuery = `
    SELECT
      *
    FROM
     products
    WHERE
    category LIKE 'appliances'`;
    
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
//toys//
app.get("/toys", async (request, response) => {
  
  const getBooksQuery = `
    SELECT
      *
    FROM
     products
    WHERE
    category LIKE 'toys'`;
    
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});
//grocery//
app.get("/grocery", async (request, response) => {
  
  const getBooksQuery = `
    SELECT
      *
    FROM
     products
    WHERE
    category LIKE 'grocery'`;
    
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

 //userdata//
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

// products//
app.get("/prime-deals", async (request, response) => {
  const getBooksQuery = `
    SELECT
      *
    FROM
      products
    ORDER BY
      title;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
 });

 app.get("/products/:id/", async (request, response) => {
  const {id} = request.params;
  const getBookQuery = `
    SELECT
      *
    FROM
      products
    WHERE
      id = ${id};`;
  const book = await db.get(getBookQuery);
  response.send(book);
});