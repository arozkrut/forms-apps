/*Plik zawierający implementację serwera lokalnego.
* app - aplikacja serwerowa
* port - stała, numer portu serwera
* jsonForm - zmienna przechowująca zakodowany formularz


Serwer korzysta z kilku bibliotek:
* express
* fs - file system
* cors - dostępne na podstawie licencji MIT
* https
* body-parser - dostępne na podstawie licencji MIT
*/
const express = require('express');
const fs = require('fs');
var cors = require('cors');
var https = require('https');
const bodyParser = require('body-parser');
const app = express()
const port = 9090;
app.use(cors());
app.use(bodyParser.json());
var jsonForm;

const path = require('path');
const google = require('@googleapis/forms');
const {authenticate} = require('@google-cloud/local-auth');
// https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fforms.body&response_type=code&client_id=633298823771-e73621214nof0652fcai6sc9jb5lq3gt.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth2callback&flowName=GeneralOAuthFlow

var auth, forms;
async function quickstart() {
  auth = await authenticate({
    keyfilePath: path.join(__dirname, 'credentials/credentials.json'),
    scopes: 'https://www.googleapis.com/auth/forms.body',
  });
  forms = google.forms({
    version: 'v1',
    auth: auth,
  });
}
quickstart();

/*Metoda makeRequest odpowiedzialna za komunikację międzyserwerową.
* options - opcje odwołania (dokładny opis klasy w dokumentacji biblioteki https)
* data - dane do przesłania
Metoda zwraca konstrukcję Promise.
*/
function makeRequest(options, data) {
  return new Promise((resolve) => {
    const request = https.request(options, res => {

      //Obsługa przekierowania:
      if(res.statusCode >= 301 && res.statusCode<=308){
        console.log("Request redirected:" +res.headers.location);
        const newOpt ={
          hostname: 'script.googleusercontent.com',
          path:  res.headers.location.substring(36),
          method: 'GET'
        }
        makeRequest(newOpt, "").then((value) => {resolve(value)});
      }
      else if(res.statusCode==200){
        //Obsługa odpowiedzi z serwera Google'owego
        res.on('data', (chunk) => {
          console.log(`Request resolved with data: ${chunk}`);
          resolve(chunk);
        });
        }
      else {
        //Obsługa pozostałych przypadków
        console.log(`Request resolved with status: ${res.statusCode}`);
        resolve ("Server error");
      }
    })
    //Błąd odwołania
    request.on('error', error => {
      console.error( error)
    })
    //Wysyłane dane (używane przy metodzie POST - generowanie nowego formularza)
    request.write(data);
    request.end();
 });
}


app.post('/forms', async (req, res) => {
  const title = req.body.title;
  console.log('[REQEST] /forms: create form with title \'', title, '\'')
  if(!title || typeof title !== 'string'){
    res.status(400).end();
  }
  else {
    const apiRes = forms.forms.create(
      {
        requestBody: {
          info: {
            title: title
          }
        }
      }
    );
    
    res.send(apiRes);
  }
});


app.put('/forms/:id', async (req, res) => {
  const id = req.params.id
  if(!id || id === ''){
    res.status(400).end();
  }
  else {
    const apiRes = await forms.forms.batchUpdate({
      // Required. The form ID.
      formId: id,

      // Request body metadata
      requestBody: {
        // request body parameters
        includeFormInResponse: true,
        // writeControl: {},
        requests: [
          {
            // informacje o formularzu
            /* updateFormInfo: {
              info: {
                description: "Some test form",
              },
              updateMask: '*',
            }*/
            // jedyne co tu siedzi to zmiana formularza w quiz
            /* updateSettings: {
              settings: {
                quizSettings: {
                  isQuiz: true,
                }
              },
              updateMask: '*',
            } */
            createItem: {
              item: {
                title: 'new item',
                description: 'new test item',
                // one of the following
                questionItem: {
                  question: {
                    required: false,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        {
                          value: 'option0',
                          isOther: false,
                        },
                        {
                          value: 'option1',
                          isOther: false,
                        }
                      ]
                    }
                  },
                  image: {
                    sourceUri: 'https://photos.google.com/share/AF1QipMU54iXdbmFE8YBgFaKYs_bhzicKtzXMl34SBI310DxY2-Vh9xtufL56M423q4FIQ/photo/AF1QipMBeVplCuqX8kHPBtGbZsdYFI4hBPsGvwJ9hwfq?key=TUlmYTNzRzFaTVFRTUpHRGVXam1VNUxuRmdpSlFB'
                  }
                }
              },
              location: {
                index: 0,
              }
            }
          }
          
        ],
      },
    })
    res.send(apiRes);
  }
});

