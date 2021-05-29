const fs = require("fs");
const FolderCache = 'Cache';

let clocktime = 1;

async function datax(){
    console.log("RunCache: " + clocktime);
    clocktime = clocktime + 1;

fs.readdir(FolderCache, (err, files) => {
    files.forEach(file => {
        let filesize = fs.statSync('Cache/'+file);
        console.log(filesize.size + '=' + caculateDay(filesize.mtime))
        if(Number(caculateDay(filesize.mtime)) >= 600)
            fs.unlinkSync('Cache/'+file);
      });
  });
};

let caculateDay = (day)=>{
  date1 = new Date(day);
  var today = new Date();
  var date = today.getFullYear()+'/'+(today.getMonth()+1)+'/'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  date2 =  new Date(date+' '+time);    
  time = Math.abs(((date2.getTime() - date1.getTime())/1000));
  return Math.floor(time / (60));                  
}

datax();
setInterval(function() {
    datax();
}, 600000);
