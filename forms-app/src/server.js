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

import express from 'express';
import { join, dirname } from 'path';
import bodyParser from 'body-parser';
import google from '@googleapis/forms';
import { authenticate } from '@google-cloud/local-auth';
import validation from './jsonValidator.js';
import tex2png from './tex2png/tex2png.js';
import {
    updateFormUsingJsonTemplate,
    saveForm,
    deleteAllFormItems,
    getResponses,
    evaluateAnswers
} from './formsFunctions.js';
import cors from 'cors';
import { Low, JSONFile } from 'lowdb';
import { fileURLToPath } from 'url';
import { Workbook } from 'excel4node';

const app = express();
const port = 9090;
app.use(cors());
app.use(bodyParser.json());

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use JSON file for storage
const file = join(__dirname, 'database/db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

var auth, forms;
async function quickstart() {
    auth = await authenticate({
    // eslint-disable-next-line no-undef
        keyfilePath: join(__dirname, 'credentials/credentials.json'),
        scopes: [
            'https://www.googleapis.com/auth/forms.body',
            'https://www.googleapis.com/auth/forms.responses.readonly'
        ],
    });
    forms = google.forms({
        version: 'v1',
        auth: auth,
    });

    // Read data from JSON file, this will set db.data content
    await db.read();
    db.data = db.data || { forms: {} };
}
quickstart();


app.get('/forms/:id', async (req, res) => {
    const id = req.params.id;
    console.log('[GET] /forms: get info about the form \'', id, '\'');

    if(!id || id === ''){
        console.log('\x1b[31m', 'ERROR: wrong id');
        res.status(400).send('ERROR: wrong id');
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
    console.log(
        '[POST] /forms: create a new form with the title \'', title, '\''
    );

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
        const valid = await validation(jsonTemplate);
        if (!valid) {
            throw {
                customName: "NotValid",
                message: "json template is not valid",
                status: 400,
            };
        }

        // * convert tex to png for each question and upload these images 
        // * to imgur
        const links = await tex2png(jsonTemplate, id);
        if(!links) {
            throw {
                customName: "ConversionFailed",
                message: "conversion to png or upload to Imgur failed",
                status: 500,
            };
        }

        const response = await updateFormUsingJsonTemplate(
            forms, id, jsonTemplate, links, formInfo.data
        );

        await saveForm(db, response.data.form, jsonTemplate);

        res.send(response);
    }
    catch(err) {
        if ( err.customName ) {
            console.log('\x1b[31m', 'ERROR:' + err.message);
            res.status(err.status).send(err.message);
        }
        else {
            console.log('\x1b[31m', 'ERROR: server returned error');
            console.error(err);
            res.status(500).send(err);
        }
    }
});


app.get('/forms/:id/answers', async (req, res) => {
    const id = req.params.id;
    console.log(
        '[GET] /forms/id/answers: get all answers submitted \
         to form  \'', id, '\''
    );

    if(!id || id === ''){
        console.log('\x1b[31m', 'ERROR: wrong id');
        res.status(400).send('ERROR: wrong id');
        return;
    }

    try {
        const answers = await getResponses(forms, id);
        res.status(200).send(answers);
    }
    catch( err ){
        console.log('\x1b[31m', 'ERROR: something went wrong');
        console.error(err);
        res.status(500).send(err);
    }
});

function evaluate(id, answers) {
    if(db.data.forms[id].startDate) {
        const startDate = new Date(db.data.forms[id].startDate).getTime();
        answers = answers.filter(
            (answer) => 
                new Date(answer.lastSubmittedTime).getTime() >= startDate
        );
    }
    if(db.data.forms[id].endDate) {
        const endDate = new Date(db.data.forms[id].endDate).getTime();
        answers = answers.filter(
            (answer) => 
                new Date(answer.lastSubmittedTime).getTime() <= endDate
        );
    }

    var scores = answers.map((response) => ({
        respondentEmail: response.respondentEmail,
        evaluation: evaluateAnswers(response, db.data.forms[id].questions),
    }));

    for(var i=0; i < scores.length; i++) {
        scores[i].totalPoints = scores[i].evaluation.reduce(
            (prev, curr) => prev + curr, 0);
        
    }

    return scores;
}

app.get('/forms/:id/scores', async (req, res) => {
    const id = req.params.id;
    console.log(
        '[GET] /forms/id/scores: get test scores'
    );

    if(!id || id === ''){
        console.log('\x1b[31m', 'ERROR: wrong id');
        res.status(400).send('ERROR: wrong id');
        return;
    }

    try {
        var answers = await getResponses(forms, id);
        const scores = evaluate(id, answers);
         
        res.status(200).send(scores);
    }
    catch( err ){
        console.log('\x1b[31m', 'ERROR: something went wrong');
        console.error(err);
        res.status(500).send(err);
    }
});

app.get('/forms/:id/scores/excel', async (req, res) => {
    const id = req.params.id;
    console.log(
        '[GET] /forms/id/scores: get excel with test scores'
    );

    if(!id || id === ''){
        console.log('\x1b[31m', 'ERROR: wrong id');
        res.status(400).send('ERROR: wrong id');
        return;
    }

    try {
        var answers = await getResponses(forms, id);
        const scores = evaluate(id, answers);

        var wb = new Workbook();
        var ws = wb.addWorksheet('Wyniki');
        var headerStyle = wb.createStyle({
            font: {
                bold: true,
            },
            alignment: {
                wrapText: true,
                horizontal: 'center',
            },
            fill: {
                type: 'pattern',
                patternType: 'solid',
                fgColor: '#66adff',
            }
        });
        var emailStyle = wb.createStyle({
            fill: {
                type: 'pattern',
                patternType: 'solid',
                fgColor: '#e0ecff',
            }
        });
        for (let i = 0; i < db.data.forms[id].questions.length; i++) {
            ws.cell(1, i + 2).number(i + 1).style(headerStyle);
        }
        ws.cell(1, db.data.forms[id].questions.length + 2)
            .string('Suma').style(headerStyle);
        
        for(let i = 0; i < scores.length; i++) {
            ws.cell(i + 2, 1).string(scores[i].respondentEmail)
                .style(emailStyle);
            for(let j = 0; j < scores[i].evaluation.length; j++) {
                ws.cell(i + 2, j + 2).number(scores[i].evaluation[j]);
            }
            ws.cell(i + 2, scores[i].evaluation.length + 2)
                .number(scores[i].totalPoints);
        }

        await wb.write(`${__dirname}/excels/${id}.xlsx`);
        res.status(200).sendFile(`${__dirname}/excels/${id}.xlsx`);
    }
    catch( err ){
        console.log('\x1b[31m', 'ERROR: something went wrong');
        console.error(err);
        res.status(500).send(err);
    }
});

app.delete('/forms/:id', async (req, res) => {
    const id = req.params.id;
    console.log(
        '[DELETE] /forms/id/answers: delete form with given id'
    );

    if(!id || id === ''){
        console.log('\x1b[31m', 'ERROR: wrong id');
        res.status(400).send('ERROR: wrong id');
        return;
    }

    try {
        const formInfo = await forms.forms.get({
            formId: id,
        });

        if(formInfo.data.items && formInfo.data.items.length != 0) {
            await deleteAllFormItems(
                forms, id, formInfo.data.items.length, formInfo.data.revisionId
            );
        }

        db.data.forms[id] = undefined;
        await db.write();

        res.status(200).send('Form was deleted from local files \
        and all items in Google Form were deleted but there is \
        still a file in your Google Drive');
    }
    catch( err ){
        console.log('\x1b[31m', 'ERROR: something went wrong');
        console.error(err);
        res.status(500).send(err);
    }
});

// TODO: add fields for:
// TODO: suffling questions and answers,
// update: can't find property to shuffle questions
// TODO: grading tests
// punkty w template:
// if list(radio): punkty w 'points'
// if checkBox: array punktów za poprawnie wybrane: [0, 1, 2] lub [0, 0, 1]
// (index to liczba poprawnie wybranych)
// kara za wybranie nieprawidłowej: odejmujemy od liczby poprawnie wybranych 1
// if grid: array punktów za poprawnie wybrane bez kar
// TODO: cropping pictures
// TODO: zacznij pisać tekst
// TODO: zacznij pisać o jakichś problemach np. dlaczego dwa pliki tex,
// jaka baza danch, google drive i formsy na nim (nic z nimi nie robimy)
// TODO: pomyśl o strukturze
// lista imion i nazwisk z adresami email (dodaj przycisk)
// trzeba wejść i ręcznie kliknąć "zbieraj adresy e-mail", bo
// google nie oferuje tego w API


// Ustawienie portu, na którym serwer nasłuchuje
app.listen(port);
