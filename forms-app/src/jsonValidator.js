/*Plik zawiera metodę sprawdzającą zgodność kodowania JSON ze schematem.
  Metoda zwraca konstrukcję Promise - ze względu na konieczność synchronizacji
  wykonywanych funkcji.

  Moduł wykorzystywany w programie - jsonschema
  (https://www.npmjs.com/package/jsonschema) jest dostępny na podstawie
  licencji MIT:

jsonschema is licensed under MIT license.

Copyright (C) 2012-2019 Tom de Grunt <tom@degrunt.nl>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import { Validator } from 'jsonschema';
function validation(json){
    return new Promise((resolve) => {
        var validator = new Validator();
        //schemat pytania:
        var question = {
            "id": "/question",
            "type": "object",
            "required": [ "type", "text", "tex" ],
            "properties": {
                "type": {
                    "type": "string",
                    "enum": [ "checkBox", "grid", "text", "list" ]
                },
                "text": {"type": "string"},
                "tex": {"type": "boolean"},
                "answers": { "type": "array", "items" : {
                    "text" : {"type" : "string"},
                    "tex": {"type": "boolean"},
                    "correct" : {"type" : "boolean"}
                }
                },
                "points": {"type": "number"}
            }
        };
        //schemat formularza
        var schema = {
            "id": "/schema",
            "type": "object",
            "required": [ "title", "questions" ],
            "properties": {
                "title": {"type": "string"},
                "check": {"type": "boolean"},
                "questions": {"type": "array", "items": {"$ref": "question"}}
            }
        };
        validator.addSchema(question, '/question');
        resolve( validator.validate(json, schema).valid );
    });
}

export default validation;