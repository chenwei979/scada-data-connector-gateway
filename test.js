const connectServer = require('./connect-server');

const node = {
    server: {address: 'http://127.0.0.1:1888', path: ''},
    socket: null,
    log: console.log.bind(console),
};
connectServer(node);