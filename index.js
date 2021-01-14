const serviceName = "flubber";
const path = require('path');

const GeoJSONShapesLoader = require("./modules/GeoJSONShapesLoader");
const MessageProducer = require("./modules/MessageProducer");
const FlubberShapeInterpolator = require("./modules/FlubberShapeInterpolator");

var triangle = [[10, 0], [20, 20], [0, 20]],
    square = [[0, 0], [20, 0], [20, 20], [0, 20]],
    pentagon = [[0, 0], [20, 0], [20, 10], [10, 20], [0, 10]],
    star5p = [ [2, 14],[6.5, 11.5],[12, 14],[10.5, 9],[14, 5.5],[9, 5],[6.5, 0],[5, 5],[0, 5.5],[3.5, 9]];

const shift = -15;
var triangle2 = [[10+shift, 0+shift], [20+shift, 20+shift], [0+shift, 20+shift]],
    pentagon2 = [[0+shift, 0+shift], [20+shift, 0+shift], [20+shift, 10+shift], [10+shift, 20+shift], [0+shift, 10+shift]],
    star5p2 = [ [2+shift, 14+shift],[6.5+shift, 11.5+shift],[12+shift, 14+shift],[10.5+shift, 9+shift],[14+shift, 5.5+shift],[9+shift, 5+shift],[6.5+shift, 0+shift],[5+shift, 5+shift],[0+shift, 5.5+shift],[3.5+shift, 9+shift]];

let allShapes1 = [{name:"triangle", coordinates: triangle}, {name:"star", coordinates:star5p}, {name:"pentagon", coordinates:pentagon}, {name: "square", coordinates: square}];
const allShapes2 = [{name:"star", coordinates:star5p2}, {name:"pentagon", coordinates:pentagon2}, {name:"triangle", coordinates: triangle2}];

class TracksEmitter {
    constructor(options) {
        this.url = options.relayhost;
        this.port = options.port;
        this.username = options.username;
        this.password = options.password;
        this.stompProducer = new MessageProducer({
            relayhost: this.url,
            port: this.port,
            username: this.username,
            password: this.password,
            topicSeparator: options.topicSeparator
        });

        this.flubberShapeInterpolator1 = new FlubberShapeInterpolator({shapes: allShapes1, geometryType: "Polygon"});
        this.flubberShapeInterpolator2 = new FlubberShapeInterpolator({shapes: allShapes2, geometryType: "LineString"});
    }

    connect() {
        this.stompProducer.init().then((producer)=>{
            if (producer == null) {
                console.log("Exit: Failed to authenticate");
                return;
            } else {
                console.error("Starting track generator");
                console.error("Control+C to stop");
                this.startTrackGenerator();
            }
        }, () =>{
            console.log("Exit: Failed to connect");
            return;
        });
    }

    onSuccessfulWebSocketConnect(stompClient) {
       // Restore subscriptions on an new Session (every time the cookie expires)
        stompClient.subscribe('/topic/echochannel', (stompMessage) => {
            const body = JSON.parse(stompMessage.body);
            console.log("echo :" + JSON.stringify(body));
        });
    }

    startTrackGenerator() {
        this.timer = null;
        this.clearAll();
        this.nextTrack();
    }

    stopTrackGenerator() {
        clearTimeout(this.timer);
        this.timer = null;
    }

    nextTrack() {
        this.timer = setTimeout(() => {
            // update
            this.generateTracks(Date.now());

            this.nextTrack()
        }, 100)
    }

    generateTracks(time) {
        const t = Math.floor(time / 100);

        const state = t % 11;
        if (state==0) {
            this.flubberShapeInterpolator1.toggleShape();
            this.flubberShapeInterpolator2.toggleShape();

        }
        const shape1 = this.flubberShapeInterpolator1.getInterpolatedShape(state  * 0.1);
        const trackMessage1 = {
            "action": "PUT",
            "geometry": shape1,
            id: 1,
            properties: {
                "name": this.flubberShapeInterpolator1.getCurrentShape().name
            }
        }

        const shape2 = this.flubberShapeInterpolator2.getInterpolatedShape(state * 0.1);
        const trackMessage2 = {
            "action": "PUT",
            "geometry": shape2,
            id: 2,
            properties: {
                "name": this.flubberShapeInterpolator2.getNextShape().name
            }
        }
        const path1 = "/topic/producers/" + serviceName +"/data/" + trackMessage1.id;
        this.stompProducer.sendMessage(path1, trackMessage1);

        const path2 = "/topic/producers/" + serviceName +"/data/" + trackMessage2.id;
        this.stompProducer.sendMessage(path2, trackMessage2);
    }

    clearAll() {
        const command = {
            "action": "CLEAR",
            "context": "CLEAR"
        }
        const path = "/topic/producers/" + serviceName +"/control/"
        this.stompProducer.sendMessage(path, command);
    }
}


const shapesLoader = new GeoJSONShapesLoader(path.join(__dirname, "resources/africa.geojson"), "sovereignt");

shapesLoader.load().then((shapes)=>{
    allShapes1 = shapes;
	const trackEmitter = new TracksEmitter(
		{
			relayhost: "leu-gsp-vrndp06",  //  URL of your Broker (ActiveMQ, RabbitMQ or any other STOMP compliant Broker)
			port: "61613",           //  Port of your Broker, in most cases 61613 for http and 61612 for SSL
			username: "admin",   //  A valid user defined in your Broker capable to send to /topic/  (see your Broker user guide to create the user)
			password: "admin",   //  A valid user defined in your Broker capable to send to /topic/
			topicSeparator: "."   //  Catalog Explorer uses "/" by default, however it could be that your Broker is configured to use .
		});

	trackEmitter.connect();
});


