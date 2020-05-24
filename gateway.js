const io = require('socket.io-client');

const EVENTS = {
    Data: 'data',
    SetValue: 'setValue'
};

function assertConfig(node) {
    if (!node.server || !node.server.address) {
        throw new Error("Missing gateway server address.");
    }
}

function connectServer(node) {
    const {address, path} = node.server;
    const socket = (node.socket = io(address, {
        path: path
    }));

    socket.on('connect', () => {
        node.log('connected');
    });

    socket.on('connect_error', () => {
        node.log('connect_error');
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

    socket.on(EVENTS.SetValue, payload => {
        const {id, value} = payload;
        node.send({payload: value});
    });

    socket.connect();
}

module.exports = function (RED) {
    function Gateway(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.server = {
            address: config.serverAddress,
            path: config.serverPath
        };

        let node = this;
        node.on('close', function () {
            node.socket && node.socket.disconnect();
        });

        node.on('input', msg => {
            // node.send(msg);
            node.log(msg);
            if (!node.socket) {
                return;
            }

            const data = {
                id: msg.name,
                value: msg.payload
            };
            node.socket.emit(EVENTS.Data, data);
        });

        assertConfig(node);
        connectServer(node);
    }

    RED.nodes.registerType('gateway', Gateway);
};
