const io = require('socket.io-client');

const EVENTS = {
    SetDeviceValue: 'device-value'
};

module.exports = function (node) {
    const {address, path} = node.server;
    const socket = (node.socket = io(address, {
        path: path
    }));

    socket.on('connect', () => {
        node.log('connected');
    });

    socket.on('connect_error', (err) => {
        node.log('connect_error');
        node.log(err);
    });

    socket.on('connect_timeout', () => {
        node.log('connect_timeout');
    });

    socket.on('error', () => {
        node.log('error');
    });

    socket.on('disconnect', () => {
        node.log('disconencted');
    });

    socket.on('reconnecting', count => {
        node.log(`reconnecting ${count}`);
    });

    socket.on(EVENTS.SetDeviceValue, payload => {
        const {id, value} = payload;
        node.send({payload: value});
    });

    socket.connect();
}