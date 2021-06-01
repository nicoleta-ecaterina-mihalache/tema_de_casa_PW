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
const e = require('express');

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

app.get('/', (req, res) => 
{
	res.render('acasa', {user: req.cookies.dataUser, data: req.session });
});

app.get('/filme', (req, res) => {
	asyncCall();
	res.render('filme', {user: req.cookies.dataUser, filme: records});
});

app.get('/autentificare', (req, res) => {
	let mesajEroare = req.cookies.mesajEroare;
	let mesaj_date_nex = req.cookies.mesaj_date_nex
	res.render('autentificare', {user: req.cookies.dataUser, eroare1: mesajEroare, eroare: mesaj_date_nex});
});

app.get("/inregistrare", (req, res) => {
	let mesaj = req.cookies.mesaj;
	let eroare = req.cookies.eroare;
	let mesajeroare = req.cookies.mesajeroare;
	res.render('inregistrare', {user: req.cookies.dataUser, eroare2:mesajeroare, eroare1: eroare, eroare: mesaj});
});


app.post('/verificare-autentificare', (req, res) => {
	let gasit = false;
	fs.readFile('utilizatori.json', (err,data) => {
		if(err) throw err;
		utilizatori = JSON.parse(data);
	});
	for(let i=0; i < utilizatori.length; i++)
	{
		if(req.body.user != "" && req.body.password != "")
		{
			if(utilizatori[i].user == req.body.user && utilizatori[i].password == req.body.password)
			{
				res.cookie("dataUser", {user: req.body.user, password: req.body.password, rol: req.body.rol});
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
		else
		{
			res.cookie("mesaj_date_nex", "Nu ați introdus date!"); 
			res.redirect('/autentificare');
			return;
		}
	}
	if(!gasit)
	{
		res.cookie("mesajEroare", "User invalid și/sau parolă invalidă!"); 
		res.redirect('/autentificare');
	}
	res.end();
});

app.post('/verificare-inregistrare' ,(req, res) => {
	let gasit = false;
	if(req.body.user != "" && req.body.password !="" && req.body.password2)
		if(req.body.password == req.body.password2)
		{
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
		}
		else
		{
			res.cookie("eroare", "Datele introduse sunt incorecte!"); 
			res.redirect('/inregistrare');
		}	
	else
	{
		res.cookie("mesajeroare", "Nu ați introdus date!"); 
		res.redirect('/inregistrare');
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


function startTime() 
{
  var today = new Date();
  var d = today.getDate();
  var mt = today.getMonth();
  var y= today.getFullYear();

  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  var data = "Data: " + d + "-" + mt + "-" + y + " Ora: " + h + ":" + m + ":" + s;
  return data;
}

app.get('/get_data', (req, res) => {
	var data = startTime();
	var dat = data.toString();
	console.log(dat);
	res.send(dat);
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
			[null,'Oxygene', '20lei','100min','12:40', 'Drama, Fantezie, SF','2D, FR (SUB: RO)', 'https://www.youtube.com/embed/8IqXgZd-P98'],
			[null,'Justice Society', '22lei','84min','13:50', 'Actiune, Animatie, Aventura','2D, EN (SUB: RO)', 'https://www.youtube.com/embed/s4xXbGFhEFg'],
			[null,'Taking a Shot at Love', '20lei','84min', '16:20', 'Drama, Romantic','EN (SUB: RO)', 'https://www.youtube.com/embed/-ApvNcVaIlc'],
			[null,'In bataia pustii', '25lei','108min', '18:10', 'Actiune, Drama, Thriller','EN (SUB: RO)', 'https://www.youtube.com/embed/VXoq3i_HNAc'],
			[null,'Tinutul nomazilor', '20lei','108min', '20:30', 'Drama','EN (SUB: RO)', 'https://www.youtube.com/embed/_v6EnREcZGE'],
			[null,'Bad Trip', '21lei','84min', '22:30', 'Drama, Comedie','EN (SUB: RO)', 'https://www.youtube.com/embed/UjT9I6eb4p8'],
			[null,'Cats & Dogs 3', '20lei','84min', '17:30', 'Actiune, Animatie, Aventura','EN (SUB: RO)', 'https://www.youtube.com/embed/ct5mQYE3Xk4'],
			[null,'Oslo', '26lei','118min', '00:30', 'Drama, Istoric, Suspans','EN (SUB: RO)', 'https://www.youtube.com/embed/QsRlXQcHd8c'],
			[null,'Miracolul albastru', '24lei','96min', '22:30', 'Aventura, Drama, Istoric','EN (SUB: RO)', 'https://www.youtube.com/embed/pXHCBnT3d4k'],
			[null,'Mission Possible', '26lei','104min', '21:30', 'Actiune, Comedie, Crima','EN (SUB: RO)', 'https://www.youtube.com/embed/pKuI631JhY0'],
			[null,'Wrath of Man', '22lei','118min', '22:00', 'Actiune, Suspans','EN (SUB: RO)', 'https://www.youtube.com/embed/EFYEni2gsK0']
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
		res.render('vizualizare-cos',{filme: filmeAdaugate, user:req.session.user});
	});
}); 

app.get('/adaugare-BD', (req, res) => {
	res.render('adaugare-BD',{mesaj:"Film adaugat cu succes!",user:req.session.user});
});

app.post('/adauga-BD', (req, res) => {
	let data=[];
	data.push(Number(req.body.id));
	data.push(req.body.film);
	data.push(req.body.pret);
	data.push(req.body.durata);
	data.push(req.body.ora);
	data.push(req.body.gen);
	data.push(req.body.detalii);
	data.push(req.body.trailer);
	con.connect(function(err) {
		if (err) throw err;
		console.log("Connected!");
		con.query("USE cumparaturi");
		con.query("INSERT INTO filme (id, film, pret, durata, ora, gen, detalii, trailer)VALUES (?,?,?,?,?,?,?,?)",data,function (err, result) {
			if (err) throw err;
			console.log("Film adaugat cu succes!");
			res.render('adaugare-BD');
		});		
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





