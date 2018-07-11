/*! insight-ui-zcash 0.4.0 */
var testnet = !1,
    netSymbol = testnet ? "TEL" : "ZEL",
    defaultLanguage = localStorage.getItem("insight-language") || "en",
    defaultCurrency = localStorage.getItem("insight-currency") || netSymbol;
    angular.module("insight", ["ngAnimate", "ngResource", "ngRoute", "ngProgress", "ui.bootstrap", "ui.route", "monospaced.qrcode", "gettext", "angularMoment", "insight.system", "insight.socket", "insight.blocks", "insight.statistics", "insight.richList", "insight.transactions", "insight.address", "insight.search", "insight.chart", "insight.charts", "insight.markets", "insight.status", "insight.connection", "insight.currency", "insight.messages", "ngclipboard", "insight.pools", "insight.pool"]), angular.module("insight.system", ["chart.js"]), angular.module("insight.socket", []), angular.module("insight.blocks", []), angular.module("insight.transactions", []), angular.module("insight.address", []), angular.module("insight.search", []), angular.module("insight.charts", []), angular.module("insight.chart", []), angular.module("insight.pools", ["chart.js", "ngNumeraljs"]), angular.module("insight.pool", []), angular.module("insight.markets", []), angular.module("insight.chart", []), angular.module("insight.richList", []), angular.module("insight.statistics", ["ngNumeraljs"]), angular.module("insight.status", []), angular.module("insight.connection", []), angular.module("insight.currency", []), angular.module("insight.messages", []), angular.module("insight.address").controller("AddressController", function($scope, $rootScope, $routeParams, $location, Global, Address, getSocket) {
    $scope.global = Global;
    var socket = getSocket($scope),
        addrStr = $routeParams.addrStr,
        _startSocket = function() {
            socket.on("bitcoind/addresstxid", function(data) {
                if (data.address === addrStr) {
                    $rootScope.$broadcast("tx", data.txid);
                    var base = document.querySelector("base"),
                        beep = new Audio(base.href + "/sound/transaction.mp3");
                    beep.play()
                }
            }), socket.emit("subscribe", "bitcoind/addresstxid", [addrStr])
        },
        _stopSocket = function() {
            socket.emit("unsubscribe", "bitcoind/addresstxid", [addrStr])
        };
    socket.on("connect", function() {
        _startSocket()
    }), $scope.$on("$destroy", function() {
        _stopSocket()
    }), $scope.params = $routeParams, $scope.findOne = function() {
        $rootScope.currentAddr = $routeParams.addrStr, _startSocket(), Address.get({
            addrStr: $routeParams.addrStr
        }, function(address) {
            $rootScope.titleDetail = address.addrStr.substring(0, 7) + "...", $rootScope.flashMessage = null, $scope.address = address
        }, function(e) {
            400 === e.status ? $rootScope.flashMessage = "Invalid Address: " + $routeParams.addrStr : 503 === e.status ? $rootScope.flashMessage = "Backend Error. " + e.data : $rootScope.flashMessage = "Address Not Found", $location.path("/")
        })
    }
}), angular.module("insight.blocks").controller("BlocksController", function($scope, $rootScope, $routeParams, $location, Global, Block, Blocks, BlockByHeight) {
    $scope.global = Global, $scope.loading = !1, $routeParams.blockHeight && BlockByHeight.get({
        blockHeight: $routeParams.blockHeight
    }, function(hash) {
        $location.path("/block/" + hash.blockHash)
    }, function() {
        $rootScope.flashMessage = "Bad Request", $location.path("/")
    });
    var _formatTimestamp = function(date) {
        var yyyy = date.getUTCFullYear().toString(),
            mm = (date.getUTCMonth() + 1).toString(),
            dd = date.getUTCDate().toString();
        return yyyy + "-" + (mm[1] ? mm : "0" + mm[0]) + "-" + (dd[1] ? dd : "0" + dd[0])
    };
    $scope.$watch("dt", function(newValue, oldValue) {
        newValue !== oldValue && $location.path("/blocks-date/" + _formatTimestamp(newValue))
    }), $scope.openCalendar = function($event) {
        $event.preventDefault(), $event.stopPropagation(), $scope.opened = !0
    }, $scope.humanSince = function(time) {
        var m = moment.unix(time).startOf("day"),
            b = moment().startOf("day");
        return moment.min(m).from(b)
    }, $scope.list = function() {
        if ($scope.loading = !0, $routeParams.blockDate && ($scope.detail = "On " + $routeParams.blockDate), $routeParams.startTimestamp) {
            var d = new Date(1e3 * $routeParams.startTimestamp),
                m = d.getMinutes();
            10 > m && (m = "0" + m), $scope.before = " before " + d.getHours() + ":" + m
        }
        $rootScope.titleDetail = $scope.detail, Blocks.get({
            blockDate: $routeParams.blockDate,
            startTimestamp: $routeParams.startTimestamp
        }, function(res) {
            $scope.loading = !1, $scope.blocks = res.blocks, $scope.pagination = res.pagination
        })
    }, $scope.findOne = function() {
        $scope.loading = !0, Block.get({
            blockHash: $routeParams.blockHash
        }, function(block) {
            $rootScope.titleDetail = block.height, $rootScope.flashMessage = null, $scope.loading = !1, $scope.block = block
        }, function(e) {
            400 === e.status ? $rootScope.flashMessage = "Invalid Transaction ID: " + $routeParams.txId : 503 === e.status ? $rootScope.flashMessage = "Backend Error. " + e.data : $rootScope.flashMessage = "Block Not Found", $location.path("/")
        })
    }, $scope.params = $routeParams
}), angular.module("insight.charts").controller("ChartsController", function($scope, $routeParams, StatisticsBalanceIntervals, StatisticsByDaysSupply, StatisticsRicherThan, MarketsInfo, getSocket, $q, StatisticChart) {
    var self = this;
    self.chartDays = $routeParams.days ? $routeParams.days : 60;
    var statisticChart = new StatisticChart(self.chartDays);
    statisticChart.load(StatisticsByDaysSupply, "sum", "supply", !1), $scope.$on("chart-create", function(evt, chart) {
        "line" === chart.chart.canvas.id && (statisticChart.changeChartColor(chart), chart.update())
    }), self.chartOptions = statisticChart.chartOptions, self.daysButtons = statisticChart.daysButtons, self.balanceIntervals = [], self.marketsInfo = null, self.richerThanIntervals = [];
    var socket = getSocket($scope);
    self.init = function() {
        _getInfo(), _getRicherThan()
    };
    var _getRicherThan = function() {
            return StatisticsRicherThan.query(function(intervals) {
                self.richerThanIntervals = intervals
            })
        },
        _getInfo = function() {
            return $q.all([StatisticsBalanceIntervals.query().$promise, MarketsInfo.get().$promise]).then(function(results) {
                if (results[0] && results[1]) {
                    self.marketsInfo = results[1];
                    var items = results[0],
                        intervals = [],
                        countAddresses = 0,
                        maxCountAddresses = 0,
                        sumCoins = new BigNumber(0),
                        maxSumCoins = new BigNumber(0);
                    items.forEach(function(interval) {
                        var sumBN = new BigNumber(interval.sum.toString());
                        countAddresses += interval.count, interval.count > maxCountAddresses && (maxCountAddresses = interval.count), sumCoins = sumCoins.plus(sumBN), maxSumCoins.lt(sumBN) && (maxSumCoins = new BigNumber(sumBN))
                    }), items.forEach(function(interval) {
                        var addressesPercent = interval.count && countAddresses ? interval.count / countAddresses * 100 : 0,
                            addressesRelativePercent = interval.count && maxCountAddresses ? interval.count / maxCountAddresses * 100 : 0,
                            sumBN = new BigNumber(interval.sum.toString()),
                            coinsPercent = sumBN.gt(0) && sumCoins.gt(0) ? sumBN.dividedBy(sumCoins).mul(100) : new BigNumber(0),
                            coinsRelativePercent = sumBN.gt(0) && maxSumCoins.gt(0) ? sumBN.dividedBy(maxSumCoins).mul(100) : new BigNumber(0);
                        intervals.push({
                            min: interval.min,
                            max: interval.max,
                            count: interval.count,
                            sum: sumBN.toString(10),
                            addressesPercent: addressesPercent.toFixed(2),
                            addressesRelativePercent: addressesRelativePercent.toFixed(2),
                            coinsPercent: coinsPercent.toNumber().toFixed(2),
                            coinsRelativePercent: coinsRelativePercent.toNumber().toFixed(2)
                        })
                    }), self.balanceIntervals = intervals
                }
            })
        };
    socket.on("markets_info", function(marketsInfo) {
        self.marketsInfo = marketsInfo
    })
}), angular.module("insight.connection").controller("ConnectionController", function($scope, $window, Status, getSocket, PeerSync) {
    $scope.apiOnline = !0, $scope.serverOnline = !0, $scope.clienteOnline = !0;
    var socket = getSocket($scope);
    socket.on("connect", function() {
        $scope.serverOnline = !0, socket.on("disconnect", function() {
            $scope.serverOnline = !1
        })
    }), $scope.getConnStatus = function() {
        PeerSync.get({}, function(peer) {
            $scope.apiOnline = peer.connected, $scope.host = peer.host, $scope.port = peer.port
        }, function() {
            $scope.apiOnline = !1
        })
    }, socket.emit("subscribe", "sync"), socket.on("status", function(sync) {
        $scope.sync = sync, $scope.apiOnline = "aborted" !== sync.status && "error" !== sync.status
    }), $window.addEventListener("offline", function() {
        $scope.$apply(function() {
            $scope.clienteOnline = !1
        })
    }, !0), $window.addEventListener("online", function() {
        $scope.$apply(function() {
            $scope.clienteOnline = !0
        })
    }, !0)
}), angular.module("insight.currency").controller("CurrencyController", function($scope, $rootScope, Currency) {
    $rootScope.currency.symbol = defaultCurrency;
    var _roundFloat = function(x, n) {
        return parseInt(n, 10) && parseFloat(x) || (n = 0), Math.round(x * Math.pow(10, n)) / Math.pow(10, n)
    };
    $rootScope.currency.getConvertion = function(value) {
        if (value = 1 * value, !isNaN(value) && "undefined" != typeof value && null !== value) {
            if (0 === value) return "0 " + this.symbol;
            var response;
            return "USD" === this.symbol ? response = _roundFloat(value * this.factor, 2) : this.symbol === "m" + netSymbol ? (this.factor = 1e3, response = _roundFloat(value * this.factor, 5)) : "bits" === this.symbol ? (this.factor = 1e6, response = _roundFloat(value * this.factor, 2)) : (this.factor = 1, response = value), 1e-7 > response && (response = response.toFixed(8)), response + " " + this.symbol
        }
        return "value error"
    }, $scope.setCurrency = function(currency) {
        $rootScope.currency.symbol = currency, localStorage.setItem("insight-currency", currency), "USD" === currency ? Currency.get({}, function(res) {
            $rootScope.currency.factor = $rootScope.currency.bitstamp = res.data.bitstamp
        }) : currency === "m" + netSymbol ? $rootScope.currency.factor = 1e3 : "bits" === currency ? $rootScope.currency.factor = 1e6 : $rootScope.currency.factor = 1
    }, Currency.get({}, function(res) {
        $rootScope.currency.factor = $rootScope.currency.bitstamp = res.data.bitstamp
    })
}), angular.module("insight.system").controller("FooterController", function($scope, $route, $templateCache, gettextCatalog, amMoment, Version) {
    $scope.defaultLanguage = defaultLanguage;
    var _getVersion = function() {
        Version.get({}, function(res) {
            $scope.version = res.version
        })
    };
    $scope.version = _getVersion(), $scope.availableLanguages = [{
        name: "Deutsch",
        isoCode: "de_DE"
    }, {
        name: "English",
        isoCode: "en"
    }, {
        name: "Spanish",
        isoCode: "es"
    }, {
        name: "Japanese",
        isoCode: "ja"
    }], $scope.setLanguage = function(isoCode) {
        gettextCatalog.currentLanguage = $scope.defaultLanguage = defaultLanguage = isoCode, amMoment.changeLocale(isoCode), localStorage.setItem("insight-language", isoCode);
        var currentPageTemplate = $route.current.templateUrl;
        $templateCache.remove(currentPageTemplate), $route.reload()
    }
}), angular.module("insight.system").controller("HeaderController", function($scope, $rootScope, $modal, getSocket, Global, Block) {
    $scope.global = Global, $rootScope.currency = {
        factor: 1,
        bitstamp: 0,
        testnet: testnet,
        netSymbol: netSymbol,
        symbol: netSymbol
    }, $scope.menu = [{
        title: "Blocks",
        link: "blocks"
    }, {
        title: "Charts",
        link: "charts"
    }, {
        title: "Status",
        link: "status"
    }], $scope.openScannerModal = function() {
        $modal.open({
            templateUrl: "scannerModal.html",
            controller: "ScannerController"
        })
    };
    var _getBlock = function(hash) {
            Block.get({
                blockHash: hash
            }, function(res) {
                $scope.totalBlocks = res.height
            })
        },
        socket = getSocket($scope);
    socket.on("connect", function() {
        socket.emit("subscribe", "inv"), socket.on("block", function(block) {
            var blockHash = block.toString();
            _getBlock(blockHash)
        })
    }), $rootScope.isCollapsed = !0
});
var TRANSACTION_DISPLAYED = 10,
    BLOCKS_DISPLAYED = 5;
