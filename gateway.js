const io = require('socket.io-client');
const uuid = require('uuid/v5');

const NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
const EVENTS = {
    Subscriptions: 'subscriptions',
    Register: 'register',
    UnRegister: 'unregister',
    Data: 'data',
    SetValue: 'SetValue'
};

module.exports = function (RED) {
    function VariableDefinition(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.alias = config.alias;
        this.description = config.description;
        this.dataType = config.dataType;
        this.permissions = config.permissions;
        this.server = RED.nodes.getNode(config.server);
        this.host = RED.nodes.getNode(config.host);

        this.subscribed = true;
        this.variableId = function () {
            const key = this.name + this.dataType;
            return uuid(key, NAMESPACE);
        };

        this.getVariableDefinition = function () {
            return {
                id: this.variableId(),
                name: this.name,
                alias: this.alias,
                description: this.description,
                dataType: this.dataType,
                permissions: this.permissions,
                host: this.host.name
            };
        };
        this.register = function () {
            this.socket.emit(EVENTS.Register, node.getVariableDefinition());
        };
        this.unregister = function () {
            this.socket.emit(EVENTS.UnRegister, node.getVariableDefinition());
        };

        let node = this;
        assertConfig();
        connectDriver();

        function assertConfig() {
            if (!node.server || !node.server.address) {
                throw new Error("Missing SCADA driver's server address");
            }

            if (!node.host.address) {
                throw new Error('Missing host config address');
            }
        }

        function connectDriver() {
            const {address, path} = node.server;
            const socket = (node.socket = io(address, {
                path: path,
                query: {
                    id: node.variableId()
                }
            }));

            socket.on('connect', () => {
                node.log('connected');
                node.register();
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

            socket.on(EVENTS.Subscriptions, dataIds => {
                node.subscribed = dataIds.indexOf(node.variableId()) >= 0;
            });

            socket.on(EVENTS.SetValue, payload => {
                const {id, value} = payload;
                if (id === node.variableId()) {
                    node.send({payload: value});
                }
            });

            socket.connect();
        }

        node.on('close', function () {
            node.unregister();
            node.socket && node.socket.disconnect();
        });

        node.on('input', msg => {
            node.send(msg);

            const data = {
                id: node.variableId(),
                value: msg.payload
            };

            if (node.subscribed) {
                node.socket.emit(EVENTS.Data, data);
            }
        });
    }

    RED.nodes.registerType('gateway', VariableDefinition);
};
