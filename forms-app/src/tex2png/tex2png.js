/*Plik implementuje delegowanie obliczeń związanych ze zdjęciami do zewnętrzego
  skryptu.
  Zwracana jest konstrukcja Promise.
  Funkcja wykorzystuje moduł child_process.
*/
const {spawn} = require('child_process');

module.exports = function (jsonForm){
  return new Promise((resolve) => {
    var qst = jsonForm.questions;
    var done=0;
    for(var i in qst){
      if(qst[i].tex){
        const python = spawn('python3', ['tex2png.py', qst[i].text, i]);
        python.on('exit', (exitCode)=>{
          if(exitCode!= 0){
            resolve(false);
          }
          //Implementacja oczekiwania, aż wszystkie podprocesy się zakończą (poprawnie)
          done++;
          if(done===qst.length) resolve(true);
        })
      }
      else done++;
    }
  })
}
