'use strict';

angular.module('insight.richList').controller('RichListController', function($scope, $routeParams, StatisticsRichestList) {

    this.items = [];
    this.loaded = false;

    this.init = function() {
        StatisticsRichestList.query({}, function (items) {
            this.items = items;
            this.loaded = true;
        });
    };
});