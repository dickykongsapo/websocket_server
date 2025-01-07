const { Console } = require('console')
let fs = require('fs')
const http = require('http')
const express = require('express')
const jwt = require('jsonwebtoken');

WebSocket = require('ws')

if (process.argv.length < 3) {
    process.exit()
}

let stream_secret = process.argv[2]
let stream_port = process.argv[3] || 8081
let websocket_port = process.argv[4] || 8082
let record_stream = false;
let jwtSecret = 'shhhhh'
let totalSize = 0;




//Websocket Server
const initWebSocket = (websocket_port) => {
    let clientMap = new Map()
    let socketServer = new WebSocket.Server({
        port: websocket_port,
        perMessageDeflate: false
    });
    socketServer.on('connection', function (socket, upgradeReq) {
        let url = upgradeReq.socket.remoteAddress + upgradeReq.url;
        let key = url.substr(1).split('/')[1];
        var clients = clientMap.get(key);
        // console.log(url + '\n')
        console.log(key + '\n')

        // console.log(clients + '\n')
        if (!clients) {
            clients = new Set();
            clientMap.set(key, clients);
        }

        // console.log(clientMap + '\n')

        //Trial 1
        // if (url.includes('?')) {
        //     let token = url.substr(1).split('/')[1].split('?')[1].substr(6)
        //     if (token == sampleToken) {
        //         console.log('samesssss')
        //         // socket.response('success')
        //         // clients.add(socket);
        //         // totalSize++;

        //         // socket.response('no')
        //     } else {
        //         clientMap.delete(key)
        //         // socket.response()
        //     }
        // } else {
        // }


        //Trial 2
        // socket.on('message', bytes => {
        //     const message = bytes.toString()
        //     socket.authenticated = authenticate(message)

        //     if (socket.authenticated) {
        //         // let key = url.substr(1).split('/')[1].split('?')[0];

        //         let clients = clientMap.get(key);
        //         if (!clients) {
        //             clients = new Set();
        //             clientMap.set(key, clients);
        //         }


        //         // // console.log(key)
        //         // if (url.includes('?')) {
        //         //     let token = url.substr(1).split('/')[1].split('?')[1].substr(6)
        //         //     console.log(token)
        //         //     if (token == sampleToken) {
        //         //         console.log('samesssss')
        //         //         clients.add(socket);

        //         //         // socket.response('no')
        //         //     } else {
        //         //         clientMap.delete(key)
        //         //         // socket.response()
        //         //     }
        //         // } else {
        //         //     clients.add(socket);
        //         // }
        //         clients.add(socket);

        //         totalSize++;
        //         process.stdout.write("[INFO]:a new connection, the current number of connections: " + totalSize + ".\r");

        //     } else {
        //         socket.send('fail')

        //         socket.terminate()
        //     }
        // }

        // )


        //Original
        clients.add(socket);
        totalSize++;

        //trial 3
        // if (clients) {
        //     clients.forEach(function (client, set) {
        //         if (client.readyState === WebSocket.OPEN) {
        //             let token = jwt.sign(
        //                 {
        //                     foo: 'bar'
        //                 },
        //                 jwtSecret,
        //             );
        //             client.send(token);

        //         }
        //     });
        // }


        process.stdout.write('\n' + "[INFO]:a new connection, the current number of connections: " + totalSize + ".\r");
        //Original
        socket.on('close', function (code, message) {
            let clientSet = clientMap.get(key);
            if (clientSet) {
                clientSet.delete(socket);
                totalSize--;
                if (clientSet.size == 0) {
                    clientMap.delete(key);
                }
            }
            process.stdout.write("[INFO]:close a connection, the current number of connections:" + totalSize + ".\r");
        });


    });


    socketServer.broadcast = function (data, theme) {
        let clients = clientMap.get(theme);
        if (clients) {
            clients.forEach(function (client, set) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        }
    };

    return socketServer;
}


const webSocketServer = initWebSocket(websocket_port);

const app = express();
const port = 8083;

app.get('/auth', (req, res) => {
    res.send(fetchUserToken(req));
});

app.get('/server/:secret/:live', (req, res) => {
    console.log('\n' + req.url)

    // let params = req.url.substr(1).split('/');

    let secret = req.params.secret;
    let live = req.params.live;
    console.log('\n' + req.params.secret)
    console.log('\n' + req.params.live)

    // if (params.length != 2) {
    //     process.stdout.write("\n[ERROR]:Incorrect parameters, enter password and push theme");
    //     res.end();
    // }
    if (secret !== stream_secret) {
        process.stdout.write("\n[ERROR]:Password error: " + req.socket.remoteAddress + ":" + req.socket.remotePort + "");
        res.end();
    }
    res.connection.setTimeout(0);
    req.on('data', function (data) {
        console.log(data)
        webSocketServer.broadcast(data, live);
        if (req.socket.recording) {
            req.socket.recording.write(data);
        }
    });
    req.on('end', function () {
        process.stdout.write("\n[INFO]:close request");
        if (req.socket.recording) {
            req.socket.recording.close();
        }
    });
    if (record_stream) {
        let path = 'recordings/' + Date.now() + '.ts';
        req.socket.recording = fs.createWriteStream(path);
    }

    // res.send(fetchUserToken(req));
});


app.listen(stream_port, err => {
    if (err) { console.log('Error') }
    console.log('start')
    console.log('started rtsp WebSocket service in secret is [%s], service port is [%s], ws port is [%s].', stream_secret, stream_port, websocket_port);


})


const fetchUserToken = (req) => {
    return jwt.sign(
        {
            "username": req.query.username
        },
        jwtSecret,
        { expiresIn: 900 } // Expire the token after 15 minutes.
    );
}


