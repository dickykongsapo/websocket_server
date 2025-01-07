const { Console } = require('console')
let fs = require('fs')
const http = require('http')
const express = require('express')
const jwt = require('jsonwebtoken');

WebSocket = require('ws')

const app = express();
const expressPort = 8083;
let jwtSecret = '4ed62157a625180b53b7ac503c0da29afd1f4b00f4ced83d11286215b1c25079'

const test = (token) => {
    // const jwt1 = jwt.sign(
    //     {
    //         'path': 'ws://localhost:8082/live1'
    //     },
    //     jwtSecret,
    // )
    console.log(token)

    const verifyResult = jwt.verify(token, jwtSecret)
    console.log(verifyResult)
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
    res.send(test(token));
});

const fetchUserToken = (req) => {
    return {
        'token': jwt.sign(
            {
                'path': 'ws://localhost:8082/live1'
            },
            jwtSecret,
        )
    }
}



const fetchUserToken2 = (req) => {
    return { 'path': 'ws://localhost:8082/live1' }
}
