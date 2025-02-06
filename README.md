# IP Cam Websocket Server 

Streaming RTSP with FFMPEG and Websocket

## Installation

1. Install all packages needed by npm

```js
npm i 
```

2. Create a dotenv file and save with jwt secret and rtsp url

```js
JWT_SECRET = {YOUR_JWT_TOKEN}
URL = {YOUR_RTSP_URL}
```

## Getting Start

1. Opening 2 terminals

2. Start express server with the following command

```js
nodemon express.js
```

3. Start Websocket in tanother terminal with the following command

```js
nodemon websocket.js supersecret 8081 8082
```
