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

const sampleToken = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJsaW5rQHNhcG9zeXMuY29tIiwic2NvcGVzIjpbIlRFTkFOVF9BRE1JTiJdLCJ1c2VySWQiOiI0N2M1ZDU4MC1hYmU5LTExZWMtOTA3Zi0yMzQyYTNhNDM5MWQiLCJlbmFibGVkIjp0cnVlLCJpc1B1YmxpYyI6ZmFsc2UsInRlbmFudElkIjoiMmNhYzk0MDAtYWJlOS0xMWVjLTkwN2YtMjM0MmEzYTQzOTFkIiwiY3VzdG9tZXJJZCI6IjEzODE0MDAwLTFkZDItMTFiMi04MDgwLTgwODA4MDgwODA4MCIsImlzcyI6InRoaW5nc2JvYXJkLmlvIiwiaWF0IjoxNzM0MzQzNTc0LCJleHAiOjE3MzQzNTI1NzR9._cSGenQEeeroPO5YEAIR61k13_UU57BGrA0-6f7up58IAfVzOpQ7S8IdavCiuf_KWcRM-8eO1IMGMGdiehpN3g'

//Websocket Server
const initWebSocket = (websocket_port) => {
    let clientMap = new Map()
    let socketServer = new WebSocket.Server({
        port: websocket_port,
        perMessageDeflate: false
    });
    socketServer.on('connection', function (socket, upgradeReq) {
        let url = upgradeReq.socket.remoteAddress + upgradeReq.url;
        console.log(url)

        let key = url.substr(1).split('/')[1];
        var clients = clientMap.get(key);
        // console.log(url + '\n')
        console.log(key + '\n')

        if (!clients) {
            clients = new Set();
            clientMap.set(key, clients);
        }

        //Original
        clients.add(socket);
        totalSize++;

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



    socketServer.broadcastJWTToken = function (data, theme) {
        let clients = clientMap.get(theme);
        if (clients) {
            clients.forEach(function (client, set) {
                if (client.readyState === WebSocket.OPEN) {
                    let token = jwt.sign(
                        {
                            foo: 'bar'
                        },
                        jwtSecret,
                    );
                    client.send(token);
                }
            });
        }
    };

    return socketServer;
}


//http server, receive ffmpeg
const initHttp = (stream_port, stream_secret, record_stream, socketServer) => {
    let streamServer1 = http.createServer(
        (request, response) => {
            let params = request.url.substr(1).split('/');
            if (params.length != 2) {
                process.stdout.write("\n[ERROR]:Incorrect parameters, enter password and push theme");
                response.end();
            }
            if (params[0] !== stream_secret) {
                process.stdout.write("\n[ERROR]:Password error: " + request.socket.remoteAddress + ":" + request.socket.remotePort + "");
                response.end();
            }
            response.connection.setTimeout(0);
            request.on('data', function (data) {
                socketServer.broadcast(data, params[1]);
                if (request.socket.recording) {
                    request.socket.recording.write(data);
                }
            });
            request.on('end', function () {
                process.stdout.write("\n[INFO]:close request");
                if (request.socket.recording) {
                    request.socket.recording.close();
                }
            });
            if (record_stream) {
                let path = 'recordings/' + Date.now() + '.ts';
                request.socket.recording = fs.createWriteStream(path);
            }
        }).listen(stream_port);


    let streamServer2 = http.createServer(
        (request, response) => {
            let params = request.url.substr(1).split('/');
            if (params[0] !== 'auth') {
                process.stdout.write("\n[ERROR]:Incorrect parameters, enter password and push theme");
                response.end();
            }
            socketServer.broadcast(data, params[1]);
        }
    ).listen()
    console.log('started rtsp WebSocket service in secret is [%s], service port is [%s], ws port is [%s].', stream_secret, stream_port, websocket_port);
}

const webSocketServer = initWebSocket(websocket_port);

initHttp(stream_port, stream_secret, record_stream, webSocketServer);

