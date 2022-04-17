/*Plik implementuje delegowanie obliczeń związanych ze zdjęciami do zewnętrzego
  skryptu.
  Zwracana jest konstrukcja Promise.
  Funkcja wykorzystuje moduł child_process.
*/
const {spawn} = require('child_process');

module.exports = function (jsonForm, id){
  return new Promise((resolve) => {
    var qst = jsonForm.questions;
    var done=0;
    var links = {};
    for(var i in qst){
      if(qst[i].tex){
        const python = spawn('python3', [ './src/tex2png/tex2png.py', qst[i].text, id + 'question' + i ]);
        python.stdout.on('data', (data) => {
          links['q' + i] = data.toString();
        });
        python.on('exit', (exitCode) => {
          if(exitCode != 0){
            resolve(null);
          }
          //Implementacja oczekiwania, aż wszystkie podprocesy się zakończą (poprawnie)
          done++;
          if(done===qst.length) resolve(links);
        });
      }
      else done++;
    }
  });
};
