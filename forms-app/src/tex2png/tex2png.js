/*Plik implementuje delegowanie obliczeń związanych ze zdjęciami do zewnętrzego
  skryptu.
  Zwracana jest konstrukcja Promise.
  Funkcja wykorzystuje moduł child_process.
*/
const {spawn} = require('child_process');

module.exports = function (jsonForm, id){
  return new Promise((resolve) => {

    var qst = jsonForm.questions;
    var done = 0;
    var startedJobs = 0;
    var links = {};

    for(var q of qst) {
      if(q.tex) {
        startedJobs++;
      }
      for (var answer in q.answers) {
        if(answer.tex) {
          startedJobs++;
        }
      }
    }

    if(startedJobs == 0) resolve({});

    const exitFun = (exitCode) => {
      if(exitCode != 0){
        resolve(null);
      }
      //Implementacja oczekiwania, aż wszystkie podprocesy się zakończą (poprawnie)
      done++;
      if( done === startedJobs ) resolve(links);
    };

    for(var i in qst){
      if( qst[i].tex ){
        const python = spawn('python3', [ './src/tex2png/tex2png.py', qst[i].text, id + 'question' + i ]);
        python.stdout.on('data', (data) => {
          links['q' + i] = data.toString();
        });
        python.on('exit', exitFun);

        if(qst[i].answers && qst[i].answers.length > 0) {
          for(var j in qst[i].answers) {
            if(qst[i].answers[j].tex) {
              const python = spawn('python3', [ './src/tex2png/tex2png.py', qst[i].answers[j].text, id + 'question' + i + 'answer' + j ]);
              python.stdout.on('data', (data) => {
                links['q' + i + 'a' + j] = data.toString();
              });
              python.on('exit', exitFun);
            }
            
          }
        }
      }
    }
  });
};
