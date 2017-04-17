var app;
(function () {
    app = angular.module('bluvolt', ['ngMaterial'])
        .config(function ($mdThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('blue')
                .accentPalette('indigo');
            $mdThemingProvider.theme('success-toast');
            $mdThemingProvider.theme('error-toast');

            $mdThemingProvider.alwaysWatchTheme(true);
        })
})();

var match,
    pl = /\+/g, // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s) {
        return decodeURIComponent(s.replace(pl, " "));
    },
    query = window.location.search.substring(1);

var urlParams = {};
while (match = search.exec(query))
    urlParams[decode(match[1])] = decode(match[2]);

var cordovaApp = urlParams['app'];

app.service('bluVoltService', function () {
    return new BluVolt();
});

app.controller('mainController', function ($scope, $mdToast, $mdDialog, bluVoltService) {

    $scope.bluvolt = bluVoltService;

    $scope.isApp = false;

    if (cordovaApp == 'true') {
        $scope.isApp = true;
    }

    // Disabling the mouse right click event
    document.addEventListener('contextmenu', event => event.preventDefault());

    function goodToast(message) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .position('top')
                .theme("success-toast")
                .hideDelay(2500)
        );
    };

    function badToast(message) {
        $mdToast.show(
            $mdToast.simple()
                .textContent(message)
                .position('top')
                .theme('error-toast')
                .hideDelay(2500)
        );
    };

    function showLoadingIndicator($event, text) {
        var parentEl = angular.element(document.body);
        $mdDialog.show({
            parent: parentEl,
            targetEvent: $event,
            clickOutsideToClose: false,
            template: '<md-dialog style="width: 250px;top:95px;margin-top: -170px;" aria-label="loadingDialog" ng-cloak>' +
            '<md-dialog-content>' +
            '<div layout="row" layout-align="center" style="padding: 40px;">' +
            '<div style="padding-bottom: 20px;">' +
            '<md-progress-circular md-mode="indeterminate" md-diameter="40" style="right: 20px;bottom: 10px;">' +
            '</md-progress-circular>' +
            '</div>' +
            '</div>' +
            '<div layout="row" layout-align="center" style="padding-bottom: 20px;">' +
            '<label>' + text + '</label>' +
            '</div>' +
            '</md-dialog-content>' +
            '</md-dialog>',
            locals: {
                items: $scope.items
            },
            controller: DialogController
        });

        function DialogController($scope, $mdDialog, items) {
            $scope.items = items;
            $scope.closeDialog = function () {
                $mdDialog.hide();
            }
        }
    }

    function dismissLoadingIndicator() {
        $mdDialog.cancel();
    };

    $scope.bluvolt.updateUI = function (value, notifyChar) {
        var tmpArray = new Uint8Array(value.buffer);
        var tempData = '';
        for (var i = 0; i < tmpArray.length; i++) {
            tempData = tempData + tmpArray[i].toString(16);
        }
        tempData = '0x' + tempData;
        $scope.voltageValue = (tempData & 0x7fffff | 0x800000) * 1.0 / Math.pow(2, 23) * Math.pow(2, ((tempData >> 23 & 0xff) - 127));
        $scope.voltageValue = $scope.voltageValue.toFixed(3);
        $scope.$apply();
    };

    $scope.onConnect = function () {
        showLoadingIndicator('', 'Connecting ....');
        $scope.bluvolt.connect()
            .then(function () {
                dismissLoadingIndicator();
                goodToast('Connected...');
            })
            .catch(function (error) {
                dismissLoadingIndicator();
                console.error('Argh!', error, error.stack ? error.stack : '');
                badToast(error);
            });
    }

    $scope.onDisconnect = function () {
        $scope.bluvolt.disconnect().then(function () {
            console.log('Device disconnected successfully');
            $scope.$apply();
        });
    }

    //Hack : waiting to load the plugin
    setTimeout(function () {
        if (!navigator.bluetooth) {
            badToast('Bluetooth not supported, which is required.');
        } else if (navigator.bluetooth.referringDevice) {
            $scope.onConnect();
        }
    }, 2000);

});