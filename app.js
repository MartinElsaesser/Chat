// App setup
require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const path = require("path");
const methodOverride = require("method-override");

// Mongoose setup
const mongoose = require('mongoose');
mongoose.connect(process.env["DB"]);

// Session Setup
const MongoStore = require("connect-mongo");
const session = require("express-session");
var sessionMiddleware = session({
	name: process.env["COOKIE_SESSION_NAME"],
	secret: process.env["COOKIE_SECRET"],
	store: MongoStore.create({ mongoUrl: process.env["DB"] }),
	resave: false,
	saveUninitialized: true,
	cookie: {
		httpOnly: true,
		// secure: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
});

// Passport
var LocalStrategy = require('passport-local');
var passport = require('passport');
var User = require("./models/User");

app
	.use(methodOverride('_method'))
	.use(sessionMiddleware)
	.use(express.urlencoded({ extended: true }))
	.use(passport.initialize())
	.use(passport.session());


// TODO: Watch out, if User fields are really unique
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// App
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'))

app.get('/', (req, res) => {
	res.render('index', { user: req.user });
});

app.get("/register", (req, res) => {
	res.render("register");
})

app.post("/register", async (req, res) => {
	try {
		const { email, username, password } = req.body;
		const user = new User({ email, username });
		const registeredUser = await User.register(user, password);
		req.login(registeredUser, err => {
			if (err) return next(err);
			res.redirect('/');
		})
	} catch (e) {
		console.log(e);
		res.redirect('register');
	}
})


app.get("/login", (req, res) => {
	res.render("login");
})

app.post("/login",
	passport.authenticate('local', { failureRedirect: '/login' }),
	(req, res) => {
		// const redirectUrl = req.session.returnTo || '/campgrounds';
		const redirectUrl = '/';
		// delete req.session.returnTo;
		res.redirect(redirectUrl);
	})


// Socket IO
const { Server } = require("socket.io");
const io = new Server(server);
io.use(function (socket, next) {
	sessionMiddleware(socket.request, {}, next);
})
io.on('connection', (socket) => {
	socket.on('chat message', (msg) => {
		io.emit('chat message', msg);
	});
	socket.on('move', (msg) => {
		socket.broadcast.emit("move", msg);
	})
});


server.listen(3000, () => {
	console.log('listening on *:3000');
});