app.put('/forms/:id/json', async (req, res) => {
  const id = req.params.id
  if(!id || id === ''){
    res.status(400).end();
  }
  else {
    jsonForm = req.body;
    //Walidacja pliku:
    const validation = require('./jsonValidator.js')
    validation(jsonForm).then((valid) => {
      var data='';
      if(valid){

        //Konwersja latex'a do zdjęć
        const tex2png = require('./tex2png/tex2png.js');
        tex2png(jsonForm).then((stat) => {

          if(stat) {
            res.status(200).send('OK');
          }
          else {
            res.status(400).send('Latex conversion failed');
          }
        }).catch({});
      }
      else{
        res.status(400).send('Wrong JSON format');
      }
    }).catch({})
    req.on('error', error => {
      res.status(400).send("Server error: " + error);
    })
  }
})


/*Definicja zachowania serwera na ścieżce ,,/uploadJsonFile''.
  Ścieżka służy do przechwycenia kodowania JSON, sprawdzenia jego zgodności
  ze schematem oraz konwersji wstawek matematycznych.
*/
app.post('/uploadJsonFile', (req, res) =>{
  jsonForm = req.body;
  console.log("Uploaded: ");
  console.log(jsonForm);
  //Walidacja pliku:
  const validation = require('./jsonValidator.js')
  validation(jsonForm).then((valid) => {
    console.log("Validation finished");
    var data='';
    if(valid){

      //Konwersja latex'a do zdjęć
      const tex2png = require('./tex2png/tex2png.js');
      tex2png(jsonForm).then((stat) => {

        if(stat) {
          console.log("Conversion finished.");
          res.set('Content-Type', 'text/html')
          res.send(Buffer.from('<p>JSON validation and latex conversion succeded.</p>'));
        }
        else {
          console.log("Conversion failed");
          res.status(400).set('Content-Type', 'text/html').send(Buffer.from('<p>Latex conversion failed</p>'))
        }
      }).catch({});
    }
    else{
      res.status(400).set('Content-Type', 'text/html').send(Buffer.from('<p>Wrong JSON format</p>'))
    }
  }).catch({})
  req.on('error', error => {
    res.status(400).set('Content-Type', 'text/html').send(Buffer.from("Server error " +error));
  })
})



