const connectServer = require('./connect-server');

const EVENTS = {
    SendDeviceData: 'device-data'
};

function assertConfig(node) {
    if (!node.server || !node.server.address) {
        throw new Error("Missing gateway server address.");
    }
}

module.exports = function (RED) {
    function Gateway(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.project = config.project;
        this.dataSource = config.dataSource;
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

            if (!node.socket) {
                return;
            }

            // node.log(msg.topic);
            // node.log(msg.payload);
            const data = {
                d: node.dataSource, // dataSource
                pj: node.project, // project
                // k: msg.topic, // key
                p: msg.browseName, // path
                v: msg.payload, // value
                t: new Date().toISOString() // time
            };
            node.socket.emit(EVENTS.SendDeviceData, data);
        });

        assertConfig(node);
        connectServer(node);
    }

    RED.nodes.registerType('gateway', Gateway);
};
