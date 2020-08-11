"use strict";


const WebSocketServer = require('ws').Server;
const Splitter = require('stream-split');
const merge = require('mout/object/merge');

const NALseparator = new Buffer([0, 0, 0, 1]);//NAL break


class _Server {

  constructor(server, options) {

    this.options = merge({
      width: 960,
      height: 540,
    }, options);

    this.wss = new WebSocketServer({ server });

    this.new_client = this.new_client.bind(this);
    this.start_feed = this.start_feed.bind(this);
    this.broadcast = this.broadcast.bind(this);

    this.wss.on('connection', this.new_client);

    this.stream_running = false;
  }


  start_feed() {
    if(this.stream_running){
      this.readStream.end();
      this.readStream.destroy();
      this.stream_running = false;
    }

    if (!this.stream_running) {
      this.stream_running = true;
      var readStream = this.get_feed();
      this.readStream = readStream;

      readStream = readStream.pipe(new Splitter(NALseparator));
      readStream.on("data", this.broadcast);
    }
  }

  get_feed() {
    throw new Error("to be implemented");
  }

  get_client_count() {
    let count = 0;
    this.wss.clients.forEach(function (socket) {
      count ++;
    })
    return count;
  }

  broadcast(data) {
    this.wss.clients.forEach(function (socket) {
      
      if (socket.busy && socket.packetsSent > 100){
        console.log("busy")
        return;
      }

      socket.busy = true;
      // socket.busy = false;

      socket.send(Buffer.concat([NALseparator, data]), { binary: true }, function ack(error) {
        socket.busy = false;
        socket.packetsSent++;
      });
    });
  }

  new_client(socket) {

    var self = this;
    console.log('New guy');
    socket.packetsSent = 0;

    socket.send(JSON.stringify({
      action: "init",
      width: this.options.width,
      height: this.options.height,
    }), function ack(error) {
      console.log("first ack")
      socket.busy = false;
    });

    socket.on("message", function (data) {
      var cmd = "" + data, action = data.split(' ')[0];
      console.log("Incomming action '%s'", action);

      if (action == "REQUESTSTREAM")
        self.start_feed();
      if (action == "STOPSTREAM") {
        self.readStream.end();
        self.readStream.destroy();
        self.stream_running = false;
      }
    });

    socket.on('close', function () {
      if (self.get_client_count() == 1) {
        self.readStream.end();
        self.readStream.destroy();
        self.stream_running = false;
        console.log('stopping client interval');
      }
    });
  }


};


module.exports = _Server;
