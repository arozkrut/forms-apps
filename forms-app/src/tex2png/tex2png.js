/*Plik implementuje delegowanie obliczeń związanych ze zdjęciami do zewnętrzego
  skryptu.
  Zwracana jest konstrukcja Promise.
  Funkcja wykorzystuje moduł child_process.
*/
import { spawn } from 'child_process';

function tex2png(jsonForm, id){
    return new Promise((resolve) => {

        var qst = jsonForm.questions;
        var done = 0;
        var startedJobs = 0;
        var links = {};

        for(var q of qst) {
            if(q.tex) {
                startedJobs++;
            }
            
            if(q.answers){
                for (var answer of q.answers) {
                    if(answer.tex) {
                        startedJobs++;
                    }
                }
            }
            
        }

        if(startedJobs == 0) resolve({});

        const exitFun = (exitCode) => {
            if(exitCode != 0){
                resolve(null);
            }
            // * Implementacja oczekiwania, aż wszystkie podprocesy się  
            // * zakończą (poprawnie)
            done++;
            if( done === startedJobs ) resolve(links);
        };

        for(var i in qst){
            const questionNumber = i;

            if( qst[i].tex ){
                const pythonQuestion = spawn(
                    'python3',
                    [ 
                        './src/tex2png/tex2png.py',
                        qst[questionNumber].text,
                        id + 'question' + questionNumber 
                    ]
                );
                pythonQuestion.stdout.on('data', (data) => {
                    links['q' + questionNumber] = data.toString();
                });
                pythonQuestion.stderr.on('data', function(data) {
                    console.log('stderr: ' + data);
                });
                pythonQuestion.on('exit', exitFun);
            }

            if(qst[i].answers && qst[i].answers.length > 0) {
                for(var j in qst[i].answers) {
                    const answerNumber = j;

                    if(qst[questionNumber].answers[answerNumber].tex) {
                        const pythonAnswer = spawn(
                            'python3',
                            [ 
                                './src/tex2png/tex2png.py',
                                qst[questionNumber].answers[answerNumber].text,
                                id + 'question' + questionNumber + 'answer' + 
                                answerNumber 
                            ]
                        );
                        pythonAnswer.stdout.on('data', (data) => {
                            links[
                                'q' + questionNumber + 'a' + answerNumber
                            ] = data.toString();
                        });
                        pythonAnswer.on('exit', exitFun);
                        pythonAnswer.stderr.on('data', function(data) {
                            console.log('stderr: ' + data);
                        });
                    }
                }
            }
        }
    });
}

export default tex2png;
