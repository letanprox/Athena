const http = require("http");
const fs = require("fs");
const {google} = require('googleapis');
const { spawn } = require('child_process');
let MongoClient = require('mongodb').MongoClient;
let urli = "mongodb://localhost:27017/";

let keyx = 'khonglammamuoncoanthichicoandaubuoiancut';

MongoClient.connect(urli , { useUnifiedTopology: true } ,async function(err, db) {
http.createServer(async function (req, response) {
  if (err) throw err;

  let firstrl = String(String(req.url).replace('/', '').replace(' ','')).split('/');
  let keytemp = String(firstrl[0]);
  let nameFile = 'boruto_tap_200.mp4';

  console.log('conect')

if(true){
    let dbo = await db.db("roxydb");
        dbo = await dbo.collection("danh_sach_drivelist");
    let query = {name:nameFile};
    let select = await dbo.find(query).project({_id:0,name:0}).toArray();

    if(select.length >= 1){
    let index = select[0].index;
    let fileId = select[0].id;
    let videoSize = select[0].size;

    dbo = await db.db("aidb");
    dbo = await dbo.collection("danh_sach_driveapi");

    query = { index: Number(index)};
    select = await dbo.find(query).toArray();
        access_token = select[0].access_token;
        let oAuth2Client = new google.auth.OAuth2();
            oAuth2Client.setCredentials({
            access_token:access_token,
            scope: 'https://www.googleapis.com/auth/drive',
        });
    let drive = google.drive({version: 'v3', auth:oAuth2Client});

    let range = req.headers.range;
    if(!range) range = 'bytes=0-1';

    const parts = range.replace(/bytes=/, "").split("-");
    if(parts[1]){

        console.log('-----------------');
        console.log('ios');
        console.log('Range first - '+range);

        let start = parseInt(parts[0], 10);
        let end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;

        const contentLength = end - start + 1;
        response.writeHead(206, { 
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Expose-Headers': '*',
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
        });

        console.log(nameFile+' ^ Range' + 'bytes='+start+'-'+end);

        // const CHUNK_SIZE = 1000*1000*1;

        let exit = true;
        req.on("close", function(err) {
            exit = false;
        });

        // let xstart = start;
        // let xend = Math.min(start + CHUNK_SIZE -1, end);

        // async function enGine(){
      
        //         if((Number(xend) - Number(xstart)) >= CHUNK_SIZE-100) await new Promise(resolve => setTimeout(resolve, 1000));
                
        //         console.log('create');

        //         drive.files.get({fileId: fileId, alt: 'media',headers:{'Range': 'bytes='+xstart+'-'+xend, connection: 'keep-alive'}}, {responseType: 'stream'},
        //             function(err, res){
        //                 res.data.on('data', function(chunk){
        //                     if(exit == true) response.write(chunk);
        //                     else response.end();
        //                 });
        //                 res.data.on('end', function(){
        //                     if(exit == true){
        //                         if(xend < end){
        //                             xstart = Math.min(xend + 1 , end);
        //                             xend = Math.min(xstart + CHUNK_SIZE -1, end);
        //                             if(xstart != xend) enGine();
        //                             else response.end();
        //                         }else response.end();
        //                     }else response.end();                    
        //                 });                    
        //             }
        //         );
            
        // }
        // enGine();


        const CHUNK_SIZE = 1000*1000*1;
        let xstart;
        let kstart;
        let kend;
        
        if(!range.includes('=0-1')){
            xstart = String(start);
            xstart = Number(xstart.substring(0,Number(xstart.length)-6));
            xstart = (xstart+1)*CHUNK_SIZE;
            kstart = start;
            kend = xstart;
        }else{
            xstart = 0;
            start = 0;
            end = 1;
            kstart = 0;
            kend = 1;
        }
 
        function enGine(){
            let check = false;
            if (fs.existsSync('Cache/'+nameFile+'Range' + 'bytes='+kstart+'-'+kend)){
              let filesize = fs.statSync('Cache/'+nameFile+'Range' + 'bytes='+kstart+'-'+kend);
              if(Number(filesize.size) >= CHUNK_SIZE - 2 && Number(filesize.size) <= CHUNK_SIZE + 2) check = true;
            } 

            if(check == false){
                console.log('create');
                let dest;
                if(Number(start) != Number(kstart) && Number(end) != Number(kend)) dest = fs.createWriteStream('Cache/'+nameFile+'Range' + 'bytes='+kstart+'-'+kend);
                
                drive.files.get({fileId: fileId, alt: 'media',headers:{'Range': 'bytes='+kstart+'-'+kend, connection: 'keep-alive'}}, {responseType: 'stream'},
                    function(err, res){
                        res.data.on('data', function(chunk){
                            if(exit == true) response.write(chunk);
                            else response.end();
                        });
                        res.data.on('end', function(){
                            if(exit == true){
                                if(kend < end){
                                    kstart = Math.min(kend + 1 , end);
                                    kend = Math.min(kstart + CHUNK_SIZE -1, end);
                                    if(kstart != kend) enGine();
                                    else response.end();
                                }else response.end();
                            }else response.end();                    
                        });                    
                        if(Number(start) != Number(kstart) && Number(end) != Number(kend)) res.data.pipe(dest);
                    }
                );
            }else{
                console.log('loadcache')
                let readstream = fs.createReadStream('Cache/'+nameFile+'Range' + 'bytes='+kstart+'-'+kend);
                readstream.on('data', function (chunk) {
                    if(exit == true) response.write(chunk);
                    else response.end();
                }); 
                readstream.on('end', function () {
                    if(exit == true){
                        if(kend < end){
                            kstart = Math.min(kend + 1 , end);
                            kend = Math.min(kstart + CHUNK_SIZE - 1, end);
                            if(kstart != kend) enGine();
                            else response.end();
                        }else response.end();
                    }else response.end();  
                }); 
            }
        }
        enGine();

    }else{
        console.log('-----------------');
        console.log('android');
        console.log('Range first - '+range);

        const CHUNK_SIZE = 1000*1000*1;
        let xstart = String(range.replace(/\D/g, ""));
            xstart = Number(xstart.substring(0,Number(xstart.length)-6));
        let xend = (Number(xstart)+1)
            if(xstart >= 1) xstart = xstart*CHUNK_SIZE+1;
            else xstart == 0;
            xend = xend*CHUNK_SIZE;
    
        let start = Number(String(range.replace(/\D/g, "")));
        let end;
        if(xend > (videoSize - CHUNK_SIZE - 1) && xend < videoSize) end = videoSize - 1;
        else end = Math.min(xend, videoSize - 1);
        
        const contentLength = end - start + 1;
        response.writeHead(206, { 
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': '*',
        });
    
        console.log(nameFile+' ^ Range' + 'bytes='+start+'-'+end);
    
        let check = false;
        if (fs.existsSync('Cache/'+nameFile+'Range' + 'bytes='+start+'-'+end) && (Number(start) == Number(xstart))){
          let filesize = fs.statSync('Cache/'+nameFile+'Range' + 'bytes='+start+'-'+end);
          if(start != 0 && end != CHUNK_SIZE) if(Number(filesize.size) >= CHUNK_SIZE - 2 && Number(filesize.size) <= CHUNK_SIZE + 2) check = true;
        } 
    
        if(check == false){
            console.log('create');
            let dest;
            if(Number(start) == Number(xstart)) dest = fs.createWriteStream('Cache/'+nameFile+'Range' + 'bytes='+start+'-'+end);
            drive.files.get({fileId: fileId, alt: 'media',headers:{'Range': 'bytes='+start+'-'+end, connection: 'keep-alive'}}, {responseType: 'stream'},
                function(err, res){
                    res.data.pipe(response);
                    if(Number(start) == Number(xstart)) res.data.pipe(dest);
                }
            );
        }else{
            console.log('loadcache')
            fs.createReadStream('Cache/'+nameFile+'Range' + 'bytes='+start+'-'+end).pipe(response); 
        }
    }

    }else{
        response.writeHead(401);
        response.write('not find resource');
        response.end();
    }
}else{
    response.writeHead(401);
    response.write('can key deload');
    response.end();
}
}).listen(2000);
});