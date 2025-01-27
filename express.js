const { Console } = require('console')
let fs = require('fs')
const http = require('http')
const express = require('express')
const jwt = require('jsonwebtoken');
const cp = require('child_process')
WebSocket = require('ws')

const app = express();
const expressPort = 8083;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

let spawn;
let onSwitch = false;

let loadManagement = 0;
let userList = [];

let jwtSecret = '4ed62157a625180b53b7ac503c0da29afd1f4b00f4ced83d11286215b1c25079';
const sendUrl = (token) => {
    const verifyResult = jwt.verify(token, jwtSecret)
    return { 'url': verifyResult }
}

app.listen(expressPort, err => {
    if (err) { console.log('Error') }
    console.log('\nstarted express service in [%s].', expressPort);
})

app.get('/express/token', (req, res) => {
    res.send(fetchUserToken(req));
});


app.get('/express/ipcam', (req, res) => {
    const token = req.query.token
    const userId = req.query.userId
    const verifyResult = jwt.verify(token, jwtSecret)

    if (token && verifyResult.userId == userId) {

        loadManagement += 1
        console.log(`Load Management: ${loadManagement}`);

        // userList.push(token)

        if (loadManagement == 1) {
            const url = 'rtsp://admin:SaboatP0SYS@161.81.253.105/ISAPI/Streaming/channels/101/live'
            const target = 'http://127.0.0.1:8081/supersecret/live1'
            spawn = cp.spawn('ffmpeg', ['-i', url, '-q', '0', '-f', 'mpegts', '-codec:v', 'mpeg1video', '-s', '600x400', target])
            spawn.stdout.on("data", data => {
                console.log(`stdout: ${data}`);
            });

            spawn.stderr.on("data", data => {
                // onSwitch = true
                console.log(`stderr: ${data}`);
            });

            spawn.on("error", error => {
                console.log(`error: ${error.message}`);
            });

            spawn.on("close", code => {
                console.log(`child process exited with code ${code}`);
            });
        }

        res.send(sendUrl(token))

    } else {
        res.send('')
    }
});


app.post('/express/stream/stop', (req, res) => {

    // console.log(userList)
    // console.log(userList.findIndex(req.body.token))
    if (loadManagement > 0) {
        loadManagement -= 1
    }

    console.log(`Load Management: ${loadManagement}`);
    if (loadManagement == 0) {
        if (spawn) {
            spawn.stdin.pause()
            spawn.kill()
        }
    }
})

const fetchUserToken = (req) => {
    console.log(req.query.idForIpCamToken)
    return {
        'token': jwt.sign(
            {
                'path': 'ws://localhost:8082/live1',
                'userId': req.query.idForIpCamToken,
            },
            jwtSecret,
            // {
            //     expiresIn: 60000
            // }
        )
    }
}