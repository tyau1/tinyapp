const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com",

};

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
    let templateVars = { urls: urlDatabase, username: req.cookies.username };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

app.post("/urls", (req, res) => {
    let newShortURL = randomString();
    let newLongURL = req.body.longURL;
    urlDatabase[newShortURL] = newLongURL;
    console.log(urlDatabase);
    res.redirect("/urls/" + newShortURL);
});

app.get("/urls/:id", (req, res) => {
    let shortURL = req.params.id;
    let longURL = urlDatabase[shortURL];
    let templateVars = {
        shortURL: shortURL,
        longURL: longURL,
        username: req.cookies.username
    };
    res.render("urls_show", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
});

app.post("/urls/:shortURL/", (req, res) => {
    let shortURL = req.params.shortURL;
    console.log("here's my short URL", shortURL);
    urlDatabase[shortURL]= req.body.longURL
    res.redirect("/urls");
});

app.post("/login", (req, res) => {
    res.cookie("username", req.body.username)
    res.redirect("/urls");
});

app.post("/logout", (req, res) => {
    res.clearCookie("username")
    res.redirect("/urls");
});

function randomString() {
    var characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = 6; i > 0; --i) {
        result += characters[Math.floor(Math.random() * characters.length)];
    }
    return result;
}
