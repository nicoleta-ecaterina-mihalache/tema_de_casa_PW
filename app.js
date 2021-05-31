const cookieParser = require('cookie-parser');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const session = require("express-session");
var http= require('http');

app.use(cookieParser());
app.use(session({
	secret: 'secret1',
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 86400000
	}
}));

var con = mysql.createConnection({
	host: "localhost",
	user: "ecaterina",
	password: "ecaterina98"
});

const port = 6789;

const fs = require('fs');

let jsonData = require('./intrebari.json');

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

app.get('/filme', (req, res) => 
{
	asyncCall();
	res.render('filme', {user: req.cookies.dataUser, filme: records});
});

app.get('/autentificare', (req, res) => {
	let mesajEroare = req.cookies.mesajEroare;
	res.render('autentificare', {user: req.cookies.dataUser, eroare: mesajEroare});
});

app.get("/inregistrare", (req, res) => {
	let mesaj = req.cookies.mesaj;
	res.render('inregistrare', {user: req.cookies.dataUser, eroare: mesaj});
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
			req.session.vector=[];
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

app.get('/get_curiozitati', (req, res) => {
	let c;
	fs.readFile('curiozitati.json', (err,data) => {
		if(err) throw err;
		c = JSON.parse(data);
		res.send({curiozitati:c});
	});
});

app.get('/creare-BD', (req, res) => {
	con.connect(function(err) 
	{
	  if (err)
	  {
		  return console.error('Nu s-a putut stabili conexiunea cu baza de date: ' + err.message);
	  }
	  console.log("Connected!");
	  con.query("CREATE DATABASE if not exists cumparaturi", function (err, result) 
	  {
		  if (err)
		  {
			  return console.error('Nu s-a putut crea baza de date cumparaturi: ' + err.message);
		  }
		  console.log("Database created");
	  });
	  con.query("use cumparaturi");
	  con.query("CREATE TABLE if not exists filme (id INT NOT NULL AUTO_INCREMENT, film VARCHAR(100) NOT NULL, pret VARCHAR(10) NOT NULL, durata VARCHAR(10) NOT NULL,ora VARCHAR(10) NOT NULL, gen VARCHAR(30) NOT NULL , detalii VARCHAR(30) NOT NULL, trailer VARCHAR(60) NOT NULL, PRIMARY KEY (id))", function (err, result) {
		  if (err) 
		  {
			  return console.error('Nu s-a putut crea tabela produse: ' + err.message);
		  }
		  console.log("Table created");
		});
	});
  res.redirect('/filme');
});


app.get('/inserare-BD', (req, res) => {
	con.connect(function(err) {
		if (err) 
		{
			return console.error('Nu s-a putut stabili conexiunea cu baza de date: ' + err.message);
		}
		console.log("Connected!");
		con.query("use cumparaturi");
		var sql = "INSERT INTO filme (id, film, pret, durata, ora, gen, detalii, trailer) VALUES ?";
  		var values = [
			[null,'BABARDEALA CU BUCLUC', '20lei','106min','12:40', 'Comedie, Drama','2D, RO', 'https://www.youtube.com/embed/6WDD1TpMvGY'],
			[null,'INCA UN RAND', '22lei','115min','13:50', 'Drama','2D, DAN (SUB: RO)', 'https://www.youtube.com/embed/eg7E9kNlt8I'],
			[null,'O SCHEMA DE MILIOANE', '20lei','104min', '16:20', 'Actiune, Comedie','EN (SUB: RO)', 'https://www.youtube.com/embed/QAAQhMEjNNg'],
			[null,'IN BATAIA PUSTII', '25lei','108min', '18:10', 'Actiune, Drama, Thriller','EN (SUB: RO)', 'https://www.youtube.com/embed/VXoq3i_HNAc'],
			[null,'TINUTUL NOMAZILOR', '20lei','108min', '20:30', 'Drama','EN (SUB: RO)', 'https://www.youtube.com/embed/_v6EnREcZGE']
		  ];
		con.query(sql, [values], function (err, result){
			if (err) 
			{
				return console.error('Nu s-au putut insera datele: ' + err.message);
			}
			console.log("Date inserate cu succes!");
		});
	  });
	res.redirect('/filme');
});

app.get('/sterge-BD', (req, res) => {
	con.connect(function(err) {
		if (err) 
		{
			return console.error('Nu s-a putut stabili conexiunea cu baza de date: ' + err.message);
		}
		console.log("Connected!");
		con.query("use cumparaturi");
		con.query("DROP TABLE filme", function (err, result){
			if (err) 
			{
				return console.error('Nu s-au putut șterge datele: ' + err.message);
			}
			console.log("Date șterse!");
		});
	  });
	res.redirect('/filme');
});

var data=[], records=[];
function getRecords(){
	return new Promise(resolve=>{
		con.query('SELECT * FROM filme',[],(err,rows) =>
		{
			if(err)
			{
				return console.error(err.message);
			}
			rows.forEach((row) =>
			{
				data.push(row);
			});
			resolve(data);
		});
	});
}

async function asyncCall(){
	records = await getRecords();
}

app.post('/adaugare_cos', (req, res) => {
	req.session.vector.push(Number(req.body.id));
	res.redirect('/filme');
});

app.get('/vizualizare-cos', (req, res) => {
	console.log(req.session.vector);
	var ids=req.session.vector;
	var filmeAdaugate=[];
	con.query("USE cumparaturi");
	
	con.query("SELECT * FROM filme", function (err, result, fields) {
		if (err) throw err;
		result.forEach(fil => {
			var times=0;
			ids.forEach(i => {
				if(fil.id == i)
				{
					times = times+1;
				}
			});
			if(times>=1)
			{
				filmeAdaugate.push({'film':fil.film,'pret':fil.pret,'buc':times});
			}	
		});
		//console.log(filmeAdaugate);
		res.render('vizualizare-cos',{filme: filmeAdaugate,user:req.session.user});
	});
	
}); 

app.get('/chestionar', (req, res) => {
	res.render('chestionar', {user: req.cookies.dataUser, intrebari: jsonData});
});

app.post('/rezultat-chestionar', (req, res) => {
	var listaIntrebari;
	var data = fs.readFileSync('intrebari.json');
	listaIntrebari = JSON.parse(data);

	data = req.body
	var userAnswers = []

	for(let answer in data)
	{	
		userAnswers.push(data[answer])
	}

	var result;
	if(userAnswers.length === listaIntrebari.length)
	{
		var nr = 0;
		for(var i = 0; i < listaIntrebari.length; i++)
		{
			if (listaIntrebari[i].corect == userAnswers[i])
			{
				nr++;
			}
		}
		result = "Ai răspuns corect la " + nr + " din " + listaIntrebari.length + " întrebări."
	}
	else
	{
		result = "Vă rugăm să refaceți întreg formularul, bifând câte un răspuns pentru fiecare opțiune!"
	}	
	res.render("rezultat-chestionar", {user: req.cookies.dataUser, quizResult: result});
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`));





