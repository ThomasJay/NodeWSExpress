const express = require("express");
const http = require("http");
const WebSocket = require("ws");

var app = express();

app.disable("x-powered-by");

//It must be included at the top, i.e., before express.static

const compression = require("compression");

app.use(compression());

var port = process.env.PORT || 3000;

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.use(express.static("public"));

app.get("/a", function (req, res) {
  console.log("Get index");
  res.send("Hello World");
});

app.post("/b", function (req, res) {
  console.log("Get Post");
  console.log("Got body:", req.body);
  res.send("Hello Post".repeat(1000));
});

const messages = ["Start Chatting!"];

wss.on("connection", (socketClient) => {
  //connection is up, let's add a simple simple event
  console.log("connected");
  console.log("client Set length: ", wss.clients.size);

  socketClient.isAlive = true;

  socketClient.on("pong", () => {
    console.log("Got Pong");
    socketClient.isAlive = true;
  });

  socketClient.on("message", (message) => {
    //log the received message and send it back to the client
    messages.push(message);

    console.log("received: %s", message);
    //ws.send(`Hello, you sent -> ${message}`);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // Dont send to the active client who sent it
        if (socketClient !== client) {
          client.send(JSON.stringify([message]));
        }
      }
    });
  });

  socketClient.on("close", (socketClient) => {
    console.log("closed");
    console.log("Number of clients: ", wss.clients.size);
  });

  //send immediatly a feedback to the incoming connection
  socketClient.send("Hi there, I am a WebSocket server");
});

// Ping all web socket connections every 10 seconds
setInterval(() => {
  wss.clients.forEach((client) => {
    if (!client.isAlive) {
      console.log("Found dead ws client");
      return client.terminate();
    }

    console.log("Send ping");

    client.isAlive = false;
    client.ping(null, false, true);
  });
}, 10000);

server.listen(port, function () {
  console.log(`http/ws server listening on ${server.address().port}`);
});
