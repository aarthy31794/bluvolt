"use strict";

var BluVolt = function () {

    var SERVICE_UUID = 0x6224;

    var VOLTAGE_UUID = 0x6225;

    function BluVolt(bluetooth) {
        this.connected = false;
        this.relayCharacteristic = undefined;
        this.relayStatus = undefined;
        this.bluetooth = bluetooth;
    }

    BluVolt.prototype.connect = function connect() {

        var self = this;

        var options = {filters: [{services: [0x6224]}],
                        optionalServices: [0x6224, "0abb1530-685e-11e5-9d70-feff819cdc9f"]};

        return this.bluetooth.requestDevice(options)
            .then(function (device) {
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

    return BluVolt;

}();

if (window === undefined) {
    module.exports.BluVolt = BluVolt;
}
