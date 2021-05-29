const cookieParser = require('cookie-parser');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')

const app = express();
const session = require("express-session");

app.use(cookieParser());
app.use(session({
	secret: 'secret1',
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 86400000
	}
}));

const port = 6789;

const fs = require('fs');

var utilizatori;
fs.readFile('utilizatori.json', (err,data) => {
	if(err) throw err;
	utilizatori = JSON.parse(data);
});

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req, res) => 
{//res.send('Hello World'));
	res.render('acasa', {user: req.cookies.dataUser, data: req.session });
});



app.get('/autentificare', (req, res) => {
	let mesajEroare = req.cookies.mesajEroare;
	res.render('autentificare', {user: req.session.user, eroare: mesajEroare});
});

app.get("/inregistrare", (req, res) => {
	let mesaj = req.cookies.mesaj;
	res.render('inregistrare', {user: req.session.user, eroare: mesaj});
});


app.post('/verificare-autentificare', (req, res) => {
	let gasit = false;
	fs.readFile('utilizatori.json', (err,data) => {
		if(err) throw err;
		utilizatori = JSON.parse(data);
	});
	for(let i=0; i < utilizatori.length; i++)
	{
		if(utilizatori[i].user == req.body.user && utilizatori[i].password == req.body.password)
		{
			res.cookie("dataUser", {user: req.body.user, password: req.body.password});
			gasit = true;
			req.session.user = req.body.user;
			req.session.rol = utilizatori[i].rol;
			req.session.nume = utilizatori[i].nume;
			req.session.prenume = utilizatori[i].prenume;
			res.redirect('/');
			return;
		}
	}
	if(!gasit)
	{
		res.cookie("mesajEroare", "User invalid sau parolă invalidă!"); 
		res.redirect('/autentificare');
	}

	res.end();
});

app.post('/verificare-inregistrare' ,(req, res) => {
	let gasit = false;

	for(let i=0; i < utilizatori.length; i++)
	{
		if(utilizatori[i].user == req.body.user)
		{
			gasit = true;
			res.cookie("mesaj", "User existent!"); 
			res.redirect('/inregistrare');
		}
	}

	if(!gasit)
	{
		let obj= {"user" : req.body.user , "password" : req.body.password, "rol": "user"};
		utilizatori.push(obj);
		var obj2 = JSON.stringify(utilizatori);

		fs.writeFile('utilizatori.json', obj2, err => {
			if(err) throw err;
			
			console.log("User adaugat!");
		});   
		res.redirect('/autentificare');
		return;
	}
	res.end();
});

app.get('/resurse', (req, res) => {
	let resurse;
	fs.readFile('resurse.json', (err,data) => {
		if(err) throw err;
		resurse = JSON.parse(data);
		res.render('resurse',  {p:resurse});
	});
});

app.get('/logout', (req, res) => {
	req.session.destroy();
	res.clearCookie("dataUser");
    res.redirect('/autentificare');
});

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {
	const listaIntrebari = [
		{
			intrebare: 'Întrebarea 1',
			variante: ['varianta 1', 'varianta 2', 'varianta 3', 'varianta 4'],
			corect: 0
		},
		//...
	];
	// în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
	res.render('chestionar', {intrebari: listaIntrebari});
});

app.post('/rezultat-chestionar', (req, res) => {
	console.log(req.body);
	res.send("formular: " + JSON.stringify(req.body));
});


app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));

