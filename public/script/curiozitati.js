function incarcaCuriozitati()
{
    var xhttp = new XMLHttpRequest();
    let r ='/get_curiozitati';
    xhttp.onreadystatechange = function(){
        if(this.readyState ==4 && this.status ==200)
        {
            var obj =JSON.parse(this.responseText);
            //document.getElementById('curiozitati').innerHTML+=obj.curiozitati;
            for(var i=0;i<=obj.curiozitati.length;i++)
            {
                document.getElementById('curiozitati').innerHTML += "<br />&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;" +obj.curiozitati[i].c;
            }
        }
    }
    xhttp.open("GET", r, true);
    xhttp.send();
}

function incarcaData()
{
    var xhttp = new XMLHttpRequest();
    let r ='/get_data';
    xhttp.onreadystatechange = function(){
        if(this.readyState ==4 && this.status ==200)
        {
            document.getElementById('data+ora').innerHTML = this.responseText;
        }
    }
    xhttp.open("GET", r, true);
    xhttp.send();
}

