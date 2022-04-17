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

app.get('/forms/:id', async (req, res) => {
  const id = req.params.id;
  console.log('[GET] /forms: get info about the form \'', id, '\'');

  if(!id || id === ''){
    console.log('\x1b[31m', 'ERROR: wrong id');
    res.status(400).end();
    return;
  }

  try {
    const response = await forms.forms.get({
      formId: id,
    });
    res.send(response);
  }
  catch( err ){
    console.log('\x1b[31m', 'ERROR: form was not found');
    console.error(err);
    res.status(404).send(err);
  }
});


app.post('/forms', async (req, res) => {
  const title = req.body.title;
  console.log('[POST] /forms: create a new form with the title \'', title, '\'');

  if(!title || typeof title !== 'string'){
    console.log('\x1b[31m', 'ERROR: wrong title');
    res.status(400).end();
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
    console.log('\x1b[31m', 'ERROR: wrong id');
    res.status(400).end();
    return;
  }

  // * check if form exists
  try {
    const formInfo = await forms.forms.get({
      formId: id,
    });

    const jsonTemplate = req.body;

    // * validate json
    validation(jsonTemplate)
    .then((valid) => {
      if (!valid) {
        throw {
          customName: "NotValid",
          message: "json template is not valid",
          status: 400,
        };
      }
    })
    // * convert tex to png for each question and upload these images to imgur
    .then(() => tex2png(jsonTemplate, id))
    .then((links) => {
      if(!links) {
        throw {
          customName: "ConversionFailed",
          message: "conversion to png or upload to Imgur failed",
          status: 500,
        };
      }
      return links;
    })
    // TODO: update form
    .then((links) => updateFormUsingJsonTemplate(id, jsonTemplate, links, formInfo.data));
    
  }
  catch(err) {
    if ( err.customName ) {
      console.log('\x1b[31m', 'ERROR:' + err.message);
      res.status(err.status).send(err.message);
    }
    else {
      console.log('\x1b[31m', 'ERROR: form was not found');
      console.error(err);
      res.status(404).send(err);
    }
  }
});

// TODO: add fields for form description, suffling questions and answers, remove email field
// TODO: add option for tex answers
// TODO: grading tests
async function updateFormUsingJsonTemplate(id, jsonTemplate, links, formInfo) {
  if ( jsonTemplate.title != formInfo.info.title ) {
    forms.forms.batchUpdate({
      formId: id,
      requestBody: {
        includeFormInResponse: false,
        requests: [ {
          updateFormInfo: {
            info: {
              title: jsonTemplate.title
            },
            updateMask: "title"
          }
        } ],
        writeControl: {
          "requiredRevisionId": formInfo.revisionId
        }
      }
    });
  }

  const mapQuestion = (q, index) => {
    var question;
    if( q.type === 'checkBox' ) {
      question = {
        choiceQuestion: {
          type: "CHECKBOX",
          options: []
        }
      };
    }
    return {
      question: question,
      image: q.tex 
        ? {
          sourceUri: links["q" + index],
          properties: {
            alignment: "CENTER"
          }
        }
        : undefined
    };
  };

  if( !formInfo.items) {
    var requests = { ...jsonTemplate.questions };
    requests.map((q, index) => ({
      createItem: {
        item: {
          questionItem: mapQuestion(q, index),
          description: q.tex
            ? undefined
            : q.text
        },
        location: {

        }
      }})
    );

    forms.forms.batchUpdate({
      formId: id,
      requestBody: {
        includeFormInResponse: false,
        requests: [ {
          
        } ],
        writeControl: {
          "requiredRevisionId": formInfo.revisionId
        }
      }
    });
  }
}

// Ustawienie portu, na którym serwer nasłuchuje
app.listen(port);
