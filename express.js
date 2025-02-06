const { Console } = require('console')
let fs = require('fs')
const http = require('http')
const express = require('express')
const jwt = require('jsonwebtoken');
const cp = require('child_process')
WebSocket = require('ws')
require('dotenv').config()

const app = express();
const expressPort = 8083;
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

let spawn;

let loadManagement = 0;

const sendUrl = (token) => {
    const verifyResult = jwt.verify(token, process.env.JWT_SECRET)
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
    const verifyResult = jwt.verify(token, process.env.JWT_SECRET)

    if (token && verifyResult.userId == userId) {

        loadManagement += 1
        console.log(`Load Management: ${loadManagement}`);

        if (loadManagement == 1) {
            const target = 'http://localhost:8081/supersecret/live1'
            spawn = cp.spawn('ffmpeg', ['-rtsp_transport', 'tcp', '-i', process.env.URL, '-q', '0', '-f', 'mpegts', '-codec:v', 'mpeg1video', '-s', '600x400', target])

            spawn.stdout.on("data", data => {
                console.log(`stdout: ${data}`);
            });

            spawn.stderr.on("data", data => {
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
    return {
        'token': jwt.sign(
            {
                'path': 'ws://localhost:8082/live1',
                'userId': req.query.idForIpCamToken,
            },
            process.env.JWT_SECRET,
        )
    }
}