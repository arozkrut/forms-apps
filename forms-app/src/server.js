/* Plik zawierający implementację serwera lokalnego.
 * app - aplikacja serwerowa
 * port - stała, numer portu serwera
 * jsonForm - zmienna przechowująca zakodowany formularz
*/

/* Serwer korzysta z kilku bibliotek:
 * express
 * fs - file system
 * cors - dostępne na podstawie licencji MIT
 * https
 * body-parser - dostępne na podstawie licencji MIT
*/

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const google = require('@googleapis/forms');
const {authenticate} = require('@google-cloud/local-auth');
const validation = require('./jsonValidator.js');
const tex2png = require('./tex2png/tex2png.js');
var cors = require('cors');

const app = express();
const port = 9090;
app.use(cors());
app.use(bodyParser.json());

var auth, forms;
async function quickstart() {
  auth = await authenticate({
    // eslint-disable-next-line no-undef
    keyfilePath: path.join(__dirname, 'credentials/credentials.json'),
    scopes: 'https://www.googleapis.com/auth/forms.body',
  });
  forms = google.forms({
    version: 'v1',
    auth: auth,
  });
}
quickstart();


app.post('/forms', async (req, res) => {
  const title = req.body.title;
  console.log('[POST] /forms: create a new form with the title \'', title, '\'');

  if(!title || typeof title !== 'string'){
    res.status(400).end();
    console.log('\x1b[31m', 'ERROR: wrong title');
  }
  else {
    try {
      const apiRes = await forms.forms.create({
        requestBody: {
          info: {
            title: title
          }
        }
      });
      res.send(apiRes);
      console.log('\x1b[32m', "OK");
    }
    catch(err) {
      console.log('\x1b[31m', 'ERROR: something went wrong');
      console.error(err);
      res.status(400).send(err);
    }
  }
});


app.put('/forms/:id', async (req, res) => {
  const id = req.params.id;
  console.log('[PUT] /forms: update the form \'', id, '\'');

  if(!id || id === ''){
    res.status(400).end();
    console.log('\x1b[31m', 'ERROR: wrong id');
  }
  else {
    // * check if form exists
    try {
      await forms.forms.get({
        formId: id,
      });
    }
    catch(err) {
      console.log('\x1b[31m', 'ERROR: form was not found');
      console.error(err);
      res.status(404).send(err);
      return;
    }

    // * validate json
    const jsonTemplate = req.body;

    validation(jsonTemplate).then((valid) => {
      if (valid) {
        tex2png(jsonTemplate, id).then((stat) => {
          // * convert tex to png for each question
          if(stat) {
            // TODO: update form
          }
          else {
            console.log('\x1b[31m', 'ERROR: conversion to png failed');
            res.status(400).end();
            return;
          }
        });
      }
      else {
        res.status(400).send("Error: json template is not valid");
        console.log('\x1b[31m', 'ERROR: json template is not valid');
        return;
      }
    });
  }
});


//Ustawienie portu, na którym serwer nasłuchuje
app.listen(port);
