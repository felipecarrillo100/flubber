## Description
This is a small example to illustrate how tracks can be generated and send to a STOPM broker.
This samples send a single polygin which shape is updated constantly.

## How to install:
Intall all the project dependencies with npm
```
npm install
```

## To use
### Start the application development mode
```
npm start
```
The application will start emiting tracks at: 
/topic/producers/flubber/


### Start the application for production
For production we strongly advise using pm2 to supervise and keep the application running in the background
```
pm2 start index.js --name flubber --exp-backoff-restart-delay=100
```
