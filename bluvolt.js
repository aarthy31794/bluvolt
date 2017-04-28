"use strict";

var BluVolt = function () {

    var SERVICE_UUID = 'fd660001-29c4-11e7-8c79-794c8b1831f9';

    var VOLTAGE_UUID = 'fd660002-29c4-11e7-8c79-794c8b1831f9';

    function BluVolt() {
        this.connected = false;
        this.relayCharacteristic = undefined;
        this.relayStatus = undefined;
        this.bluetoothDevice = undefined;
    }

    BluVolt.prototype.connect = function connect() {

        var self = this;

        var options = {filters: [{services: [SERVICE_UUID]}]};

        // var options = {
        //     filters: [{services: [0x6224]}],
        //     optionalServices: [0x6224, "0abb1530-685e-11e5-9d70-feff819cdc9f"]
        // };

        return navigator.bluetooth.requestDevice(options)
            .then(function (device) {
                self.bluetoothDevice = device;
                return device.gatt.connect();
            })
            .then(function (server) {
                return server.getPrimaryService(SERVICE_UUID)
            })
            .then(function (service) {
                return Promise.all([
                    service.getCharacteristic(VOLTAGE_UUID)
                        .then(function (characteristic) {
                            return characteristic.startNotifications()
                                .then(function () {
                                    characteristic.addEventListener('characteristicvaluechanged', function (event) {
                                        if (self.updateUI) {
                                            self.updateUI(event.target.value);
                                        }
                                    });
                                });
                        })
                ]);
            })
            .then(function () {
                self.connected = true;
            });
    }

    BluVolt.prototype.disconnect = function disconnect() {
        var self = this;
        if (!self.bluetoothDevice) {
            return Promise.reject();
        }
        return self.bluetoothDevice.disconnect()
            .then(function () {
                self.connected = false;
                self.relayCharacteristic = undefined;
                self.relayStatus = undefined;
                self.bluetoothDevice = undefined;

                return Promise.resolve();
            });

    }

    return BluVolt;

}();

if (window === undefined) {
    module.exports.BluVolt = BluVolt;
}