/*Definicja zachowania serwera na ścieżce ,,/createForm''.
  Ścieżka służy do komunikacji z aplikacją po stronie Google'a w celu
  utworzenia nowego formularza.
*/
app.get('/createForm', (req, res) =>{
  //Zamiana tekstu ze wstawkami w latex'u na zdjęcia kodowane w base64
  for(var i in jsonForm.questions){
    if(jsonForm.questions[i].tex){
      try {
        const data = fs.readFileSync('pictures/base64'+i+'.txt', 'utf8')
        jsonForm.questions[i].text = data
      } catch (err) {
        console.error(err)
      }
    }
  }


  const encodedForm = JSON.stringify(jsonForm);

  //Ustawienie parametrów odwołania HTTP
  //Ścieżka dotyczy aplikacji internetowej umieszczonej na serwerach Google'a
  var data = '';
  const options = {
    hostname: 'script.google.com',
    path: '/macros/s/AKfycbxOJXEmayqgV858S6JfPJycVryYmkkpGqlvG_MM88rKRfy_C1Kt9JHD9h3eAmpCZX1wPA/exec',
    method: 'POST',
    headers: {
     'Content-Type' : 'application/json',
     'Content-Length': Buffer.from(encodedForm).length,
     'Accept': '*/*'
   }
  }

  console.log("REQUEST   :   "+ options.hostname+options.path);
  //Wysłanie zapytania. Zwracana wartość to identyfikator nowoutworzonego formularza
  makeRequest(options, encodedForm).then((newId) => {
    //Ustawienie danych do obsługi utworzonych formularzy
    const d = new Date();
    const date =  d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
    let newFormData = '{"id":"'+ newId+'", "date": "' +date +'", "name":"'+ jsonForm.title+'"}';

    //Zmiany w pliku memoryFile.js:
    let memory = fs.readFileSync('memoryFile.js', 'utf8');
    let mem="";
    if(memory[memory.length-4]=="'")  mem=JSON.parse(memory.substring(27, memory.length-4));
    else  mem=JSON.parse(memory.substring(27, memory.length-3));
    mem.forms.push(JSON.parse(newFormData));
    let newMemory = "const memory = JSON.parse('"+JSON.stringify(mem)+"');";
    fs.writeFile('memoryFile.js', Buffer.from(newMemory), (err) => {
      if (err) throw err;
      console.log('Memory file has been saved.');
    });
  }).then(() => {
    res.status(200).set('Content-Type', 'text/html').send(Buffer.from("New form has been created. Please reload the page"));
  }).catch(()=> {})
})


/*Definicja zachowania serwera na ścieżce ,,/getInfo''.
  Ścieżka służy do komunikacji z aplikacją po stronie Google'a w celu
  przetwarzania istniejących formularzy.
*/
app.get('/getInfo', (req, res) =>{
  var encodedRequest ="formId="+req.query.formId+"&action="+req.query.action;
  console.log("encodedRequest "+encodedRequest);
  //Ustawienie parametrów wysyłanego zapytania
  //Ścieżka dotyczy aplikacji internetowej umieszczonej na serwerach Google'a
  const options = {
    hostname: 'script.google.com',
    path: '/macros/s/AKfycbxOJXEmayqgV858S6JfPJycVryYmkkpGqlvG_MM88rKRfy_C1Kt9JHD9h3eAmpCZX1wPA/exec?'+encodedRequest,
    method: 'GET'
  }
  console.log("REQUEST   :   "+ options.hostname+options.path);
  makeRequest(options, "").then((requestedData) =>{
    if(req.query.action=='editorUrl' || req.query.action=='publisherUrl')
      requestedData = '<a href="'+requestedData+'">'+requestedData+'</a>'
    //Zarządzanie usuwaniem formularza z listy:
    if(req.query.action=='delete'){
      let memory = fs.readFileSync('memoryFile.js', 'utf8');
      let mem="";
      if(memory[memory.length-4]=="'")   mem=JSON.parse(memory.substring(27, memory.length-4));
      else mem=JSON.parse(memory.substring(27, memory.length-3));
      for(var i in mem.forms){
        if( mem.forms[i].id == req.query.formId) delete mem.forms[i];
      }
      mem.forms = mem.forms.filter(function(x) { return x !== null });
      let newMemory = "const memory = JSON.parse('"+JSON.stringify(mem)+"');";
      fs.writeFile('memoryFile.js', Buffer.from(newMemory), (err) => {
        if (err) throw err;
        console.log('Memory file has been saved.');
      });
    }
    res.status(200).set('Content-Type', 'text/html').send(Buffer.from(requestedData));

  }).catch(()=>{})

})


//Ustawienie portu, na którym serwer nasłuchuje
app.listen(port);
