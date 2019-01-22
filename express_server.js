const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-Session');
const bcrypt = require("bcrypt");

const users = {
    "userID_11111": {
        id: "userID_11111",
        email: "1@1.com",
        password: "123"
    },
    "userID_22222": {
        id: "userID_22222",
        email: "2@2.com",
        password: "123"
    }
}

const urlDatabase = {
    "b2xVn2": { 
        shortURL: "b2xVn2",
        longURL: "http://www.lighthouselabs.ca",
        userID: "userID_11111"
    },
    "9sm5xK": {
        shortURL: "9sm5xK",
        longURL: "https://www.google.com/",
        userID: "userID_22222"
    }
}

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
    name: 'session',
    keys: ["123"],

    maxAge: 24 * 60 * 60 * 1000
}));

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
    res.json(users);
});

app.get("/urls", (req, res) => {
    let user_id = req.session.user_id;
    let urlsForUser = getUrlsForUser(user_id);
    const templateVars = { urls: urlsForUser, user_id: user_id, user: users[user_id] };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let user_id = req.session.user_id
    const templateVars = { urls: urlDatabase, user_id: user_id, user: users[user_id] };
    if (validUser(user_id)) {
        res.render("urls_new", { user: users[user_id] });
    } else {
        res.redirect("/login");
    }
});

app.get("/urls/:id", (req, res) => { // edit URLS
    const shortURL = req.params.id;
    const longURL = urlDatabase[shortURL].longURL;
    console.log("The shortURL is: ", shortURL);
    console.log("The longURL is: ", longURL);
    const user_id = req.session.user_id

    let templateVars = {
        shortURL: shortURL,
        longURL: longURL,
        user: users["user_id"]
    };
    let x = "http://" + longURL
    res.status(301);
    res.redirect(x);
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/urls/edit/:id", (req, res) => {
    const shortURL = req.params.id;
    const longURL = urlDatabase[shortURL].longURL;
    // console.log("The longURL is: ", longURL);
    const user_id = req.session.user_id
    let templateVars = {
        shortURL: shortURL,
        longURL: longURL,
        user: users["user_id"]
    };
    res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
    let shortURL = req.params.shortURL;
    let longURL = urlDatabase[shortURL].longURL;
    console.log("This is the shortURL: ",shortURL);
    console.log("This is the longURL: ",longURL);
    if (shortURL) {
        res.redirect(longURL);
    } else {
        res.status("404").send("Not found");
    }
});

app.get("/", (req,res) => {
    let user_id = req.session.user_id
    const templateVars = { urls: urlDatabase, user_id: user_id, user: users[user_id] };
    if (validUser(user_id)) {
        res.redirect("/urls")
    } else {
        res.redirect("/login");
    }
});

app.post("/urls", (req, res) => {
    const newShortURL = randomString();
    const newLongURL = req.body.longURL;
    var temp = {
        shortURL: newShortURL,
        longURL: newLongURL,
        userID: req.session.user_id
    }
    urlDatabase[newShortURL] = temp;
    res.redirect("/urls");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
        res.render("register");
});

app.post("/urls", (req, res) => {
    const newShortURL = randomString();
    const newLongURL = req.body.longURL;
    var temp = {
        shortURL: newShortURL,
        longURL: newLongURL,
        userID: req.session.user_id
    }
    urlDatabase[newShortURL] = temp;
    res.redirect("/urls/" + newShortURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
    
});

app.post("/urls/:shortURL", (req, res) => { // when update button is pressed
    let shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = req.body.longURL;
    // console.log("this is getting triggered here: ", )
    res.redirect("/urls");
});

app.post("/login", (req, res) => {
    let email = req.body.email;
    let userPassword = req.body.password;

    if (email === "" || userPassword === "") {
        res.status(400);
        res.send("Please enter valid email and password!")
    } else {
        let user = authenticateUser(email, userPassword);
        if (user) {
            req.session.user_id = user.id;
            res.redirect("/urls")
        } else {
            res.send("Sorry the email does not exist or the password does not match!");
        }
    }
});

app.post("/logout", (req, res) => {
    req.session = null;
    res.redirect("/urls");
});

app.post("/register", (req, res) => {
    for (let key in users) {
        let value = users[key]
        if (value.email === req.body.email) {
            res.status(400).send("Error 400 - Email already in use!");
            return;
        }
    }
    if (req.body.email === "" || req.body.password === "") {
        res.status(400).send("Error 400 - Email/Password cannot be blank!");
        return;
    }
    const newUserId = randomUserId();
    const newEmail = req.body.email;
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const newUser = { id: newUserId, email: newEmail, password: hashedPassword }
    users[newUserId] = {
        id: newUserId,
        email: newEmail,
        password: hashedPassword
    }
    req.session.user_id = newUserId;
    res.redirect("/urls");
});

function getUrlsForUser(userId) {
    let urlsForUser = {}
    for (let key in urlDatabase) {
        if (urlDatabase[key].userID === userId) {
            let temp = {
                shortURL: key,
                longURL: urlDatabase[key].longURL
            }
            urlsForUser[key] = temp;
        }
    }
    return urlsForUser;
}

function randomString() {
    var characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = 6; i > 0; --i) {
        result += characters[Math.floor(Math.random() * characters.length)];
    }
    return result;
}

function randomUserId() {
    var characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = 4; i > 0; --i) {
        result += characters[Math.floor(Math.random() * characters.length)];
    }
    return result;
}

function validUser(user_id) {
    return Object.keys(users).includes(user_id);
}

function authenticateUser(email, password) {
    for (var key in users) {
        if (users[key].email === email) {
            if (bcrypt.compareSync(password, users[key].password)) {
                return users[key];
            }
        }
    }
    return false;
}