angular.module("insight.system").controller("IndexController", function($scope, Global, getSocket, Blocks) {
    $scope.global = Global;
    var _getBlocks = function() {
            Blocks.get({
                limit: BLOCKS_DISPLAYED
            }, function(res) {
                $scope.blocks = res.blocks, $scope.blocksLength = res.length
            })
        },
        socket = getSocket($scope),
        _startSocket = function() {
            socket.emit("subscribe", "inv"), socket.on("tx", function(tx) {
                $scope.txs.unshift(tx), parseInt($scope.txs.length, 10) >= parseInt(TRANSACTION_DISPLAYED, 10) && ($scope.txs = $scope.txs.splice(0, TRANSACTION_DISPLAYED))
            }), socket.on("block", function() {
                _getBlocks()
            })
        };
    socket.on("connect", function() {
        _startSocket()
    }), $scope.humanSince = function(time) {
        var m = moment.unix(time);
        return moment.min(m).fromNow()
    }, $scope.index = function() {
        _getBlocks(), _startSocket()
    }, $scope.txs = [], $scope.blocks = []
}), angular.module("insight.messages").controller("VerifyMessageController", function($scope, $http) {
    $scope.message = {
        address: "",
        signature: "",
        message: ""
    }, $scope.verification = {
        status: "unverified",
        result: null,
        error: null,
        address: ""
    }, $scope.verifiable = function() {
        return $scope.message.address && $scope.message.signature && $scope.message.message
    }, $scope.verify = function() {
        $scope.verification.status = "loading", $scope.verification.address = $scope.message.address, $http.post(window.apiPrefix + "/messages/verify", $scope.message).success(function(data, status, headers, config) {
            return "boolean" != typeof data.result ? ($scope.verification.status = "error", void($scope.verification.error = null)) : ($scope.verification.status = "verified", void($scope.verification.result = data.result))
        }).error(function(data, status, headers, config) {
            $scope.verification.status = "error", $scope.verification.error = data
        })
    };
    var unverify = function() {
        $scope.verification.status = "unverified"
    };
    $scope.$watch("message.address", unverify), $scope.$watch("message.signature", unverify), $scope.$watch("message.message", unverify)
}), angular.module("insight.pools").controller("PoolsController", function($scope, $rootScope, $routeParams, $location, Global, StatisticsByDatePools, StatisticsByDaysNetHash, PoolChart) {
    function performTask() {
        if ($scope.legend && $scope.pools1) {
            for (var i = 0; i < $scope.legend.length; i++) $scope.pools1[i].fill = $scope.legend[i].fillStyle;
            $scope.pools = $scope.pools1
        }
    }

    function checkIfPerfomTask() {
        for (var key in events)
            if (!events[key]) return;
        performTask()
    }
    $scope.global = Global, $scope.loading = !1;
    var _formatTimestamp = function(date) {
        var yyyy = date.getUTCFullYear().toString(),
            mm = (date.getUTCMonth() + 1).toString(),
            dd = date.getUTCDate().toString();
        return yyyy + "-" + (mm[1] ? mm : "0" + mm[0]) + "-" + (dd[1] ? dd : "0" + dd[0])
    };
    $scope.$watch("dt", function(newValue, oldValue) {
        newValue !== oldValue && $location.path("/pools/" + _formatTimestamp(newValue))
    }), $scope.openCalendar = function($event) {
        $event.preventDefault(), $event.stopPropagation(), $scope.opened = !0
    }, $scope.humanSince = function(time) {
        var m = moment.unix(time).startOf("day"),
            b = moment().startOf("day");
        return m.max().from(b)
    };
    var self = this,
        date = new Date,
        yyyy = date.getUTCFullYear().toString(),
        mm = (date.getUTCMonth() + 1).toString(),
        dd = date.getUTCDate().toString(),
        today = yyyy + "-" + (mm[1] ? mm : "0" + mm[0]) + "-" + (dd[1] ? dd : "0" + dd[0]);
    $scope.type = "StackedBar", $scope.$on("chart-create", function(evt, chart) {
        $scope.legend = chart.chart.legend.legendItems, $scope.legend && $scope.legend.length > 0 && $scope.$emit("charted")
    });
    var events = {
        a: !1,
        b: !1
    };
    $scope.$on("charted", function() {
        events.a = !0, checkIfPerfomTask()
    }), $scope.$on("api", function() {
        events.b = !0, checkIfPerfomTask()
    }), self.chartDate = $routeParams.date ? $routeParams.date : today;
    var poolChart = new PoolChart(self.chartDate);
    poolChart.load(StatisticsByDatePools, "blocks_found", "Pools"), self.chartOptions = poolChart.chartOptions, self.init = function() {
        $scope.loading = !0, $routeParams.date && ($scope.detail = "On " + $routeParams.date), $rootScope.titleDetail = $scope.detail, StatisticsByDatePools.get({
            date: $routeParams.date
        }, function(res) {
            $scope.loading = !1, $scope.pools1 = res.blocks_by_pool, $scope.pagination = res.pagination, $scope.blocks = res.n_blocks_mined, $scope.pools1 && $scope.pools1.length > 0 && $scope.$emit("api")
        }), StatisticsByDaysNetHash.query({
            days: "all"
        }, function(res) {
            for (var i = 0; i < res.length; i++) res[i].date === self.chartDate.toString() && ($scope.nethash = res[i].sum)
        })
    }
}), angular.module("insight.richList").controller("RichListController", function($scope, $routeParams, StatisticsRichestList) {
    var self = this;
    self.items = [], self.loaded = !1, self.init = function() {
        StatisticsRichestList.query({}, function(items) {
            self.items = items, self.loaded = !0
        })
    }
}), angular.module("insight.system").controller("ScannerController", function($scope, $rootScope, $modalInstance, Global) {
    $scope.global = Global;
    var isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i)
        },
        BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry/i)
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i)
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i)
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i)
        },
        any: function() {
            return isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()
        }
    };
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia, window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL, $scope.isMobile = isMobile.any(), $scope.scannerLoading = !1;
    var cameraInput, video, canvas, $video, context, localMediaStream, $searchInput = angular.element(document.getElementById("search")),
        _scan = function(evt) {
            if ($scope.isMobile) {
                $scope.scannerLoading = !0;
                var files = evt.target.files;
                if (1 === files.length && 0 === files[0].type.indexOf("image/")) {
                    var file = files[0],
                        reader = new FileReader;
                    reader.onload = function(theFile) {
                        return function(e) {
                            var mpImg = new MegaPixImage(file);
                            mpImg.render(canvas, {
                                maxWidth: 200,
                                maxHeight: 200,
                                orientation: 6
                            }), setTimeout(function() {
                                qrcode.width = canvas.width, qrcode.height = canvas.height, qrcode.imagedata = context.getImageData(0, 0, qrcode.width, qrcode.height);
                                try {
                                    qrcode.decode()
                                } catch (e) {
                                    alert(e)
                                }
                            }, 1500)
                        }
                    }(file), reader.readAsDataURL(file)
                }
            } else {
                if (localMediaStream) {
                    context.drawImage(video, 0, 0, 300, 225);
                    try {
                        qrcode.decode()
                    } catch (e) {}
                }
                setTimeout(_scan, 500)
            }
        },
        _successCallback = function(stream) {
            video.src = window.URL && window.URL.createObjectURL(stream) || stream, localMediaStream = stream, video.play(), setTimeout(_scan, 1e3)
        },
        _scanStop = function() {
            $scope.scannerLoading = !1, $modalInstance.close(), $scope.isMobile || (localMediaStream.stop && localMediaStream.stop(), localMediaStream = null, video.src = "")
        },
        _videoError = function(err) {
            console.log("Video Error: " + JSON.stringify(err)), _scanStop()
        };
    qrcode.callback = function(data) {
        _scanStop();
        var str = 0 === data.indexOf("zcash:") ? data.substring(8) : data;
        console.log("QR code detected: " + str), $searchInput.val(str).triggerHandler("change").triggerHandler("submit")
    }, $scope.cancel = function() {
        _scanStop()
    }, $modalInstance.opened.then(function() {
        $rootScope.isCollapsed = !0, setTimeout(function() {
            canvas = document.getElementById("qr-canvas"), context = canvas.getContext("2d"), $scope.isMobile ? (cameraInput = document.getElementById("qrcode-camera"), cameraInput.addEventListener("change", _scan, !1)) : (video = document.getElementById("qrcode-scanner-video"), $video = angular.element(video), canvas.width = 300, canvas.height = 225, context.clearRect(0, 0, 300, 225), navigator.getUserMedia({
                video: !0
            }, _successCallback, _videoError))
        }, 500)
    })
}), angular.module("insight.search").controller("SearchController", function($scope, $routeParams, $location, $timeout, Global, Block, Transaction, Address, BlockByHeight) {
    $scope.global = Global, $scope.loading = !1;
    var _badQuery = function() {
            $scope.badQuery = !0, $timeout(function() {
                $scope.badQuery = !1
            }, 2e3)
        },
        _resetSearch = function() {
            $scope.q = "", $scope.loading = !1
        };
    $scope.search = function() {
        var q = $scope.q;
        $scope.badQuery = !1, $scope.loading = !0, Block.get({
            blockHash: q
        }, function() {
            _resetSearch(), $location.path("block/" + q)
        }, function() {
            Transaction.get({
                txId: q
            }, function() {
                _resetSearch(), $location.path("tx/" + q)
            }, function() {
                Address.get({
                    addrStr: q
                }, function() {
                    _resetSearch(), $location.path("address/" + q)
                }, function() {
                    isFinite(q) ? BlockByHeight.get({
                        blockHeight: q
                    }, function(hash) {
                        _resetSearch(), $location.path("/block/" + hash.blockHash)
                    }, function() {
                        $scope.loading = !1, _badQuery()
                    }) : ($scope.loading = !1, _badQuery())
                })
            })
        })
    }
}), angular.module("insight.statistics").controller("StatisticsController", function($scope, $routeParams, StatisticsByDaysTransactions, StatisticsByDaysOutputs, StatisticsByDaysNetHash, StatisticsByDaysFees, StatisticsByDaysDifficulty, PoolDayChart, Statistics24Hours, Statistics1Hour, gettextCatalog, $filter, Constants, StatisticChart, MarketsInfo, MiningInfo, StatisticsTotalSupply) {
    var self = this,
        factories = {
            transactions: {
                factory: StatisticsByDaysTransactions,
                field: "transaction_count"
            },
            outputs: {
                factory: StatisticsByDaysOutputs,
                field: "sum"
            },
            fees: {
                factory: StatisticsByDaysFees,
                field: "fee"
            },
            difficulty: {
                factory: StatisticsByDaysDifficulty,
                field: "sum"
            },
            nethash: {
                factory: StatisticsByDaysNetHash,
                field: "sum"
            }
        };
    self.chartText = {
        fees: gettextCatalog.getString("The daily average of fees paid to miners per transaction."),
        transactions: gettextCatalog.getString("The number of daily confirmed RVN transactions."),
        outputs: gettextCatalog.getString("The total value of all transaction outputs per day (includes coins returned to the sender as change)."),
        difficulty: gettextCatalog.getString("A relative measure of how difficult it is to find a new block. The difficulty is adjusted periodically as a function of how much hashing power has been deployed by the network of miners."),
        nethash: gettextCatalog.getString("The daily average Global Network Hashrate.")
    }, self.chartDays = $routeParams.days, self.chartType = $routeParams.type, self.marketCurrency = Constants.CURRENCY.USD, self.marketPrice = 0, self.marketBtcPrice = 0, self.marketCap = 0, self.volume = 0, self.percent = 0, self.difficulty = 0, self.networkhashps = 0, self.totalsupply = 0;
    var statisticChart = new StatisticChart(self.chartDays);
    self.chartOptions = statisticChart.chartOptions, self.daysButtons = statisticChart.daysButtons, $scope.$on("chart-create", function(evt, chart) {
        "line" === chart.chart.canvas.id && (statisticChart.changeChartColor(chart), chart.update())
    }), $scope.type = "StackedBar", self.getDifficulties = function() {
        statisticChart.load(factories[$routeParams.type].factory, factories[$routeParams.type].field, $routeParams.type)
    }, self.get24HoursStats = function() {
        Statistics24Hours.get(function(response) {
            self.statsTotal24 = response
        });
        var pools1hChart = new PoolDayChart;
        self.pools1hOptions = pools1hChart.chartOptions, pools1hChart.load(Statistics1Hour, "blocks_found", "Pools");
        var pools24hChart = new PoolDayChart;
        self.pools24hOptions = pools24hChart.chartOptions, pools24hChart.load(Statistics24Hours, "blocks_found", "Pools"), MarketsInfo.get({}, function(response) {
            response && (self.marketPrice = response.price_usd, self.marketBtcPrice = response.price_btc, self.marketCap = response.market_cap_usd, self.volume = response["24h_volume_usd"], self.percent = response.percent_change_24h)
        }), MiningInfo.get({}, function(response) {
            response && (self.difficulty = response.miningInfo.difficulty, self.networkhashps = response.miningInfo.networkhashps)
        }), StatisticsTotalSupply.get({}, function(response) {
            response && (self.totalsupply = response.supply)
        })
    }
}), angular.module("insight.status").controller("StatusController", function($scope, $routeParams, $location, Global, Status, Sync, Peers, getSocket) {
    $scope.global = Global, $scope.loading = !1, $scope.getStatus = function(q) {
        Status.get({
            q: "get" + q
        }, function(d) {
            $scope.loaded = 1, angular.extend($scope, d)
        }, function(e) {
            $scope.error = "API ERROR: " + e.data
        })
    }, $scope.humanSince = function(time) {
        var m = moment.unix(time / 1e3);
        return m.max().fromNow()
    };
    var _onSyncUpdate = function(sync) {
            $scope.sync = sync
        },
        _startSocket = function() {
            socket.emit("subscribe", "sync"), socket.on("status", function(sync) {
                _onSyncUpdate(sync)
            })
        },
        socket = getSocket($scope);
    socket.on("connect", function() {
        _startSocket()
    }), $scope.getSync = function() {
        _startSocket(), Sync.get({}, function(sync) {
            _onSyncUpdate(sync)
        }, function(e) {
            var err = "Could not get sync information" + e.toString();
            $scope.sync = {
                error: err
            }
        })
    }, $scope.getPeers = function() {
        $scope.loading = !0, Peers.get({}, function(res) {
            $scope.loading = !1, $scope.peers = res.peerInfo
        })
    }
}), angular.module("insight.transactions").controller("transactionsController", function($scope, $rootScope, $routeParams, $location, Global, Transaction, TransactionsByBlock, TransactionsByAddress) {
    $scope.global = Global, $scope.loading = !1, $scope.loadedBy = null;
    var pageNum = 0,
        pagesTotal = 1,
        COIN = 1e8,
        _aggregateItems = function(items) {
            if (!items) return [];
            for (var l = items.length, ret = [], tmp = {}, u = 0, i = 0; l > i; i++) {
                var notAddr = !1;
                if (items[i].scriptSig && !items[i].addr && (items[i].addr = "Unparsed address [" + u++ + "]", items[i].notAddr = !0, notAddr = !0), items[i].scriptPubKey && !items[i].scriptPubKey.addresses && (items[i].scriptPubKey.addresses = ["Unparsed address [" + u++ + "]"], items[i].notAddr = !0, notAddr = !0), items[i].scriptPubKey && items[i].scriptPubKey.addresses.length > 1) items[i].addr = items[i].scriptPubKey.addresses.join(","), ret.push(items[i]);
                else {
                    var addr = items[i].addr || items[i].scriptPubKey && items[i].scriptPubKey.addresses[0];
                    tmp[addr] || (tmp[addr] = {}, tmp[addr].valueSat = 0, tmp[addr].count = 0, tmp[addr].addr = addr, tmp[addr].items = []), tmp[addr].isSpent = items[i].spentTxId, tmp[addr].doubleSpentTxID = tmp[addr].doubleSpentTxID || items[i].doubleSpentTxID, tmp[addr].doubleSpentIndex = tmp[addr].doubleSpentIndex || items[i].doubleSpentIndex, tmp[addr].dbError = tmp[addr].dbError || items[i].dbError, tmp[addr].valueSat += Math.round(items[i].value * COIN), tmp[addr].items.push(items[i]), tmp[addr].notAddr = notAddr, items[i].unconfirmedInput && (tmp[addr].unconfirmedInput = !0), tmp[addr].count++
                }
            }
            return angular.forEach(tmp, function(v) {
                v.value = v.value || parseInt(v.valueSat) / COIN, ret.push(v)
            }), ret
        },
        _processTX = function(tx) {
            tx.vinSimple = _aggregateItems(tx.vin), tx.voutSimple = _aggregateItems(tx.vout)
        },
        _paginate = function(data) {
            $scope.loading = !1, pagesTotal = data.pagesTotal, pageNum += 1, data.txs.forEach(function(tx) {
                _processTX(tx), $scope.txs.push(tx)
            })
        },
        _byBlock = function() {
            TransactionsByBlock.get({
                block: $routeParams.blockHash,
                pageNum: pageNum
            }, function(data) {
                _paginate(data)
            })
        },
        _byAddress = function() {
            TransactionsByAddress.get({
                address: $routeParams.addrStr,
                pageNum: pageNum
            }, function(data) {
                _paginate(data)
            })
        },
        _findTx = function(txid) {
            Transaction.get({
                txId: txid
            }, function(tx) {
                $rootScope.titleDetail = tx.txid.substring(0, 7) + "...", $rootScope.flashMessage = null, $scope.tx = tx, _processTX(tx), $scope.txs.unshift(tx)
            }, function(e) {
                400 === e.status ? $rootScope.flashMessage = "Invalid Transaction ID: " + $routeParams.txId : 503 === e.status ? $rootScope.flashMessage = "Backend Error. " + e.data : $rootScope.flashMessage = "Transaction Not Found", $location.path("/")
            })
        };
    $scope.findThis = function() {
        _findTx($routeParams.txId)
    }, $scope.load = function(from) {
        $scope.loadedBy = from, $scope.loadMore()
    }, $scope.loadMore = function() {
        pagesTotal > pageNum && !$scope.loading && ($scope.loading = !0, "address" === $scope.loadedBy ? _byAddress() : _byBlock())
    }, (">" == $routeParams.v_type || "<" == $routeParams.v_type) && ($scope.from_vin = "<" == $routeParams.v_type ? !0 : !1, $scope.from_vout = ">" == $routeParams.v_type ? !0 : !1, $scope.v_index = parseInt($routeParams.v_index), $scope.itemsExpanded = !0), $scope.txs = [], $scope.$on("tx", function(event, txid) {
        _findTx(txid)
    })
}), angular.module("insight.transactions").controller("SendRawTransactionController", function($scope, $http) {
    $scope.transaction = "", $scope.status = "ready", $scope.txid = "", $scope.error = null, $scope.formValid = function() {
        return !!$scope.transaction
    }, $scope.send = function() {
        var postData = {
            rawtx: $scope.transaction
        };
        $scope.status = "loading", $http.post(window.apiPrefix + "/tx/send", postData).success(function(data, status, headers, config) {
            return "string" != typeof data.txid ? ($scope.status = "error", void($scope.error = "The transaction was sent but no transaction id was got back")) : ($scope.status = "sent", void($scope.txid = data.txid))
        }).error(function(data, status, headers, config) {
            $scope.status = "error", data ? $scope.error = data : $scope.error = "No error message given (connection error?)"
        })
    }
}), angular.module("insight.address").factory("Address", function($resource) {
    return $resource(window.apiPrefix + "/addr/:addrStr/?noTxList=1", {
        addrStr: "@addStr"
    }, {
        get: {
            method: "GET",
            interceptor: {
                response: function(res) {
                    return res.data
                },
                responseError: function(res) {
                    return 404 === res.status ? res : void 0
                }
            }
        }
    })
}), angular.module("insight.blocks").factory("Block", function($resource) {
    return $resource(window.apiPrefix + "/block/:blockHash", {
        blockHash: "@blockHash"
    }, {
        get: {
            method: "GET",
            interceptor: {
                response: function(res) {
                    return res.data
                },
                responseError: function(res) {
                    return 404 === res.status ? res : void 0
                }
            }
        }
    })
}).factory("Blocks", function($resource) {
    return $resource(window.apiPrefix + "/blocks")
}).factory("BlockByHeight", function($resource) {
    return $resource(window.apiPrefix + "/block-index/:blockHeight")
}), angular.module("insight.chart").factory("StatisticChart", function(gettextCatalog, $filter) {
    function StatisticChart(days) {
        this.days = days, this.chartOptions = {
            series: ["Test"],
            datasetOverride: [{
                defaultFontFamily: "Ubuntu,sans-serif",
                yAxisID: "y-axis-1",
                borderColor: "#012d88",
                borderWidth: 1,
                pointBorderColor: "#012d88",
                pointBackgroundColor: "#012d88",
                pointBorderWidth: 0,
                pointRadius: 0,
                pointHoverBackgroundColor: "#012d88",
                pointHoverBorderColor: "#012d88",
                pointHoverBorderWidth: 1,
                pointHitRadius: 10,
                pointStyle: "rect",
                lineTension: 0
            }],
            options: {
                tooltips: {
                    backgroundColor: "#012d88",
                    titleFontFamily: "Ubuntu,sans-serif",
                    titleFontSize: 12,
                    titleFontStyle: "500",
                    titleFontColor: "#ffffff",
                    bodyFontFamily: "Ubuntu,sans-serif",
                    bodyFontSize: 12,
                    bodyFontStyle: "400",
                    bodyFontColor: "#ffffff",
                    caretSize: 5,
                    cornerRadius: 3,
                    displayColors: !1,
                    callbacks: {}
                },
                layout: {
                    padding: {
                        left: 5
                    }
                },
                scales: {
                    yAxes: [{
                        id: "y-axis-1",
                        type: "linear",
                        display: !0,
                        position: "left",
                        gridLines: {
                            color: "#4700cc",
                            drawBorder: !1,
                            offsetGridLines: !0,
                            zeroLineColor: "#4700cc"
                        },
                        ticks: {
                            fontColor: "#4700cc",
                            fontFamily: "Ubuntu,sans-serif",
                            fontSize: 14,
                            padding: 20
                        }
                    }],
                    xAxes: [{
                        type: "time",
                        time: {
                            unit: days > 60 || "all" == days ? "month" : "day",
                            displayFormats: {
                                month: "MMM'DD",
                                day: "MMM'DD"
                            },
                            max: Date.now()
                        },
                        gridLines: {
                            color: "#4700cc",
                            drawBorder: !1,
                            drawOnChartArea: !1,
                            drawTicks: !0,
                            zeroLineColor: "#4700cc"
                        },
                        ticks: {
                            fontColor: "#4700cc",
                            fontSize: 10,
                            fontFamily: "Ubuntu,sans-serif"
                        }
                    }]
                }
            }
        }, this.daysButtons = [{
            days: 30,
            name: "30 " + gettextCatalog.getString("Days")
        }, {
            days: 60,
            name: "60 " + gettextCatalog.getString("Days")
        }, {
            days: 180,
            name: "180 " + gettextCatalog.getString("Days")
        }, {
            days: 365,
            name: "1 " + gettextCatalog.getString("Year")
        }, {
            days: 730,
            name: "2 " + gettextCatalog.getString("Years")
        }, {
            days: "all",
            name: gettextCatalog.getString("All Time")
        }], this.chartStats = []
    }
    return StatisticChart.prototype.changeChartColor = function(chart) {
        var ctx = chart.chart.ctx,
            gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, "rgba(1, 45, 136,0.9686274509803922)"), gradient.addColorStop(1, "rgba(0, 0, 0,0.001)"), chart.chart.config.data.datasets[0].backgroundColor = gradient
    }, StatisticChart.prototype.load = function(factory, itemField, itemName, fill) {
        var self = this;
        factory.query({
            days: self.days
        }, function(response) {
            if (fill)
                for (; response.length < self.days;) {
                    var emptyItem = {};
                    emptyItem.date = moment().subtract(self.days - (self.days - response.length), "days").format("YYYY-MM-DD"), emptyItem[itemField] = 0, response.push(emptyItem)
                }
            response.reverse(), self.chartOptions.labels = response.map(function(item) {
                return item.date
            }), self.chartOptions.data = response.map(function(item) {
                return item[itemField]
            }), self.chartOptions.options.scales.yAxes[0].ticks.callback = function(value) {
                return value > 999 ? $filter("numeraljs")(value, "0,0") : parseFloat(value.toFixed(6))
            }, self.chartOptions.series = [itemName], self.chartOptions.options.tooltips.callbacks.beforeTitle = function(text) {
                text[0].yLabel = itemName.charAt(0).toUpperCase() + itemName.substr(1) + ": " + $filter("numeraljs")(text[0].yLabel, "0,0.[00000000]")
            }, self.chartStats = response
        })
    }, StatisticChart
}), angular.module("insight.currency").factory("Currency", function($resource) {
    return $resource(window.apiPrefix + "/currency")
}), angular.module("insight.system").factory("Global", [function() {
    return {}
}]).factory("Version", function($resource) {
    return $resource(window.apiPrefix + "/version")
}), angular.module("insight.pool").factory("PoolChart", function(gettextCatalog, $filter) {
    function PoolChart(date) {
        this.date = date, this.chartOptions = {
            series: ["Test"],
            data: [],
            labels: ["Test1"],
            datasetOverride: [],
            options: {
                plugins: {
                    stacked100: {
                        enable: !0,
                        replaceTooltipLabel: !0
                    }
                },
                tooltips: {
                    mode: "dataset",
                    intersect: !0,
                    backgroundColor: "#012d88",
                    titleFontFamily: "Ubuntu,sans-serif",
                    titleFontSize: 12,
                    titleFontStyle: "500",
                    titleFontColor: "#ffffff",
                    bodyFontFamily: "Ubuntu,sans-serif",
                    bodyFontSize: 12,
                    bodyFontStyle: "400",
                    bodyFontColor: "#ffffff",
                    caretSize: 5,
                    cornerRadius: 3,
                    displayColors: !1,
                    callbacks: {}
                },
                layout: {
                    padding: {
                        left: 5
                    }
                },
                legend: {
                    display: !1,
                    position: "bottom",
                    labels: {
                        fontColor: "#4700cc",
                        fontFamily: "Ubuntu,sans-serif"
                    }
                },
                hover: {
                    mode: "single"
                },
                scales: {
                    xAxes: [{
                        display: !1,
                        stacked: !0,
                        gridLines: {
                            display: !1,
                            drawBorder: !1
                        }
                    }],
                    yAxes: [{
                        display: !1,
                        stacked: !0,
                        gridLines: {
                            display: !1,
                            drawBorder: !1
                        }
                    }]
                }
            }
        }
    }
    return PoolChart.prototype.load = function(factory, itemField, itemName) {
        var self = this;
        factory.get({
            date: self.date
        }, function(response) {
            var array = response.blocks_by_pool;
            self.chartOptions.labels = [], self.chartOptions.data = array.map(function(item) {
                return [item[itemField]]
            }), self.chartOptions.datasetOverride = array.map(function(item) {
                function getRandomColor() {
                    for (var letters = "0123456789ABCDEF".split(""), color = "#", i = 0; 6 > i; i++) color += letters[Math.floor(16 * Math.random())];
                    return color
                }
                return pallete = getRandomColor(), {
                    label: item.poolName,
                    data: [item[itemField]],
                    hoverBorderColor: "#012d88",
                    hoverBackgroundColor: pallete,
                    backgroundColor: pallete + "bd",
                    borderColor: pallete,
                    borderWidth: 2
                }
            }), self.chartOptions.series = [itemName]
        })
    }, PoolChart
});
var ScopedSocket = function(socket, $rootScope) {
    this.socket = socket, this.$rootScope = $rootScope, this.listeners = []
};
ScopedSocket.prototype.removeAllListeners = function(opts) {
    opts || (opts = {});
    for (var i = 0; i < this.listeners.length; i++) {
        var details = this.listeners[i];
        opts.skipConnect && "connect" === details.event || this.socket.removeListener(details.event, details.fn)
    }
    this.listeners = []
}, ScopedSocket.prototype.on = function(event, callback) {
    var socket = this.socket,
        $rootScope = this.$rootScope,
        wrapped_callback = function() {
            var args = arguments;
            $rootScope.$apply(function() {
                callback.apply(socket, args)
            })
        };
    socket.on(event, wrapped_callback), this.listeners.push({
        event: event,
        fn: wrapped_callback
    })
}, ScopedSocket.prototype.emit = function(event, data, callback) {
    var socket = this.socket,
        $rootScope = this.$rootScope,
        args = Array.prototype.slice.call(arguments);
    args.push(function() {
        var args = arguments;
        $rootScope.$apply(function() {
            callback && callback.apply(socket, args)
        })
    }), socket.emit.apply(socket, args)
}, angular.module("insight.socket").factory("getSocket", function($rootScope) {
    var socket = io.connect(null, {
        reconnect: !0,
        "reconnection delay": 500
    });
    return function(scope) {
        var scopedSocket = new ScopedSocket(socket, $rootScope);
        return scope.$on("$destroy", function() {
            scopedSocket.removeAllListeners()
        }), socket.on("connect", function() {
            scopedSocket.removeAllListeners({
                skipConnect: !0
            })
        }), scopedSocket
    }
}), angular.module("insight.statistics").factory("StatisticsByDaysTransactions", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/transactions", {
            days: "@days"
        })
    }).factory("StatisticsByDaysFees", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/fees", {
            days: "@days"
        })
    }).factory("StatisticsByDaysOutputs", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/outputs", {
            days: "@days"
        })
    }).factory("StatisticsByDaysDifficulty", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/difficulty", {
            days: "@days"
        })
    }).factory("StatisticsByDaysSupply", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/supply", {
            days: "@days"
        })
    }).factory("StatisticsByDaysNetHash", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/network-hash", {
            days: "@days"
        })
    }).factory("StatisticsByDatePools", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/pools")
    }).factory("Statistics24Hours", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/total")
    }).factory("Statistics1Hour", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/pools-last-hour")
    }).factory("StatisticsTotalSupply", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/total-supply?format=object", {})
    }).factory("StatisticsBalanceIntervals", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/balance-intervals")
    }).factory("StatisticsRicherThan", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/richer-than")
    }).factory("StatisticsRichestList", function($resource, $window) {
        return $resource($window.apiPrefix + "/statistics/richest-addresses-list")
    }).factory("PoolDayChart", function(gettextCatalog, $filter) {
        function PoolDayChart() {
            this.chartOptions = {
                series: ["Test"],
                data: [],
                labels: ["Test1"],
                datasetOverride: [],
                options: {
                    plugins: {
                        stacked100: {
                            enable: !0,
                            replaceTooltipLabel: !0
                        }
                    },
                    tooltips: {
                        mode: "dataset",
                        intersect: !0,
                        backgroundColor: "#012d88",
                        titleFontFamily: "Ubuntu,sans-serif",
                        titleFontSize: 12,
                        titleFontStyle: "500",
                        titleFontColor: "#ffffff",
                        bodyFontFamily: "Ubuntu,sans-serif",
                        bodyFontSize: 12,
                        bodyFontStyle: "400",
                        bodyFontColor: "#ffffff",
                        caretSize: 5,
                        cornerRadius: 3,
                        displayColors: !1,
                        callbacks: {}
                    },
                    layout: {
                        padding: {
                            left: 5
                        }
                    },
                    legend: {
                        display: !0,
                        position: "bottom",
                        labels: {
                            fontColor: "#4700cc",
                            fontFamily: "Ubuntu,sans-serif"
                        }
                    },
                    hover: {
                        mode: "single"
                    },
                    scales: {
                        xAxes: [{
                            display: !1,
                            stacked: !0,
                            gridLines: {
                                display: !1,
                                drawBorder: !1
                            }
                        }],
                        yAxes: [{
                            display: !1,
                            stacked: !0,
                            gridLines: {
                                display: !1,
                                drawBorder: !1
                            }
                        }]
                    }
                }
            }
        }
        return PoolDayChart.prototype.load = function(factory, itemField, itemName) {
            var self = this;
            factory.get({}, function(response) {
                var array = response.blocks_by_pool;
                self.chartOptions.labels = [], self.chartOptions.data = array.map(function(item) {
                    return [item[itemField]]
                }), self.chartOptions.datasetOverride = array.map(function(item) {
                    function getRandomColor() {
                        for (var letters = "0123456789ABCDEF".split(""), color = "#", i = 0; 6 > i; i++) color += letters[Math.floor(16 * Math.random())];
                        return color
                    }
                    return pallete = getRandomColor(), {
                        label: item.poolName,
                        data: [item[itemField]],
                        hoverBorderColor: "#012d88",
                        hoverBackgroundColor: pallete,
                        backgroundColor: pallete + "bd",
                        borderColor: pallete,
                        borderWidth: 2
                    }
                }), self.chartOptions.series = [itemName]
            })
        }, PoolDayChart
}), angular.module("insight.status").factory("Status", function($resource) {
    return $resource(window.apiPrefix + "/status", {
        q: "@q"
    })
}).factory("Sync", function($resource) {
    return $resource(window.apiPrefix + "/sync")
}).factory("PeerSync", function($resource) {
    return $resource(window.apiPrefix + "/peer")
}).factory("Peers", function($resource) {
    return $resource(window.apiPrefix + "/status?q=getPeerInfo")
}).factory("MiningInfo", function($resource) {
    return $resource(window.apiPrefix + "/status?q=getMiningInfo")
}), angular.module("insight.transactions").factory("Transaction", function($resource) {
    return $resource(window.apiPrefix + "/tx/:txId", {
        txId: "@txId"
    }, {
        get: {
            method: "GET",
            interceptor: {
                response: function(res) {
                    return res.data
                },
                responseError: function(res) {
                    return 404 === res.status ? res : void 0
                }
            }
        }
    })
}).factory("TransactionsByBlock", function($resource) {
    return $resource(window.apiPrefix + "/txs", {
        block: "@block"
    })
}).factory("TransactionsByAddress", function($resource) {
    return $resource(window.apiPrefix + "/txs", {
        address: "@address"
    })
}).factory("Transactions", function($resource) {
    return $resource(window.apiPrefix + "/txs")
});
var ZeroClipboard = window.ZeroClipboard;
angular.module("insight").directive("scroll", function($window) {
    return function(scope, element, attrs) {
        angular.element($window).bind("scroll", function() {
            this.pageYOffset >= 200 ? scope.secondaryNavbar = !0 : scope.secondaryNavbar = !1, scope.$apply()
        })
    }
}).directive("whenScrolled", function($window) {
    return {
        restric: "A",
        link: function(scope, elm, attr) {
            var pageHeight, clientHeight, scrollPos;
            $window = angular.element($window);
            var handler = function() {
                pageHeight = window.document.documentElement.scrollHeight, clientHeight = window.document.documentElement.clientHeight, scrollPos = window.pageYOffset, pageHeight - (scrollPos + clientHeight) === 0 && scope.$apply(attr.whenScrolled)
            };
            $window.on("scroll", handler), scope.$on("$destroy", function() {
                return $window.off("scroll", handler)
            })
        }
    }
}).directive("clipCopy", function() {
    return ZeroClipboard.config({
        moviePath: "/lib/zeroclipboard/ZeroClipboard.swf",
        trustedDomains: ["*"],
        allowScriptAccess: "always",
        forceHandCursor: !0
    }), {
        restric: "A",
        scope: {
            clipCopy: "=clipCopy"
        },
        template: '<div class="tooltip fade right in"><div class="tooltip-arrow"></div><div class="tooltip-inner">Copied!</div></div>',
        link: function(scope, elm) {
            var clip = new ZeroClipboard(elm);
            clip.on("load", function(client) {
                var onMousedown = function(client) {
                    client.setText(scope.clipCopy)
                };
                client.on("mousedown", onMousedown), scope.$on("$destroy", function() {
                    client.off("mousedown", onMousedown)
                })
            }), clip.on("noFlash wrongflash", function() {
                return elm.remove()
            })
        }
    }
}).directive("focus", function($timeout) {
    return {
        scope: {
            trigger: "@focus"
        },
        link: function(scope, element) {
            scope.$watch("trigger", function(value) {
                "true" === value && $timeout(function() {
                    element[0].focus()
                })
            })
        }
    }
}), angular.module("insight").filter("startFrom", function() {
    return function(input, start) {
        return start = +start, input.slice(start)
    }
}).filter("split", function() {
    return function(input, delimiter) {
        var delimiter = delimiter || ",";
        return input.split(delimiter)
    }
}), angular.module("insight").config(function($routeProvider) {
    $routeProvider.when("/block/:blockHash", {
        templateUrl: "views/block.html",
        title: "Zcash Block "
    }).when("/block-index/:blockHeight", {
        controller: "BlocksController",
        templateUrl: "views/redirect.html"
    }).when("/tx/send", {
        templateUrl: "views/transaction_sendraw.html",
        title: "Broadcast Raw Transaction"
    }).when("/tx/:txId/:v_type?/:v_index?", {
        templateUrl: "views/transaction.html",
        title: "Zcash Transaction "
    }).when("/", {
        templateUrl: "views/index.html",
        title: "Home"
    }).when("/blocks", {
        templateUrl: "views/block_list.html",
        title: "Zcash Blocks solved Today"
    }).when("/blocks-date/:blockDate/:startTimestamp?", {
        templateUrl: "views/block_list.html",
        title: "Zcash Blocks solved "
    }).when("/address/:addrStr", {
        templateUrl: "views/address.html",
        title: "Zcash Address "
    }).when("/charts/:chartType?", {
        templateUrl: "views/charts.html",
        title: "Charts"
    }).when("/status", {
        templateUrl: "views/status.html",
        title: "Status"
    }).when("/messages/verify", {
        templateUrl: "views/messages_verify.html",
        title: "Verify Message"
    }).otherwise({
        templateUrl: "views/404.html",
        title: "Error"
    })
}), angular.module("insight").config(function($locationProvider) {
    $locationProvider.html5Mode(!0), $locationProvider.hashPrefix("!")
}).run(function($rootScope, $route, $location, $routeParams, $anchorScroll, ngProgress, gettextCatalog, amMoment) {
    gettextCatalog.currentLanguage = defaultLanguage, amMoment.changeLocale(defaultLanguage), $rootScope.$on("$routeChangeStart", function() {
        ngProgress.start()
    }), $rootScope.$on("$routeChangeSuccess", function() {
        ngProgress.complete(), $rootScope.titleDetail = "", $rootScope.title = $route.current.title, $rootScope.isCollapsed = !0, $rootScope.currentAddr = null, $location.hash($routeParams.scrollTo), $anchorScroll()
    })
}), angular.element(document).ready(function() {}), angular.module("insight").run(["gettextCatalog", function(gettextCatalog) {
    gettextCatalog.setStrings("de_DE", {
        "(Input unconfirmed)": "(Eingabe unbestätigt)",
        "404 Page not found :(": "404 Seite nicht gefunden :(",
        '<strong>insight</strong>  is an <a href="http://live.insight.is/" target="_blank">open-source Zcash blockchain explorer</a> with complete REST and websocket APIs that can be used for writing web wallets and other apps  that need more advanced blockchain queries than provided by zcashd RPC.  Check out the <a href="https://github.com/str4d/insight-ui-zcash" target="_blank">source code</a>.': '<strong>insight</strong> ist ein <a href="http://live.insight.is/" target="_blank">Open Source Zcash Blockchain Explorer</a> mit vollständigen REST und Websocket APIs um eigene Wallets oder Applikationen zu implementieren. Hierbei werden fortschrittlichere Abfragen der Blockchain ermöglicht, bei denen die RPC des Zcashd nicht mehr ausreichen. Der aktuelle <a href="https://github.com/str4d/insight-ui-zcash" target="_blank">Quellcode</a> ist auf Github zu finden.',
        '<strong>insight</strong> is still in development, so be sure to report any bugs and provide feedback for improvement at our <a href="https://github.com/bitpay/insight/issues" target="_blank">github issue tracker</a>.': '<strong>insight</strong> befindet sich aktuell noch in der Entwicklung. Bitte sende alle gefundenen Fehler (Bugs) und Feedback zur weiteren Verbesserung an unseren <a href="https://github.com/str4d/insight-ui-zcash/issues" target="_blank">Github Issue Tracker</a>.',
        About: "Über insight",
        Address: "Adresse",
        Age: "Alter",
        "Application Status": "Programmstatus",
        "Best Block": "Bester Block",
        "Zcash node information": "Zcash-Node Info",
        Block: "Block",
        "Block Reward": "Belohnung",
        Blocks: "Blöcke",
        "Bytes Serialized": "Serialisierte Bytes",
        "Can't connect to zcashd to get live updates from the p2p network. (Tried connecting to zcashd at {{host}}:{{port}} and failed.)": "Es ist nicht möglich mit Zcashd zu verbinden um live Aktualisierungen vom P2P Netzwerk zu erhalten. (Verbindungsversuch zu zcashd an {{host}}:{{port}} ist fehlgeschlagen.)",
        "Can't connect to insight server. Attempting to reconnect...": "Keine Verbindung zum insight-Server möglich. Es wird versucht die Verbindung neu aufzubauen...",
        "Can't connect to internet. Please, check your connection.": "Keine Verbindung zum Internet möglich, bitte Zugangsdaten prüfen.",
        Complete: "Vollständig",
        Confirmations: "Bestätigungen",
        Conn: "Verbindungen",
        "Connections to other nodes": "Verbindungen zu Nodes",
        "Current Blockchain Tip (insight)": "Aktueller Blockchain Tip (insight)",
        "Current Sync Status": "Aktueller Status",
        Details: "Details",
        Difficulty: "Schwierigkeit",
        "Double spent attempt detected. From tx:": 'Es wurde ein "double Spend" Versuch erkannt.Von tx:',
        "Error!": "Fehler!",
        Fee: "Gebühr",
        "Final Balance": "Schlussbilanz",
        "Finish Date": "Fertigstellung",
        "Go to home": "Zur Startseite",
        "Hash Serialized": "Hash Serialisiert",
        Height: "Höhe",
        "Included in Block": "Eingefügt in Block",
        "Incoherence in levelDB detected:": "Es wurde eine Zusammenhangslosigkeit in der LevelDB festgestellt:",
        "Info Errors": "Fehlerbeschreibung",
        "Initial Block Chain Height": "Ursprüngliche Blockchain Höhe",
        Input: "Eingänge",
        "Last Block": "Letzter Block",
        "Last Block Hash (Zcashd)": "Letzter Hash (Zcashd)",
        "Latest Blocks": "Letzte Blöcke",
        "Latest Transactions": "Letzte Transaktionen",
        "Loading Address Information": "Lade Adressinformationen",
        "Loading Block Information": "Lade Blockinformation",
        "Loading Selected Date...": "Lade gewähltes Datum...",
        "Loading Transaction Details": "Lade Transaktionsdetails",
        "Loading Transactions...": "Lade Transaktionen...",
        "Loading...": "Lade...",
        "Mined Time": "Block gefunden (Mining)",
        "Mined by": "Gefunden von",
        "Mining Difficulty": "Schwierigkeitgrad",
        "Next Block": "Nächster Block",
        "No Inputs (Newly Generated Coins)": "Keine Eingänge (Neu generierte Coins)",
        "No blocks yet.": "Keine Blöcke bisher.",
        "No matching records found!": "Keine passenden Einträge gefunden!",
        "No. Transactions": "Anzahl Transaktionen",
        "Number Of Transactions": "Anzahl der Transaktionen",
        Output: "Ausgänge",
        "Powered by": "Powered by",
        "Previous Block": "Letzter Block",
        "Protocol version": "Protokollversion",
        "Proxy setting": "Proxyeinstellung",
        "Received Time": "Eingangszeitpunkt",
        "Redirecting...": "Umleitung...",
        "Search for block, transaction or address": "Suche Block, Transaktion oder Adresse",
        "See all blocks": "Alle Blöcke anzeigen",
        "Show Transaction Output data": "Zeige Abgänge",
        "Show all": "Zeige Alles",
        "Show input": "Zeige Eingänge",
        "Show less": "Weniger anzeigen",
        "Show more": "Mehr anzeigen",
        Size: "Größe",
        "Size (bytes)": "Größe (bytes)",
        "Skipped Blocks (previously synced)": "Verworfene Blöcke (bereits syncronisiert)",
        "Start Date": "Startdatum",
        Status: "Status",
        Summary: "Zusammenfassung",
        "Summary <small>confirmed</small>": "Zusammenfassung <small>bestätigt</small>",
        "Sync Progress": "Fortschritt",
        "Sync Status": "Syncronisation",
        "Sync Type": "Art der Syncronisation",
        "Synced Blocks": "Syncronisierte Blöcke",
        Testnet: "Testnet aktiv",
        "There are no transactions involving this address.": "Es gibt keine Transaktionen zu dieser Adressse",
        "Time Offset": "Zeitoffset zu UTC",
        Timestamp: "Zeitstempel",
        Today: "Heute",
        "Total Amount": "Gesamtsumme",
        "Total Received": "Insgesamt empfangen",
        "Total Sent": "Insgesamt gesendet",
        Transaction: "Transaktion",
        "Transaction Output Set Information": "Transaktions Abgänge",
        "Transaction Outputs": "Abgänge",
        Transactions: "Transaktionen",
        Type: "Typ",
        Unconfirmed: "Unbestätigt",
        "Unconfirmed Transaction!": "Unbestätigte Transaktion!",
        "Unconfirmed Txs Balance": "Unbestätigtes Guthaben",
        "Value Out": "Wert",
        Version: "Version",
        "Waiting for blocks...": "Warte auf Blöcke...",
        "Waiting for transactions...": "Warte auf Transaktionen...",
        "by date.": "nach Datum.",
        "first seen at": "zuerst gesehen am",
        mined: "gefunden",
        "mined on:": "vom:",
        "Waiting for blocks": "Warte auf Blöcke"
    }), gettextCatalog.setStrings("es", {
        "(Input unconfirmed)": "(Entrada sin confirmar)",
        "404 Page not found :(": "404 Página no encontrada :(",
        '<strong>insight</strong>  is an <a href="http://live.insight.is/" target="_blank">open-source Zcash blockchain explorer</a> with complete REST and websocket APIs that can be used for writing web wallets and other apps  that need more advanced blockchain queries than provided by zcashd RPC.  Check out the <a href="https://github.com/str4d/insight-ui-zcash" target="_blank">source code</a>.': '<strong>insight</strong>  es un <a href="http://live.insight.is/" target="_blank">explorador de bloques de Zcash open-source</a> con un completo conjunto de REST y APIs de websockets que pueden ser usadas para escribir monederos de Zcashs y otras aplicaciones que requieran consultar un explorador de bloques.  Obtén el código en <a href="http://github.com/bitpay/insight" target="_blank">el repositorio abierto de Github</a>.',
        '<strong>insight</strong> is still in development, so be sure to report any bugs and provide feedback for improvement at our <a href="https://github.com/bitpay/insight/issues" target="_blank">github issue tracker</a>.': '<strong>insight</strong> esta en desarrollo aún, por ello agradecemos que nos reporten errores o sugerencias para mejorar el software. <a href="https://github.com/str4d/insight-ui-zcash/issues" target="_blank">Github issue tracker</a>.',
        About: "Acerca de",
        Address: "Dirección",
        Age: "Edad",
        "Application Status": "Estado de la Aplicación",
        "Best Block": "Mejor Bloque",
        "Zcash node information": "Información del nodo Zcash",
        Block: "Bloque",
        "Block Reward": "Bloque Recompensa",
        Blocks: "Bloques",
        "Bytes Serialized": "Bytes Serializados",
        "Can't connect to zcashd to get live updates from the p2p network. (Tried connecting to zcashd at {{host}}:{{port}} and failed.)": "No se pudo conectar a zcashd para obtener actualizaciones en vivo de la red p2p. (Se intentó conectar a zcashd de {{host}}:{{port}} y falló.)",
        "Can't connect to insight server. Attempting to reconnect...": "No se pudo conectar al servidor insight. Intentando re-conectar...",
        "Can't connect to internet. Please, check your connection.": "No se pudo conectar a Internet. Por favor, verifique su conexión.",
        Complete: "Completado",
        Confirmations: "Confirmaciones",
        Conn: "Con",
        "Connections to other nodes": "Conexiones a otros nodos",
        "Current Blockchain Tip (insight)": "Actual Blockchain Tip (insight)",
        "Current Sync Status": "Actual Estado de Sincronización",
        Details: "Detalles",
        Difficulty: "Dificultad",
        "Double spent attempt detected. From tx:": "Intento de doble gasto detectado. De la transacción:",
        "Error!": "¡Error!",
        Fee: "Tasa",
        "Final Balance": "Balance Final",
        "Finish Date": "Fecha Final",
        "Go to home": "Volver al Inicio",
        "Hash Serialized": "Hash Serializado",
        Height: "Altura",
        "Included in Block": "Incluido en el Bloque",
        "Incoherence in levelDB detected:": "Detectada una incoherencia en levelDB:",
        "Info Errors": "Errores de Información",
        "Initial Block Chain Height": "Altura de la Cadena en Bloque Inicial",
        Input: "Entrada",
        "Last Block": "Último Bloque",
        "Last Block Hash (Zcashd)": "Último Bloque Hash (Zcashd)",
        "Latest Blocks": "Últimos Bloques",
        "Latest Transactions": "Últimas Transacciones",
        "Loading Address Information": "Cargando Información de la Dirección",
        "Loading Block Information": "Cargando Información del Bloque",
        "Loading Selected Date...": "Cargando Fecha Seleccionada...",
        "Loading Transaction Details": "Cargando Detalles de la Transacción",
        "Loading Transactions...": "Cargando Transacciones...",
        "Loading...": "Cargando...",
        "Mined Time": "Hora de Minado",
        "Mined by": "Minado por",
        "Mining Difficulty": "Dificultad de Minado",
        "Next Block": "Próximo Bloque",
        "No Inputs (Newly Generated Coins)": "Sin Entradas (Monedas Recién Generadas)",
        "No blocks yet.": "No hay bloques aún.",
        "No matching records found!": "¡No se encontraron registros coincidentes!",
        "No. Transactions": "Nro. de Transacciones",
        "Number Of Transactions": "Número de Transacciones",
        Output: "Salida",
        "Powered by": "Funciona con",
        "Previous Block": "Bloque Anterior",
        "Protocol version": "Versión del protocolo",
        "Proxy setting": "Opción de proxy",
        "Received Time": "Hora de Recibido",
        "Redirecting...": "Redireccionando...",
        "Search for block, transaction or address": "Buscar bloques, transacciones o direcciones",
        "See all blocks": "Ver todos los bloques",
        "Show Transaction Output data": "Mostrar dato de Salida de la Transacción",
        "Show all": "Mostrar todos",
        "Show input": "Mostrar entrada",
        "Show less": "Ver menos",
        "Show more": "Ver más",
        Size: "Tamaño",
        "Size (bytes)": "Tamaño (bytes)",
        "Skipped Blocks (previously synced)": "Bloques Saltados (previamente sincronizado)",
        "Start Date": "Fecha de Inicio",
        Status: "Estado",
        Summary: "Resumen",
        "Summary <small>confirmed</small>": "Resumen <small>confirmados</small>",
        "Sync Progress": "Proceso de Sincronización",
        "Sync Status": "Estado de Sincronización",
        "Sync Type": "Tipo de Sincronización",
        "Synced Blocks": "Bloques Sincornizados",
        Testnet: "Red de prueba",
        "There are no transactions involving this address.": "No hay transacciones para esta dirección",
        "Time Offset": "Desplazamiento de hora",
        Timestamp: "Fecha y hora",
        Today: "Hoy",
        "Total Amount": "Cantidad Total",
        "Total Received": "Total Recibido",
        "Total Sent": "Total Enviado",
        Transaction: "Transacción",
        "Transaction Output Set Information": "Información del Conjunto de Salida de la Transacción",
        "Transaction Outputs": "Salidas de la Transacción",
        Transactions: "Transacciones",
        Type: "Tipo",
        Unconfirmed: "Sin confirmar",
        "Unconfirmed Transaction!": "¡Transacción sin confirmar!",
        "Unconfirmed Txs Balance": "Balance sin confirmar",
        "Value Out": "Valor de Salida",
        Version: "Versión",
        "Waiting for blocks...": "Esperando bloques...",
        "Waiting for transactions...": "Esperando transacciones...",
        "by date.": "por fecha.",
        "first seen at": "Visto a",
        mined: "minado",
        "mined on:": "minado el:",
        "Waiting for blocks": "Esperando bloques"
    }), gettextCatalog.setStrings("ja", {
        "(Input unconfirmed)": "(入力は未検証です)",
        "404 Page not found :(": "404 ページがみつかりません (´・ω・`)",
        '<strong>insight</strong>  is an <a href="http://live.insight.is/" target="_blank">open-source Zcash blockchain explorer</a> with complete REST and websocket APIs that can be used for writing web wallets and other apps  that need more advanced blockchain queries than provided by zcashd RPC.  Check out the <a href="https://github.com/str4d/insight-ui-zcash" target="_blank">source code</a>.': '<strong>insight</strong>は、zcashd RPCの提供するものよりも詳細なブロックチェインへの問い合わせを必要とするウェブウォレットやその他のアプリを書くのに使える、完全なRESTおよびwebsocket APIを備えた<a href="http://live.insight.is/" target="_blank">オープンソースのビットコインブロックエクスプローラ</a>です。<a href="https://github.com/str4d/insight-ui-zcash" target="_blank">ソースコード</a>を確認',
        '<strong>insight</strong> is still in development, so be sure to report any bugs and provide feedback for improvement at our <a href="https://github.com/bitpay/insight/issues" target="_blank">github issue tracker</a>.': '<strong>insight</strong>は現在開発中です。<a href="https://github.com/bitpay/insight/issues" target="_blank">githubのissueトラッカ</a>にてバグの報告や改善案の提案をお願いします。',
        About: "はじめに",
        Address: "アドレス",
        Age: "生成後経過時間",
        "An error occured in the verification process.": "検証過程でエラーが発生しました。",
        "An error occured:<br>{{error}}": "エラーが発生しました:<br>{{error}}",
        "Application Status": "アプリケーションの状態",
        "Best Block": "最良ブロック",
        "Zcash comes with a way of signing arbitrary messages.": "Zcashには任意のメッセージを署名する昨日が備わっています。",
        "Zcash node information": "Zcashノード情報",
        Block: "ブロック",
        "Block Reward": "ブロック報酬",
        Blocks: "ブロック",
        "Broadcast Raw Transaction": "生のトランザクションを配信",
        "Bytes Serialized": "シリアライズ後の容量 (バイト)",
        "Can't connect to zcashd to get live updates from the p2p network. (Tried connecting to zcashd at {{host}}:{{port}} and failed.)": "P2Pネットワークからライブ情報を取得するためにzcashdへ接続することができませんでした。({{host}}:{{port}} への接続を試みましたが、失敗しました。)",
        "Can't connect to insight server. Attempting to reconnect...": "insight サーバに接続できません。再接続しています...",
        "Can't connect to internet. Please, check your connection.": "インターネットに接続できません。コネクションを確認してください。",
        Complete: "完了",
        Confirmations: "検証数",
        Conn: "接続数",
        "Connections to other nodes": "他ノードへの接続",
        "Current Blockchain Tip (insight)": "現在のブロックチェインのTip (insight)",
        "Current Sync Status": "現在の同期状況",
        Details: "詳細",
        Difficulty: "難易度",
        "Double spent attempt detected. From tx:": "二重支払い攻撃をこのトランザクションから検知しました：",
        "Error message:": "エラーメッセージ:",
        "Error!": "エラー！",
        Fee: "手数料",
        "Final Balance": "最終残高",
        "Finish Date": "終了日時",
        "Go to home": "ホームへ",
        "Hash Serialized": "シリアライズデータのハッシュ値",
        Height: "ブロック高",
        "Included in Block": "取り込まれたブロック",
        "Incoherence in levelDB detected:": "levelDBの破損を検知しました:",
        "Info Errors": "エラー情報",
        "Initial Block Chain Height": "起動時のブロック高",
        Input: "入力",
        "Last Block": "直前のブロック",
        "Last Block Hash (Zcashd)": "直前のブロックのハッシュ値 (Zcashd)",
        "Latest Blocks": "最新のブロック",
        "Latest Transactions": "最新のトランザクション",
        "Loading Address Information": "アドレス情報を読み込んでいます",
        "Loading Block Information": "ブロック情報を読み込んでいます",
        "Loading Selected Date...": "選択されたデータを読み込んでいます...",
        "Loading Transaction Details": "トランザクションの詳細を読み込んでいます",
        "Loading Transactions...": "トランザクションを読み込んでいます...",
        "Loading...": "ロード中...",
        Message: "メッセージ",
        "Mined Time": "採掘時刻",
        "Mined by": "採掘者",
        "Mining Difficulty": "採掘難易度",
        "Next Block": "次のブロック",
        "No Inputs (Newly Generated Coins)": "入力なし (新しく生成されたコイン)",
        "No blocks yet.": "ブロックはありません。",
        "No matching records found!": "一致するレコードはありません！",
        "No. Transactions": "トランザクション数",
        "Number Of Transactions": "トランザクション数",
        Output: "出力",
        "Powered by": "Powered by",
        "Previous Block": "前のブロック",
        "Protocol version": "プロトコルバージョン",
        "Proxy setting": "プロキシ設定",
        "Raw transaction data": "トランザクションの生データ",
        "Raw transaction data must be a valid hexadecimal string.": "生のトランザクションデータは有効な16進数でなければいけません。",
        "Received Time": "受信時刻",
        "Redirecting...": "リダイレクトしています...",
        "Search for block, transaction or address": "ブロック、トランザクション、アドレスを検索",
        "See all blocks": "すべてのブロックをみる",
        "Send transaction": "トランザクションを送信",
        "Show Transaction Output data": "トランザクションの出力データをみる",
        "Show all": "すべて表示",
        "Show input": "入力を表示",
        "Show less": "隠す",
        "Show more": "表示する",
        Signature: "署名",
        Size: "サイズ",
        "Size (bytes)": "サイズ (バイト)",
        "Skipped Blocks (previously synced)": "スキップされたブロック (同期済み)",
        "Start Date": "開始日時",
        Status: "ステータス",
        Summary: "概要",
        "Summary <small>confirmed</small>": "サマリ <small>検証済み</small>",
        "Sync Progress": "同期の進捗状況",
        "Sync Status": "同期ステータス",
        "Sync Type": "同期タイプ",
        "Synced Blocks": "同期されたブロック数",
        Testnet: "テストネット",
        "The message failed to verify.": "メッセージの検証に失敗しました。",
        "The message is verifiably from {{verification.address}}.": "メッセージは{{verification.address}}により検証されました。",
        "There are no transactions involving this address.": "このアドレスに対するトランザクションはありません。",
        "This form can be used to broadcast a raw transaction in hex format over\n        the Zcash network.": "このフォームでは、16進数フォーマットの生のトランザクションをZcashネットワーク上に配信することができます。",
        "This form can be used to verify that a message comes from\n        a specific Zcash address.": "このフォームでは、メッセージが特定のZcashアドレスから来たかどうかを検証することができます。",
        "Time Offset": "時間オフセット",
        Timestamp: "タイムスタンプ",
        Today: "今日",
        "Total Amount": "Zcash総量",
        "Total Received": "総入金額",
        "Total Sent": "総送金額",
        Transaction: "トランザクション",
        "Transaction Output Set Information": "トランザクションの出力セット情報",
        "Transaction Outputs": "トランザクションの出力",
        "Transaction succesfully broadcast.<br>Transaction id: {{txid}}": "トランザクションの配信に成功しました。<br>トランザクションID: {{txid}}",
        Transactions: "トランザクション",
        Type: "タイプ",
        Unconfirmed: "未検証",
        "Unconfirmed Transaction!": "未検証のトランザクションです！",
        "Unconfirmed Txs Balance": "未検証トランザクションの残高",
        "Value Out": "出力値",
        Verify: "検証",
        "Verify signed message": "署名済みメッセージを検証",
        Version: "バージョン",
        "Waiting for blocks...": "ブロックを待っています...",
        "Waiting for transactions...": "トランザクションを待っています...",
        "by date.": "日毎。",
        "first seen at": "最初に発見された日時",
        mined: "採掘された",
        "mined on:": "採掘日時:",
        "(Mainchain)": "(メインチェーン)",
        "(Orphaned)": "(孤立したブロック)",
        Bits: "Bits",
        "Block #{{block.height}}": "ブロック #{{block.height}}",
        BlockHash: "ブロックのハッシュ値",
        "Blocks <br> mined on:": "ブロック <br> 採掘日",
        Coinbase: "コインベース",
        Hash: "ハッシュ値",
        LockTime: "ロック時間",
        "Merkle Root": "Merkleルート",
        Nonce: "Nonce",
        "Ooops!": "おぉっと！",
        "Output is spent": "出力は使用済みです",
        "Output is unspent": "出力は未使用です",
        Scan: "スキャン",
        "Show/Hide items details": "アイテムの詳細を表示または隠す",
        "Waiting for blocks": "ブロックを待っています",
        "by date. {{detail}} {{before}}": "日時順 {{detail}} {{before}}",
        scriptSig: "scriptSig",
        "{{tx.confirmations}} Confirmations": "{{tx.confirmations}} 検証",
        '<span class="glyphicon glyphicon-warning-sign"></span> (Orphaned)': '<span class="glyphicon glyphicon-warning-sign"></span> (孤立したブロック)',
        '<span class="glyphicon glyphicon-warning-sign"></span> Incoherence in levelDB detected: {{vin.dbError}}': '<span class="glyphicon glyphicon-warning-sign"></span> Incoherence in levelDB detected: {{vin.dbError}}',
        'Waiting for blocks <span class="loader-gif"></span>': 'ブロックを待っています <span class="loader-gif"></span>'
    })
}]);