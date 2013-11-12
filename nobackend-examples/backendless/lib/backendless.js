(function () {
    NodeDevice = {
        name: 'NODEJS',
        platform: 'NODEJS',
        uuid: 'someId',
        version: '1'
    };

    function isBrowser() {
        return typeof window !== "undefined";// && !module && !module.exports;
    }

    if (!isBrowser()) {
        encodeURIComponent = function (url) {
            //url = querystring.escape(url);
            //console.log("encodeURIComponet : ", url);
            //console.log("encodeURIComponet : ", escape(url));
            return escape(url);
        }
    }

    var root = this,
        Backendless = root.Backendless || {},
        emptyFn = (function () {
        });

    root.Backendless = Backendless;

    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    var slice = ArrayProto.slice, unshift = ArrayProto.unshift, toString = ObjProto.toString, hasOwnProperty = ObjProto.hasOwnProperty;

    var nativeForEach = ArrayProto.forEach, nativeMap = ArrayProto.map, nativeReduce = ArrayProto.reduce, nativeReduceRight = ArrayProto.reduceRight, nativeFilter = ArrayProto.filter, nativeEvery = ArrayProto.every, nativeSome = ArrayProto.some, nativeIndexOf = ArrayProto.indexOf, nativeLastIndexOf = ArrayProto.lastIndexOf, nativeIsArray = Array.isArray, nativeKeys = Object.keys, nativeBind = FuncProto.bind;

    var rGUID = /([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})/i;
    if (isBrowser())
        var WebSocket = window.WebSocket || window.MozWebSocket;
    else
        var WebSocket = {};
    Backendless.VERSION = '0.1';
    Backendless.serverURL = 'https://api.backendless.com';

    initXHR();

    var browser = (function () {
        var ua = isBrowser() ? navigator.userAgent.toLowerCase() : "NodeJS",
            match = (/(chrome)[ \/]([\w.]+)/.exec(ua) ||
                /(webkit)[ \/]([\w.]+)/.exec(ua) ||
                /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
                /(msie) ([\w.]+)/.exec(ua) ||
                ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || []),
            matched = {
                browser: match[ 1 ] || '',
                version: match[ 2 ] || '0'
            },
            browser = {};
        if (matched.browser) {
            browser[ matched.browser ] = true;
            browser.version = matched.version;
        }
        return browser;
    })();
    var UIState = null;
    var getNow = function () {
        return new Date().getTime();
    };
    Backendless.browser = browser;

    var Utils = Backendless.Utils = {
        isObject: function (obj) {
            return obj === Object(obj);
        },
        isString: function (obj) {
            return toString.call(obj) === '[object String]';
        },
        isNumber: function (obj) {
            return toString.call(obj) === '[object Number]';
        }
    };
    Utils.isArray = (nativeIsArray || function (obj) {
        return toString.call(obj) === '[object Array]';
    });
    Utils.addEvent = function (evnt, elem, func) {
        if (elem.addEventListener)
            elem.addEventListener(evnt, func, false);
        else if (elem.attachEvent)
            elem.attachEvent("on" + evnt, func);
        else
            elem[evnt] = func;
    };
    Utils.isEmpty = function (obj) {
        if (obj == null) return true;
        if (Utils.isArray(obj) || Utils.isString(obj)) return obj.length === 0;
        for (var key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== undefined && obj[key] !== null) {
                return false
            }
        }
        return true;
    };

    Utils.removeEvent = function (evnt, elem) {
        if (elem.removeEventListener)
            elem.removeEventListener(evnt, null, false);
        else if (elem.detachEvent)
            elem.detachEvent("on" + evnt, null);
        else
            elem[evnt] = null;
    };
    var forEach = Utils.forEach = function (obj, iterator, context) {
        if (!obj) {
            return;
        }
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, l = obj.length; i < l; i++) {
                if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
                    return;
                }
            }
        } else {
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    if (iterator.call(context, obj[key], key, obj) === breaker) {
                        return;
                    }
                }
            }
        }
    };

    function initXHR() {
        try {
            if (typeof XMLHttpRequest.prototype.sendAsBinary == 'undefined') {
                XMLHttpRequest.prototype.sendAsBinary = function (text) {
                    var data = new ArrayBuffer(text.length);
                    var ui8a = new Uint8Array(data, 0);
                    for (var i = 0; i < text.length; i++) ui8a[i] = (text.charCodeAt(i) & 0xff);
                    this.send(ui8a);
                }
            }
        }
        catch (e) {
        }
    }

    Backendless.setUIState = function (stateName) {
        if (stateName === undefined) {
            throw new Error('UI state name must be defined or explicitly set to null');
        } else {
            UIState = stateName === null ? null : stateName;
        }
    };

    Backendless._ajax_for_browser = function (config) {
        var cashingAllowedArr = ['cacheOnly', 'remoteDataOnly', 'fromCacheOrRemote', 'fromRemoteOrCache', 'fromCacheAndRemote'],
            cacheMethods = {
                ignoreCache: function (config) {
                    return sendRequest(config);
                },
                cacheOnly: function (config) {
                    var cachedResult = Backendless.Cache.get(config.url.replace(/([^A-Za-z0-9])/g, '')),
                        cacheError = {
                            message: 'error: cannot find data in Backendless.Cache',
                            statusCode: 404
                        };
                    if (cachedResult) {
                        config.isAsync && config.asyncHandler.success(cachedResult);
                        return cachedResult;
                    } else {
                        if (config.isAsync) {
                            config.asyncHandler.fault(cacheError);
                        } else {
                            throw cacheError;
                        }
                    }
                },
                remoteDataOnly: function (config) {
                    return sendRequest(config);
                },
                fromCacheOrRemote: function (config) {
                    var cachedResult = Backendless.Cache.get(config.url.replace(/([^A-Za-z0-9])/g, ''));
                    if (cachedResult) {
                        config.isAsync && config.asyncHandler.success(cachedResult);
                        return cachedResult;
                    } else {
                        return sendRequest(config);
                    }
                },
                fromRemoteOrCache: function (config) {
                    return sendRequest(config);
                },
                fromCacheAndRemote: function (config) {
                    var result = {},
                        cachedResult = Backendless.Cache.get(config.url.replace(/([^A-Za-z0-9])/g, '')),
                        cacheError = {
                            message: 'error: cannot find data in Backendless.Cache',
                            statusCode: 404
                        };
                    result.remote = sendRequest(config);
                    if (cachedResult) {
                        config.isAsync && config.asyncHandler.success(cachedResult);
                        result.local = cachedResult;
                    } else {
                        if (config.isAsync) {
                            config.asyncHandler.fault(cacheError);
                        } else {
                            throw cacheError;
                        }
                    }
                    return result;
                }
            },
            sendRequest = function (config) {
                var xhr = new XMLHttpRequest(),
                    contentType = config.data ? 'application/json' : 'application/x-www-form-urlencoded',
                    response,
                    parseResponse = function (xhr) {
                        var result = true;
                        if (xhr.responseText) {
                            try {
                                result = JSON.parse(xhr.responseText);
                            } catch (e) {
                                result = xhr.responseText;
                            }
                        }
                        return result;
                    },
                    badResponse = function (xhr) {
                        var result = {};
                        try {
                            result = JSON.parse(xhr.responseText);
                        } catch (e) {
                            result.message = xhr.responseText;
                        }
                        result.statusCode = xhr.status;
                        result.message = result.message || 'unknown error occurred';
                        return result;
                    },
                    cacheHandler = function (response) {
                        response = cloneObject(response);
                        if (config.method == 'GET' && config.cacheActive) {
                            response.cachePolicy = config.cachePolicy;
                            Backendless.Cache.set(config.urlBlueprint, response);
                        } else if (Backendless.Cache.exists(config.urlBlueprint)) {
                            if (response === true || config.method == 'DELETE') {
                                response = undefined;
                            } else {
                                response.cachePolicy = Backendless.Cache.getCachePolicy(config.urlBlueprint);
                            }
                            '___class' in response && delete response['___class'];  // this issue must be fixed on server side
                            Backendless.Cache.set(config.urlBlueprint, response);
                        }
                    },
                    checkInCache = function () {
                        return config.cacheActive && config.cachePolicy.policy == 'fromRemoteOrCache' && Backendless.Cache.exists(config.urlBlueprint);
                    };

                xhr.open(config.method, config.url, config.isAsync);
                xhr.setRequestHeader('Content-Type', contentType);
                xhr.setRequestHeader('application-id', Backendless.applicationId);
                xhr.setRequestHeader('secret-key', Backendless.secretKey);
                xhr.setRequestHeader('application-type', 'JS');
                if (currentUser != null && currentUser["user-token"]) {
                    xhr.setRequestHeader("user-token", currentUser["user-token"]);
                }
                if (UIState !== null) {
                    xhr.setRequestHeader("uiState", UIState);
                }
                if (config.isAsync) {
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4) {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                response = parseResponse(xhr);
                                cacheHandler(response);
                                config.asyncHandler.success && config.asyncHandler.success(response);
                            } else if (checkInCache()) {
                                config.asyncHandler.success && config.asyncHandler.success(Backendless.Cache.get(config.urlBlueprint));
                            } else {
                                config.asyncHandler.fault && config.asyncHandler.fault(badResponse(xhr));
                            }
                        }
                    }
                }
                xhr.send(config.data);
                if (config.isAsync) {
                    return xhr;
                } else if (xhr.status >= 200 && xhr.status < 300) {
                    response = parseResponse(xhr);
                    cacheHandler(response);
                    return response;
                } else if (checkInCache()) {
                    return Backendless.Cache.get(config.urlBlueprint);
                } else {
                    throw badResponse(xhr);
                }
            };

        config.method = config.method || 'GET';
        config.cachePolicy = config.cachePolicy || {policy: 'ignoreCache'};
        config.isAsync = (typeof config.isAsync == 'boolean') ? config.isAsync : false;
        config.cacheActive = (config.method == 'GET') && (cashingAllowedArr.indexOf(config.cachePolicy.policy) != -1);
        config.urlBlueprint = config.url.replace(/([^A-Za-z0-9])/g, '');

        try {
            return cacheMethods[config.cachePolicy.policy].call(this, config);
        } catch (error) {
            console.log('error: ' + error.message);
            throw error;
        }
    };

    Backendless._ajax_for_nodejs = function (config) {
        config.data = config.data || "";
        if (typeof config.data !== "string") {
            config.data = JSON.stringify(config.data);
        }
        config.asyncHandler = config.asyncHandler || {};
        config.isAsync = (typeof config.isAsync == 'boolean') ? config.isAsync : false;
        var protocol = config.url.substr(0, config.url.indexOf('/', 8)).substr(0, config.url.indexOf(":"));
        //console.log("request url: ", config.url);
        //console.log("request protocol: ", protocol);
        var uri = config.url.substr(0, config.url.indexOf('/', 8)).substr(config.url.indexOf("/") + 2),
            host = uri.substr(0, (uri.indexOf(":") == -1 ? uri.length : uri.indexOf(":"))),
            port = uri.indexOf(":") != -1 ? parseInt(uri.substr(uri.indexOf(":") + 1)) : (protocol == "http" ? 80 : 443);
        var options = {
            host: host,
            //protocol: "http",
            port: port,
            method: config.method || "GET",
            path: config.url.substr(config.url.indexOf('/', 8)),
            //body: config.data,
            headers: {
                "Content-Length": config.data ? config.data.length : 0,
                "Content-Type": config.data ? 'application/json' : 'application/x-www-form-urlencoded',
                "application-id": Backendless.applicationId,
                "secret-key": Backendless.secretKey,
                "application-type": "JS"
            }
        };

        if (currentUser != null) {
            options.headers["user-token"] = currentUser["user-token"];
        }
        //console.log("request options: ", options);
        if (!config.isAsync) {
            var http = require("httpsync"),
                req = http.request(options);
        } else {
            var httpx = require(protocol);
            var req = httpx.request(options, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    console.log('BODY: ' + chunk);
                    config.asyncHandler.success(chunk);
                });
            });
        }

        req.on('error', function (e) {
            config.asyncHandler.fault || (config.asyncHandler.fault = function () {
            });
            config.asyncHandler.fault(e);
        });
        req.write(config.data, "utf8");
        return req.end();
    };

    Backendless._ajax = isBrowser() ? Backendless._ajax_for_browser : Backendless._ajax_for_nodejs;

    var getClassName = function () {
        var funcNameRegex = /function (.{1,})\(/, str = this.constructor === Function ? this.toString() : this.constructor.toString(), results = (funcNameRegex).exec(str);
        return (results && results.length > 1) ? results[1] : '';
    };

    var encodeArrayToUriComponent = function (arr) {
        var props = [], i, len;
        for (i = 0, len = arr.length; i < len; ++i) {
            props.push(encodeURIComponent(arr[i]));
        }
        return props.join(',');
    };

    var deepExtend = function (destination, source) {
        for (var property in source) {
            if (source[property] !== undefined) {
                destination[property] = destination[property] || {};
                destination[property] = source[property];
            }
        }
        return destination;
    };

    var cloneObject = function (obj) {
        return toString.call(obj) == '[object Array]' ? obj.slice() : deepExtend({}, obj);
    };

    var extractResponder = function (args) {
        var i, len;
        for (i = 0, len = args.length; i < len; ++i) {
            if (args[i] instanceof Async) {
                return args[i];
            }
        }
        return null;
    };

    function extendCollection(collection, dataMapper) {
        if (collection.nextPage && collection.nextPage.split("/")[1] == Backendless.appVersion) {
            collection.nextPage = Backendless.serverURL + collection.nextPage
        }
        collection._nextPage = collection.nextPage;
        collection.nextPage = function (async) {
            return dataMapper._load(this._nextPage, async);
        };
        collection.getPage = function (offset, pageSize, async) {
            var nextPage = this._nextPage.replace(/offset=\d+/ig, 'offset=' + offset);
            if (pageSize instanceof Async) {
                async = pageSize;
            }
            else {
                nextPage = nextPage.replace(/pagesize=\d+/ig, 'pageSize=' + pageSize);
            }
            async = extractResponder(arguments);
            return dataMapper._load(nextPage, async);
        };
        collection.dataMapper = dataMapper;
    }

    function Async(successCallback, faultCallback, context) {

        if (!(faultCallback instanceof Function)) {
            context = faultCallback;
            faultCallback = emptyFn;
        }

        this.success = function (data) {
            successCallback && successCallback.call(context, data);
        };
        this.fault = function (data) {
            faultCallback && faultCallback.call(context, data);
        }
    }

    function setCache() {
        var store = {},
            localStorageName = 'localStorage',
            storage;
        store.enabled = false;
        store.set = function (key, value) {
        };
        store.get = function (key) {
        };
        store.remove = function (key) {
        };
        store.clear = function () {
        };
        store.getAll = function () {
        };
        store.serialize = function (value) {
            return JSON.stringify(value);
        };
        store.deserialize = function (value) {
            if (typeof value != 'string') {
                return undefined;
            }
            try {
                return JSON.parse(value);
            } catch (e) {
                return value || undefined;
            }
        };
        function isLocalStorageSupported() {
            try {
                return isBrowser() && (localStorageName in window && window[localStorageName]);
            } catch (e) {
                return false;
            }
        }

        if (isLocalStorageSupported()) {
            storage = window[localStorageName];
            var createBndlsStorage = function () {
                    if (!('Backendless' in storage)) {
                        storage.setItem('Backendless', store.serialize({}));
                    }
                },
                expired = function (obj) {
                    var result = false;
                    if (Object.prototype.toString.call(obj).slice(8, -1) == "Object") {
                        if ('cachePolicy' in obj && 'timeToLive' in obj['cachePolicy'] && obj['cachePolicy']['timeToLive'] != -1 && 'created' in obj['cachePolicy']) {
                            result = (new Date().getTime() - obj['cachePolicy']['created']) > obj['cachePolicy']['timeToLive'];
                        }
                    }
                    return result;
                },
                addTimestamp = function (obj) {
                    if (Object.prototype.toString.call(obj).slice(8, -1) == "Object") {
                        if ('cachePolicy' in obj && 'timeToLive' in obj['cachePolicy']) {
                            obj['cachePolicy']['created'] = new Date().getTime();
                        }
                    }
                };
            createBndlsStorage();
            store.enabled = true;
            store.exists = function (key) {
                return store.get(key) !== undefined;
            };
            store.set = function (key, val) {
                if (val === undefined) {
                    return store.remove(key);
                }
                createBndlsStorage();
                var backendlessObj = store.deserialize(storage.getItem('Backendless'));
                addTimestamp(val);
                backendlessObj[key] = val;
                storage.setItem('Backendless', store.serialize(backendlessObj));
                return val;
            };
            store.get = function (key) {
                createBndlsStorage();
                var backendlessObj = store.deserialize(storage.getItem('Backendless')),
                    obj = backendlessObj[key],
                    result = obj;
                if (expired(obj)) {
                    delete backendlessObj[key];
                    storage.setItem('Backendless', store.serialize(backendlessObj));
                    result = undefined;
                }
                if (result && result['cachePolicy']) {
                    delete result['cachePolicy']
                }
                return result;
            };
            store.remove = function (key) {
                var result;
                createBndlsStorage();
                key = key.replace(/([^A-Za-z0-9])/g, '');
                var backendlessObj = store.deserialize(storage.getItem('Backendless'));
                if (backendlessObj.hasOwnProperty(key)) {
                    result = delete backendlessObj[key];
                }
                storage.setItem('Backendless', store.serialize(backendlessObj));
                return result;
            };
            store.clear = function () {
                storage.setItem('Backendless', store.serialize({}));
            };
            store.getAll = function () {
                createBndlsStorage();
                var backendlessObj = store.deserialize(storage.getItem('Backendless')),
                    ret = {};
                for (var prop in backendlessObj) {
                    if (backendlessObj.hasOwnProperty(prop)) {
                        ret[prop] = backendlessObj[prop];
                        if (ret[prop] !== null && ret[prop].hasOwnProperty('cachePolicy')) {
                            delete ret[prop]['cachePolicy'];
                        }
                    }
                }
                return ret;
            };
            store.getCachePolicy = function (key) {
                createBndlsStorage();
                var backendlessObj = store.deserialize(storage.getItem('Backendless')),
                    obj = backendlessObj[key];
                return obj ? obj['cachePolicy'] : undefined;
            };
        }
        return store;
    }

    Backendless.Cache = setCache();

    Backendless.Async = Async;

    function DataQuery() {
        this.properties = [];
        this.condition = null;
        this.options = null;
        this.url = null;
    }

    DataQuery.prototype = {
        addProperty: function (prop) {
            this.properties = this.properties || [];
            this.properties.push(prop);
        }
    };

    Backendless.DataQuery = DataQuery;

    function DataStore(model) {
        this.model = model;
        this.className = getClassName.call(model);
        if ((typeof model).toLowerCase() === "string")
            this.className = model;
        if (!this.className) {
            throw 'Class name should be specified';
        }
        this.restUrl = Backendless.appPath + '/data/' + this.className;
    }

    DataStore.prototype = {
        _extractQueryOptions: function (otpions) {
            var i, len, params = [];

            if (typeof otpions.pageSize != 'undefined') {
                if (otpions.pageSize < 1 || otpions.pageSize > 100) {
                    throw new Error('PageSize can not be less then 1 or greater than 100');
                }
                params.push('pageSize=' + encodeURIComponent(otpions.pageSize));
            }
            if (otpions.offset) {
                if (otpions.offset < 0) {
                    throw new Error('Offset can not be less then 0');
                }
                params.push('offset=' + encodeURIComponent(otpions.offset));
            }
            if (otpions.sortBy) {
                if (Utils.isString(otpions.sortBy)) {
                    params.push('sortBy=' + encodeURIComponent(otpions.sortBy));
                } else if (Utils.isArray(otpions.sortBy)) {
                    params.push('sortBy=' + encodeArrayToUriComponent(otpions.sortBy));
                }
            }
            if (otpions.related) {
                if (Utils.isArray(otpions.related)) {
                    params.push('loadRelations=' + encodeArrayToUriComponent(otpions.related));
                }
            }
            return params.join('&');
        },
        _wrapAsync: function (async) {
            var me = this, success = function (data) {
                data = me._parseResponse(data);
                async.success(data);
            }, error = function (data) {
                async.fault(data);
            };
            return new Async(success, error);
        },
        _parseResponse: function (response) {
            var i, len, _Model = this.model, item;
            if (response.data) {
                var collection = response, arr = collection.data;
                for (i = 0, len = arr.length; i < len; ++i) {
                    arr[i] = arr[i].fields || arr[i];
                    item = new _Model;
                    deepExtend(item, arr[i]);
                    arr[i] = item;
                }
                extendCollection(collection, this);
                return collection;
            }
            else {
                response = response.fields || response;
                item = new _Model;
                deepExtend(item, response);
                return this._formCircDeps(item);
            }

        },
        _load: function (url, async) {
            var responder = extractResponder(arguments), isAsync = false;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }

            var result = Backendless._ajax({
                method: 'GET',
                url: url,
                isAsync: isAsync,
                asyncHandler: responder
            });

            return isAsync ? result : this._parseResponse(result);
        },
        _replCircDeps: function (obj) {
            var objMap = [obj],
                pos,
                GenID = function () {
                    for (var b = '', a = b; a++ < 36; b += a * 51 && 52 ? (a ^ 15 ? 8 ^ Math.random() * (a ^ 20 ? 16 : 4) : 4).toString(16) : '-') {
                    }
                    return b;
                },
                _replCircDepsHelper = function (obj) {
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop) && typeof obj[prop] == "object" && obj[prop] != null) {
                            if ((pos = objMap.indexOf(obj[prop])) != -1) {
                                objMap[pos]["__subID"] = objMap[pos]["__subID"] || GenID();
                                obj[prop] = {"__originSubID": objMap[pos]["__subID"]};
                            } else {
                                objMap.push(obj[prop]);
                                _replCircDepsHelper(obj[prop]);
                            }
                        }
                    }
                };
            _replCircDepsHelper(obj);
        },
        _formCircDeps: function (obj) {
            var circDepsIDs = {},
                result = new obj.constructor(),
                _formCircDepsHelper = function (obj, result) {
                    if (obj.hasOwnProperty("__subID")) {
                        circDepsIDs[obj["__subID"]] = result;
                        delete obj["__subID"];
                    }
                    for (var prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            if (typeof obj[prop] == "object" && obj[prop] != null) {
                                if (obj[prop].hasOwnProperty("__originSubID")) {
                                    result[prop] = circDepsIDs[obj[prop]["__originSubID"]];
                                } else {
                                    result[prop] = {};
                                    _formCircDepsHelper(obj[prop], result[prop]);
                                }
                            } else {
                                result[prop] = obj[prop];
                            }
                        }
                    }
                };
            _formCircDepsHelper(obj, result);
            return result;
        },
        save: function (obj, async) {
            this._replCircDeps(obj);
            var responder = extractResponder(arguments), isAsync = false;
            var method = 'POST', url = this.restUrl;
            if (obj.objectId) {
                method = 'PUT';
                url += '/' + obj.objectId;
            }
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: method,
                url: url,
                data: JSON.stringify(obj),
                isAsync: isAsync,
                asyncHandler: responder
            });
            return isAsync ? result : this._parseResponse(result);
        },
        remove: function (objId, async) {
            var responder = extractResponder(arguments), isAsync = false;
            objId = objId.objectId || objId;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: 'DELETE',
                url: this.restUrl + '/' + objId,
                isAsync: isAsync,
                asyncHandler: responder
            });
            return isAsync ? result : this._parseResponse(result);
        },

        find: function (dataQuery) {
            dataQuery = dataQuery || {};
            var props,
                whereClause,
                options,
                query = [],
                url,
                responder = extractResponder(arguments),
                isAsync = responder != null,
                result;
            if (dataQuery.properties) {
                props = 'props=' + encodeArrayToUriComponent(dataQuery.properties);
            }
            if (dataQuery.condition) {
                whereClause = 'where=' + encodeURIComponent(dataQuery.condition);
            }
            if (dataQuery.options) {
                options = this._extractQueryOptions(dataQuery.options);
            }
            responder != null && (responder = this._wrapAsync(responder));
            options && query.push(options);
            whereClause && query.push(whereClause);
            props && query.push(props);
            query = query.join('&');
            if (dataQuery.url) {
                url = this.restUrl + '/' + dataQuery.url;
            } else {
                url = this.restUrl + (query ? '?' + query : '');
            }
            result = Backendless._ajax({
                method: 'GET',
                url: url,
                isAsync: isAsync,
                asyncHandler: responder,
                cachePolicy: dataQuery.cachePolicy
            });
            return isAsync ? result : this._parseResponse(result);
        },

        _extractCachePolicy: function () {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i].hasOwnProperty('cachePolicy')) {
                    return arguments[i]['cachePolicy'];
                }
            }
            return undefined
        },

        findById: function (objId, relations) {
            var args = [
                {
                    url: objId + (Object.prototype.toString.call(relations) === "[object Array]" ? '?loadRelations=' + relations.join(',') : ''),
                    cachePolicy: this._extractCachePolicy.apply(this, arguments)
                }
            ];
            return this.find.apply(this, args.concat(Array.prototype.slice.call(arguments)));
        },
        loadRelations: function (obj, relations) {
            var args = [
                {
                    url: obj.objectId + '/relations?loadRelations=' + (Object.prototype.toString.call(relations) === "[object Array]" ? relations.join(',') : '*'),
                    cachePolicy: this._extractCachePolicy.apply(this, arguments)
                }
            ];
            deepExtend(obj, this.find.apply(this, args.concat(Array.prototype.slice.call(arguments))));
        },
        findFirst: function () {
            var args = [
                {
                    url: 'first',
                    cachePolicy: this._extractCachePolicy.apply(this, arguments)
                }
            ];
            return this.find.apply(this, args.concat(Array.prototype.slice.call(arguments)));
        },
        findLast: function () {
            var args = [
                {
                    url: 'last',
                    cachePolicy: this._extractCachePolicy.apply(this, arguments)
                }
            ];
            return this.find.apply(this, args.concat(Array.prototype.slice.call(arguments)));
        }
    };
    var dataStoreCache = {};
    var persistence = {
        save: function (className, obj, async) {
            var responder = extractResponder(arguments), isAsync = false;

            if (Utils.isString(className)) {
                var url = Backendless.appPath + '/data/' + className;
                var result = Backendless._ajax({
                    method: 'POST',
                    url: url,
                    data: JSON.stringify(obj),
                    isAsync: isAsync,
                    asyncHandler: responder
                });
                return result;
            }
            if (Utils.isObject(className)) {
                return new DataStore(className).save(className, obj, async);
            }
        },
        of: function (model) {
            var className = getClassName.call(model);
            var store = dataStoreCache[className];
            if (!store) {
                store = new DataStore(model);
                dataStoreCache[className] = store;
            }
            return store;
        },
        describe: function (className, async) {
            className = Utils.isString(className) ? className : getClassName.call(className);
            var responder = extractResponder(arguments), isAsync = (responder != null);

            var result = Backendless._ajax({
                method: 'GET',
                url: Backendless.appPath + '/data/' + className + '/properties',
                isAsync: isAsync,
                asyncHandler: responder
            });
            return result;
        }
    };

    function User() {
    }

//    User.prototype = {
//        password: ""
//    };
    Backendless.User = User;

    var currentUser = null;
    var UserService = function () {
        this.restUrl = Backendless.appPath + '/users';
    };
    UserService.prototype = {
        _wrapAsync: function (async) {
            var me = this, success = function (data) {
                try {
                    data = JSON.parse(data)
                }
                catch (e) {
                }
                currentUser = me._parseResponse(data);
                async.success(me._getUserFromResponse(currentUser));
            }, error = function (data) {
                async.fault(data);
            };
            return new Async(success, error);
        },
        _parseResponse: function (data) {
            var user = new Backendless.User;
            deepExtend(user, data);
            return user;
        },

        register: function (user, async) {
            if (!(user instanceof Backendless.User)) {
                throw new Error('Only Backendless.User accepted');
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            if (responder) {
                responder = this._wrapAsync(responder);
            }

            var result = Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/register',
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(user)
            });
            return isAsync ? result : this._parseResponse(result);
        },

        getUserRoles: function (async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            if (responder) {
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/userroles',
                isAsync: isAsync,
                asyncHandler: responder
            });
            return isAsync ? result : this._parseResponse(result);
        },

        roleHelper: function (username, rolename, async, operation) {
            if (!username) {
                throw new Error('Username can not be empty');
            }
            if (!rolename) {
                throw new Error('Rolename can not be empty');
            }

            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            if (responder) {
                responder = this._wrapAsync(responder);
            }

            var data = {
                user: username,
                roleName: rolename
            };

            var result = Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/' + operation,
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(data)
            });
            if (isAsync) {
                return result;
            }
            else {
                currentUser = null;
                return result;
            }
        },

        assignRole: function (username, rolename, async) {
            return this.roleHelper(username, rolename, async, 'assignRole');
        },

        unassignRole: function (username, rolename, async) {
            return this.roleHelper(username, rolename, async, 'unassignRole');
        },

        login: function (username, password, async) {
            if (!username) {
                throw new Error('Username can not be empty');
            }
            if (!password) {
                throw new Error('Password can not be empty');
            }

            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            if (responder) {
                responder = this._wrapAsync(responder);
            }

            var data = {
                login: username,
                password: password
            };
            var result = Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/login',
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(data)
            });
            if (isAsync) {
                return result;
            }
            else {
                currentUser = this._parseResponse(result);
                return this._getUserFromResponse(currentUser);
            }
        },
        _getUserFromResponse: function (user) {
            var newUser = new Backendless.User();
            for (var i in user) {
                if (i == 'user-token') {
                    continue;
                }
                newUser[i] = user[i];
            }
            return newUser
        },
        describeUserClass: function (async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/userclassprops',
                isAsync: isAsync,
                asyncHandler: responder
            });
            if (isAsync) {
                return result;
            }
            else {
                currentUser = null;
                return result;
            }
        },
        restorePassword: function (emailAddress, async) {
            if (!emailAddress) {
                throw 'Username can not be empty';
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/restorepassword/' + encodeURIComponent(emailAddress),
                isAsync: isAsync,
                asyncHandler: responder
            });
            if (isAsync) {
                return result;
            }
            else {
                currentUser = null;
                return result;
            }
        },
        logout: function (async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/logout',
                isAsync: isAsync,
                asyncHandler: responder
            });
            if (isAsync) {
                return result;
            }
            else {
                currentUser = null;
                return result;
            }
        },
        getCurrentUser: function () {
            return currentUser ? this._getUserFromResponse(currentUser) : null;
        },
        update: function (user, async) {
            if (!(user instanceof Backendless.User)) {
                throw new Error('Only Backendless.User accepted');
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            if (responder) {
                responder = this._wrapAsync(responder);
            }
            var result = Backendless._ajax({
                method: 'PUT',
                url: this.restUrl + '/' + user.objectId,
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(user)
            });
            return isAsync ? result : this._parseResponse(result);
        },
        loginWithFacebook: function (facebookFieldsMapping, permissions, callback, container) {
            this._loginSocial('Facebook', facebookFieldsMapping, permissions, callback, container);
        },
        loginWithTwitter: function (twitterFieldsMapping, callback) {
            this._loginSocial('Twitter', twitterFieldsMapping, null, callback, null);
        },
        _socialContainer: function (socialType, container) {
            var loadingMsg;

            if (container) {
                var client;

                container = container[0];
                loadingMsg = document.createElement('div');
                loadingMsg.innerHTML = "Loading...";
                container.appendChild(loadingMsg);
                container.style.cursor = 'wait';

                this.closeContainer = function () {
                    container.style.cursor = 'default';
                    container.removeChild(client);
                }

                this.removeLoading = function () {
                    container.removeChild(loadingMsg);
                }

                this.doAuthorizationActivity = function (url) {
                    this.removeLoading();
                    client = document.createElement('iframe');
                    client.frameBorder = 0;
                    client.width = container.style.width;
                    client.height = container.style.height;
                    client.id = "SocialAuthFrame";
                    client.setAttribute("src", url + "&amp;output=embed");
                    container.appendChild(client);
                    client.onload = function () {
                        container.style.cursor = 'default';
                    }
                }
            }
            else {
                container = window.open('', socialType + ' authorization', 'height=250,width=450,scrollbars=0,toolbar=0,menubar=0,location=0,resizable=0,status=0,titlebar=0', false);
                loadingMsg = container.document.getElementsByTagName('body')[0].innerHTML;
                loadingMsg = "Loading...";
                container.document.getElementsByTagName('html')[0].style.cursor = 'wait';

                this.closeContainer = function () {
                    container.close();
                }

                this.removeLoading = function () {
                    loadingMsg = null;
                }

                this.doAuthorizationActivity = function (url) {
                    container.location.href = url;
                    container.onload = function () {
                        container.document.getElementsByTagName("html")[0].style.cursor = 'default';
                    }
                }
            }
        },
        _loginSocial: function (socialType, fieldsMapping, permissions, callback, container) {
            var socialContainer = new this._socialContainer(socialType, container);

            var responder = extractResponder(arguments);
            if (responder) {
                responder = this._wrapAsync(responder);
            }

            Utils.addEvent('message', window, function (e) {
                if (e.origin == Backendless.serverURL) {
                    var result = JSON.parse(e.data);

                    if (result.fault)
                        responder.fault(result.fault);
                    else {
                        currentUser = this._parseResponse(result);
                        responder.success(this._getUserFromResponse(currentUser));
                    }

                    Utils.removeEvent('message', window);
                    socialContainer.closeContainer();
                }
            });

            var interimCallback = new Backendless.Async(function (r) {
                socialContainer.doAuthorizationActivity(r);
            }, function (e) {
                socialContainer.closeContainer();
                responder.fault(e);
            });

            var request = fieldsMapping || permissions ? {} : null;
            if (fieldsMapping)
                request.fieldsMapping = fieldsMapping;
            if (permissions)
                request.permissions = permissions;

            Backendless._ajax({
                method: 'POST',
                url: this.restUrl + "/social/oauth/" + socialType.toLowerCase() + "/request_url",
                isAsync: true,
                asyncHandler: interimCallback,
                data: JSON.stringify(request)
            });
        },
        loginWithFacebookSdk: function (fieldsMapping, async) {
            if (!FB)
                throw new Error("Facebook SDK not found");

            var me = this;
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected')
                    me._sendFacebookLoginRequest(me, response, fieldsMapping, async);
                else
                    FB.login(function (response) {
                        me._sendFacebookLoginRequest(me, response, fieldsMapping, async);
                    });
            });
        },
        _sendFacebookLoginRequest: function (context, response, fieldsMapping, async) {
            if (response.status === 'connected') {
                var requestData = response.authResponse;

                if (fieldsMapping)
                    requestData["fieldsMapping"] = fieldsMapping;

                var interimCallback = new Backendless.Async(function (r) {
                    currentUser = context._parseResponse(r);
                    async.success(context._getUserFromResponse(currentUser));
                }, function (e) {
                    async.fault(e);
                });

                Backendless._ajax({
                    method: 'POST',
                    url: context.restUrl + "/social/facebook/login/" + Backendless.applicationId,
                    isAsync: true,
                    asyncHandler: interimCallback,
                    data: JSON.stringify(requestData)
                });
            }
        }
    };

    function Geo() {
        this.restUrl = Backendless.appPath + '/geo';
    }

    function GeoQuery() {
        this.searchRectangle = null;
        this.categories = [];
        this.includeMeta = false;

        this.pageSize = 10;
        this.latitude = 0;
        this.longitude = 0;
        this.radius = 0;
        this.units = null;
    }

    GeoQuery.prototype = {
        addCategory: function () {
            this.categories = this.categories || [];
            this.categories.push();
        }
    };
    Backendless.GeoQuery = GeoQuery;

    Geo.prototype = {
        UNITS: {
            METERS: 'METERS',
            KILOMETERS: 'KILOMETERS',
            MILES: 'MILES',
            YARDS: 'YARDS',
            FEET: 'FEET'
        },
        _wrapAsync: function (async) {
            var me = this, success = function (data) {
                data = me._parseResponse(data);
                async.success(data);
            }, error = function (data) {
                async.fault(data);
            };
            return new Async(success, error);
        },
        _parseResponse: function (data) {
            var collection = data.collection;
            extendCollection(collection, this);
            return collection;
        },
        _load: function (url, async) {
            var responder = extractResponder(arguments),
                isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'GET',
                url: url,
                isAsync: isAsync,
                asyncHandler: responder
            });

            return isAsync ? result : this._parseResponse(result);
        },
        _findHelpers: {
            'searchRectangle': function (arg) {
                var rect = [
                    'nwlat=' + arg[0], 'nwlon=' + arg[1], 'selat=' + arg[2], 'selon=' + arg[3]
                ];
                return rect.join('&');
            },
            'latitude': function (arg) {
                return 'lat=' + arg;
            },
            'longitude': function (arg) {
                return 'lon=' + arg;
            },
            'metadata': function (arg) {
                return 'metadata=' + JSON.stringify(arg);
            },
            'radius': function (arg) {
                return 'r=' + arg;
            },
            'categories': function (arg) {
                arg = Utils.isString(arg) ? [arg] : arg;
                return 'categories=' + encodeArrayToUriComponent(arg);
            },
            'includeMetadata': function (arg) {
                return 'includemetadata=' + arg;
            },
            'pageSize': function (arg) {
                if (arg < 1 || arg > 100) {
                    throw new Error('PageSize can not be less then 1 or greater than 100');
                } else {
                    return 'pageSize=' + arg;
                }
            },
            'offset': function (arg) {
                if (arg < 0) {
                    throw new Error('Offset can not be less then 0');
                } else {
                    return 'offset=' + arg;
                }
            },
            'relativeFindPercentThreshold': function (arg) {
                if (arg <= 0) {
                    throw new Error('Threshold can not be less then or equal 0');
                } else {
                    return 'relativeFindPercentThreshold=' + arg;
                }
            },
            'relativeFindMetadata': function (arg) {
                return 'relativeFindMetadata=' + JSON.stringify(arg);
            },
            'condition': function (arg) {
                return 'whereClause=' + encodeURIComponent(arg);
            }
        },

        addPoint: function (geopoint, async) {
            if (geopoint.latitude === undefined || geopoint.longitude === undefined) {
                throw 'Latitude or longitude not a number';
            }
            geopoint.categories = geopoint.categories || ['Default'];
            geopoint.categories = Utils.isArray(geopoint.categories) ? geopoint.categories : [geopoint.categories];

            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var data = 'lat=' + geopoint.latitude;
            data += '&lon=' + geopoint.longitude;
            if (geopoint.categories) {
                data += '&categories=' + encodeArrayToUriComponent(geopoint.categories);
            }

            if (geopoint.metadata) {
                data += '&metadata=' + JSON.stringify(geopoint.metadata);
            }
            var result = Backendless._ajax({
                method: 'PUT',
                url: this.restUrl + '/points?' + data,
                isAsync: isAsync,
                asyncHandler: responder
            });
            return result;
        },

        findUtil: function (query, async) {
            var url = query["url"],
                responder = extractResponder(arguments),
                isAsync = false,
                searchByCat = true;
            if (responder != null) {
                isAsync = true;
                responder = this._wrapAsync(responder);
            }
            if (query.searchRectangle && query.radius) {
                throw new Error("Inconsistent geo query. Query should not contain both rectangle and radius search parameters.");
            }
            else if (query.radius && (query.latitude === undefined || query.longitude === undefined)) {
                throw new Error("Latitude and longitude should be provided to search in radius");
            }
            else if ((query.relativeFindMetadata || query.relativeFindPercentThreshold) && !(query.relativeFindMetadata && query.relativeFindPercentThreshold)) {
                throw new Error("Inconsistent geo query. Query should contain both relativeFindPercentThreshold and relativeFindMetadata or none of them");
            }
            else {
                url += query.searchRectangle ? '/rect?' : '/points?';
                url += 'units=' + (query.units ? query.units : Backendless.Geo.UNITS.KILOMETERS);
                for (var prop in query) {
                    if (query.hasOwnProperty(prop) && this._findHelpers.hasOwnProperty(prop) && query[prop] != undefined) {
                        url += '&' + this._findHelpers[prop](query[prop]);
                    }
                }
            }
            url = url.replace(/\?&/g, '?');
            var result = Backendless._ajax({
                method: 'GET',
                url: url,
                isAsync: isAsync,
                asyncHandler: responder
            });
            return isAsync ? result : this._parseResponse(result);
        },

        find: function (query, async) {
            query["url"] = this.restUrl;
            return this.findUtil(query, async);
        },

        relativeFind: function (query, async) {
            if (!(query.relativeFindMetadata && query.relativeFindPercentThreshold)) {
                throw new Error("Inconsistent geo query. Query should contain both relativeFindPercentThreshold and relativeFindMetadata");
            } else {
                query["url"] = this.restUrl + "/relative";
                return this.findUtil(query, async);
            }
        },

        addCategory: function (name, async) {
            if (!name) {
                throw new Error('Category name is requred.');
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'PUT',
                url: this.restUrl + '/categories/' + name,
                isAsync: isAsync,
                asyncHandler: responder
            });
            return (typeof result.result === 'undefined') ? result : result.result;
        },
        getCategories: function (async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/categories',
                isAsync: isAsync,
                asyncHandler: responder
            });
            return result;
        },
        deleteCategory: function (name, async) {
            if (!name) {
                throw new Error('Category name is requred.');
            }
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'DELETE',
                url: this.restUrl + '/categories/' + name,
                isAsync: isAsync,
                asyncHandler: responder
            });
            return (typeof result.result === 'undefined') ? result : result.result;
        }
    };

    function Proxy() {
        this.eventHandlers = {};
    }

    Proxy.prototype = {
        on: function (eventName, handler) {
            if (!eventName) {
                throw new Error('Event name not specified');
            }
            if (!handler) {
                throw new Error('Handler not specified');
            }
            this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
            this.eventHandlers[eventName].push(handler);
        },
        fireEvent: function (eventName, data) {
            var handlers = this.eventHandlers[eventName] || [], len, i;
            for (i = 0, len = handlers.length; i < len; ++i) {
                handlers[i](data);
            }
        }
    };

    function PollingProxy(url) {
        this.restUrl = url;
        this.timer = 0;
        this.timeout = 0;
        this.interval = 1000;
        this.xhr = null;
        this.needReconnect = true;
        this.responder = new Async(this.onMessage, this.onError, this);
        this.poll();
    }

    PollingProxy.prototype = new Proxy();

    deepExtend(PollingProxy.prototype, {
        onMessage: function (data) {
            clearTimeout(this.timeout);
            var self = this;
            this.timer = setTimeout(function () {
                self.poll();
            }, this.interval);
            this.fireEvent('messageReceived', data);
        },
        poll: function () {
            var self = this;
            this.timeout = setTimeout(function () {
                self.onTimeout();
            }, 30 * 1000);
            this.xhr = Backendless._ajax({
                method: 'GET',
                url: this.restUrl,
                isAsync: true,
                asyncHandler: this.responder
            });
        },
        close: function () {
            clearTimeout(this.timer);
            clearTimeout(this.timeout);
            this.needReconnect = false;
            this.xhr && this.xhr.abort();
        },
        onTimeout: function () {
            this.xhr && this.xhr.abort();
        },
        onError: function () {
            clearTimeout(this.timer);
            clearTimeout(this.timeout);
            if (this.needReconnect) {
                var self = this;
                this.xhr = null;
                this.timer = setTimeout(function () {
                    self.poll();
                }, this.interval);
            }
        }
    });

    function SocketProxy(url) {
        var self = this;
        this.reconnectWithPolling = true;
        try {
            var socket = this.socket = new WebSocket(url);
            socket.onopen = function () {
                return self.sockOpen();
            };
            socket.onerror = function (error) {
                return self.sockError(error);
            };
            socket.onclose = function (evt) {
                self.onSocketClose();
            };

            socket.onmessage = function (event) {
                return self.onMessage(event);
            };
        }
        catch (e) {
            setTimeout(function () {
                self.onSocketClose();
            }, 100);
        }
    }

    SocketProxy.prototype = new Proxy();
    deepExtend(SocketProxy.prototype, {
        onMessage: function () {
            this.fireEvent('messageReceived', data);
        },
        onSocketClose: function (data) {
            if (this.reconnectWithPolling) {
                this.fireEvent('socketClose', data);
            }
        },
        close: function () {
            this.reconnectWithPolling = false;
            this.socket.close();
        }
    });
    function Subscription(config) {
        this.channelName = config.channelName;
        this.options = config.options;
        this.channelProperties = config.channelProperties;
        this.subscriptionId = null;
        this.restUrl = config.restUrl + '/' + config.channelName;
        this.responder = config.responder || emptyFn;
        this._subscribe(config.onSubscribe);
    }

    Subscription.prototype = {
        _subscribe: function (async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var self = this;
            var _async = new Async(function (data) {
                self.subscriptionId = data.subscriptionId;
                self._startSubscription();
                //responder.success(self);
            }, function (e) {
                responder.fault(e);
            });
            var subscription = Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/subscribe',
                isAsync: isAsync,
                data: JSON.stringify(this.options),
                asyncHandler: _async
            });

            if (!isAsync) {
                this.subscriptionId = subscription.subscriptionId;
                this._startSubscription();
            }
        },
        _startSubscription: function () {
            var self = this;
            if (WebSocket) {
                var url = this.channelProperties['websocket'] + '/' + this.subscriptionId;
                this.proxy = new SocketProxy(url);
                this.proxy.on('socketClose', function () {
                    self._switchToPolling();
                });
                this.proxy.on('messageReceived', function () {
                    self.responder();
                });
            }
            else {
                this._switchToPolling();
            }

            this._startSubscription = emptyFn;
        },
        cancelSubscription: function () {
            this.proxy && this.proxy.close();
            this._startSubscription = emptyFn;
        },
        _switchToPolling: function () {
            var url = /*(this.channelProperties['polling'] || */this.restUrl + '/' + this.subscriptionId;
            this.proxy = new PollingProxy(url);
            var self = this;
            this.proxy.on('messageReceived', function (data) {
                if (data.messages.length)
                    self.responder(data);
            });
        }
    };

    function Messaging() {
        this.restUrl = Backendless.appPath + '/messaging';
        this.channelProperties = {};
    }

    Messaging.prototype = {
        _getProperties: function (channelName, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var props = this.channelProperties[channelName];
            if (props) {
                if (isAsync) {
                    async.success(props);
                }
                return props;
            }
            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/' + channelName + '/properties',
                isAsync: isAsync,
                asyncHandler: responder
            });
            this.channelProperties[channelName] = result;
            return result;
        },
        subscribe: function (channelName, subscriptionCallback, subscriptionOptions, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            if (isAsync) {
                var that = this;
                var callback = new Async(function (props) {
                    async.success(new Subscription({
                        channelName: channelName,
                        options: subscriptionOptions,
                        channelProperties: props,
                        responder: subscriptionCallback,
                        restUrl: that.restUrl,
                        onSubscribe: responder
                    }));
                }, function (data) {
                    responder.fault(data);
                });
                this._getProperties(channelName, callback);
            }
            else {
                var props = this._getProperties(channelName);
                return new Subscription({
                    channelName: channelName,
                    options: subscriptionOptions,
                    channelProperties: props,
                    responder: subscriptionCallback,
                    restUrl: this.restUrl
                });
            }
        },
        publish: function (channelName, message, publishOptions, deliveryTarget, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var data = {
                message: message
            };
            if (publishOptions) {
                if (!(publishOptions instanceof PublishOptions))
                    throw "Use PublishOption as publishOptions argument";
                deepExtend(data, publishOptions);
            }
            if (deliveryTarget) {
                if (!(deliveryTarget instanceof DeliveryOptions))
                    throw "Use DeliveryOptions as deliveryTarget argument";
                deepExtend(data, deliveryTarget);
            }

            var result = Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/' + channelName,
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(data)
            });
            return result;
        },
        sendEmail: function (subject, bodyParts, recipients, attachments, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var data = {};
            if (subject && !Utils.isEmpty(subject) && Utils.isString(subject)) {
                data.subject = subject;
            } else {
                throw "Subject is required parameter and must be a nonempty string";
            }
            if ((bodyParts instanceof Bodyparts) && !Utils.isEmpty(bodyParts)) {
                data.bodyparts = bodyParts;
            } else {
                throw "Use Bodyparts as bodyParts argument, must contain at least one property";
            }
            if (recipients && Utils.isArray(recipients) && !Utils.isEmpty(recipients)) {
                data.to = recipients;
            } else {
                throw "Recipients is required parameter, must be a nonempty array";
            }
            if (attachments) {
                if (Utils.isArray(attachments)) {
                    if (!Utils.isEmpty(attachments)) {
                        data.attachment = attachments;
                    }
                } else {
                    throw "Attachments must be an array of file IDs from File Service";
                }
            }

            return Backendless._ajax({
                method: 'POST',
                url: this.restUrl + '/email',
                isAsync: isAsync,
                asyncHandler: responder,
                data: JSON.stringify(data)
            });
        },
        cancel: function (messageId, async) {
            var isAsync = async != null;
            var result = Backendless._ajax({
                method: 'DELETE',
                url: this.restUrl + '/' + messageId,
                isAsync: isAsync,
                asyncHandler: new Async(emptyFn)
            });
            return result;
        },
        registerDevice: function (channels, expiration, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var device = isBrowser() ? window.device : NodeDevice;
            var data = {
                deviceToken: null, //This value will set in callback
                deviceId: device.uuid,
                os: device.platform,
                osVersion: device.version
            };
            if (Utils.isArray(channels)) {
                data.channels = channels;
            }
            for (var i = 0, len = arguments.length; i < len; ++i) {
                var val = arguments[i];
                if (Utils.isNumber(val) || val instanceof Date) {
                    data.expiration = (val instanceof Date) ? val.getTime() / 1000 : val;
                }
            }
            var url = this.restUrl + '/registrations';
            var success = function (deviceToken) {
                data.deviceToken = deviceToken;
                Backendless._ajax({
                    method: 'POST',
                    url: url,
                    data: JSON.stringify(data),
                    isAsync: isAsync,
                    asyncHandler: responder
                });
            };
            var fail = function (status) {
                console.warn(JSON.stringify(['failed to register ', status]));
            };
            var config = { projectid: "http://backendless.com", appid: Backendless.applicationId };
            cordova.exec(success, fail, "PushNotification", "registerDevice", [config]);
        },
        getRegistrations: function (async) {
            var deviceId = isBrowser() ? window.device.uuid : NodeDevice.uuid;
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'GET',
                url: this.restUrl + '/registrations/' + deviceId,
                isAsync: isAsync,
                asyncHandler: responder
            });
            return result;
        },
        unregisterDevice: function (async) {
            var deviceId = isBrowser() ? window.device.uuid : NodeDevice.uuid;
            var responder = extractResponder(arguments);
            var isAsync = responder != null;

            var result = Backendless._ajax({
                method: 'DELETE',
                url: this.restUrl + '/registrations/' + deviceId,
                isAsync: isAsync,
                asyncHandler: responder
            });
            try {
                cordova.exec(emptyFn, emptyFn, "PushNotification", "unregisterDevice", []);
            }
            catch (e) {
                console.log(e.message);
            }
            return result;
        }
    };
    function getBuilder(filename, filedata, boundary) {
        var dashdash = '--',
            crlf = '\r\n',
            builder = '';

        builder += dashdash;
        builder += boundary;
        builder += crlf;
        builder += 'Content-Disposition: form-data; name="file"';
        builder += '; filename="' + filename + '"';
        builder += crlf;

        builder += 'Content-Type: application/octet-stream';
        builder += crlf;
        builder += crlf;

        builder += filedata;
        builder += crlf;

        builder += dashdash;
        builder += boundary;
        builder += dashdash;
        builder += crlf;
        return builder;
    }

    function send(e) {
        var xhr = new XMLHttpRequest(),
            boundary = '-backendless-multipart-form-boundary-' + getNow(),
            builder = getBuilder(this.fileName, e.target.result, boundary),
            badResponse = function (xhr) {
                var result = {};
                try {
                    result = JSON.parse(xhr.responseText);
                } catch (e) {
                    result.message = xhr.responseText;
                }
                result.statusCode = xhr.status;
                return result;
            };

        xhr.open("POST", this.uploadPath, true);
        xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);
        xhr.setRequestHeader('application-id', Backendless.applicationId);
        xhr.setRequestHeader("secret-key", Backendless.secretKey);
        xhr.setRequestHeader("application-type", "JS");
        if (UIState !== null) {
            xhr.setRequestHeader("uiState", UIState);
        }
        var asyncHandler = this.asyncHandler;
        if (asyncHandler)
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        asyncHandler.success(JSON.parse(xhr.responseText));
                    } else {
                        asyncHandler.fault(JSON.parse(xhr.responseText));
                    }
                }
            };
        xhr.sendAsBinary(builder);

        if (asyncHandler) {
            return xhr;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
            return xhr.responseText ? JSON.parse(xhr.responseText) : true;
        } else {
            throw badResponse(xhr);
        }
    }

    function Files() {
        this.restUrl = Backendless.appPath + '/files';
    }

    Files.prototype = {
        upload: function (files, path, async) {
            files = files.files || files;
            var baseUrl = this.restUrl + '/' + path + '/';
            if (isBrowser()) {
                if (window.File && window.FileList) {
                    if (files instanceof File) {
                        files = [files];
                    }
                    var filesError = 0, filesDone = 0;
                    for (var i = 0, len = files.length; i < len; i++) {
                        try {
                            var reader = new FileReader();
                            reader.fileName = files[i].name;
                            reader.uploadPath = baseUrl + reader.fileName;
                            reader.onloadend = send;
                            reader.asyncHandler = async;
                            reader.onerror = function (evn) {
                                async.fault(evn);
                            };
                            reader.readAsBinaryString(files[i]);

                        }
                        catch (err) {
                            filesError++;
                        }
                    }
                }
                else {
                    //IE iframe hack
                    var ifrm = document.createElement('iframe');
                    ifrm.id = ifrm.name = 'ifr' + getNow();
                    ifrm.width = ifrm.height = '0';

                    document.body.appendChild(ifrm);
                    var form = document.createElement('form');
                    form.target = ifrm.name;
                    form.enctype = 'multipart/form-data';
                    form.method = 'POST';
                    document.body.appendChild(form);
                    form.appendChild(files);
                    var fileName = files.value, index = fileName.lastIndexOf('\\');

                    if (index) {
                        fileName = fileName.substring(index + 1);
                    }
                    form.action = baseUrl + fileName;
                    form.submit();
                }
            }
            else {
                throw "Upload File not supported with NodeJS";
            }
        },
        remove: function (fileURL, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            var url = fileURL.indexOf("http://") == 0 || fileURL.indexOf("https://") == 0 ? fileURL : this.restUrl + '/' + fileURL;
            Backendless._ajax({
                method: 'DELETE',
                url: url,
                isAsync: isAsync,
                asyncHandler: responder
            });
        },

        removeDirectory: function (path, async) {
            var responder = extractResponder(arguments);
            var isAsync = responder != null;
            Backendless._ajax({
                method: 'DELETE',
                url: this.restUrl + '/' + path,
                isAsync: isAsync,
                asyncHandler: responder
            });
        }
    };
    Backendless.initApp = function (appId, secretKey, appVersion) {
        Backendless.applicationId = appId;
        Backendless.secretKey = secretKey;
        Backendless.appVersion = appVersion;
        Backendless.appPath = [Backendless.serverURL, Backendless.appVersion].join('/');
        Backendless.UserService = new UserService();
        Backendless.Geo = new Geo();
        Backendless.Persistence = persistence;
        Backendless.Messaging = new Messaging();
        dataStoreCache = {};
        Backendless.Files = new Files();
        currentUser = null;
    };

    if (!isBrowser()) {
        module.exports = Backendless;
    }

})();

var BackendlessGeoQuery = function () {
    this.searchRectangle = undefined;
    this.categories = [];
    this.includeMetadata = true;
    this.metadata = undefined;
    this.condition = undefined;
    this.relativeFindMetadata = undefined;
    this.relativeFindPercentThreshold = undefined;
    this.pageSize = undefined;
    this.latitude = undefined;
    this.longitude = undefined;
    this.radius = undefined;
    this.units = undefined;
};

BackendlessGeoQuery.prototype = {
    addCategory: function () {
        this.categories = this.categories || [];
        this.categories.push();
    }
};

var PublishOptionsHeaders = { //PublishOptions headers namespace helper
    'MESSAGE_TAG': 'message',
    'IOS_ALERT_TAG': 'ios-alert',
    'IOS_BADGE_TAG': 'ios-badge',
    'IOS_SOUND_TAG': 'ios-sound',
    'ANDROID_TICKER_TEXT_TAG': 'android-ticker-text',
    'ANDROID_CONTENT_TITLE_TAG': 'android-content-title',
    'ANDROID_CONTENT_TEXT_TAG': 'android-content-text',
    'ANDROID_ACTION_TAG': 'android-action',
    'WP_TYPE_TAG': 'wp-type',
    'WP_TITLE_TAG': 'wp-title',
    'WP_TOAST_SUBTITLE_TAG': 'wp-subtitle',
    'WP_TOAST_PARAMETER_TAG': 'wp-parameter',
    'WP_TILE_BACKGROUND_IMAGE': 'wp-backgroundImage',
    'WP_TILE_COUNT': 'wp-count',
    'WP_TILE_BACK_TITLE': 'wp-backTitle',
    'WP_TILE_BACK_BACKGROUND_IMAGE': 'wp-backImage',
    'WP_TILE_BACK_CONTENT': 'wp-backContent',
    'WP_RAW_DATA': 'wp-raw'
};

var PublishOptions = function (args) {
    args = args || {};
    this.publisherId = args.publisherId || undefined;
    this.headers = args.headers || undefined;
    this.subtopic = args.subtopic || undefined;
};

var DeliveryOptions = function (args) {
    args = args || {};
    this.pushPolicy = args.pushPolicy || undefined;
    this.pushBroadcast = args.pushBroadcast || undefined;
    this.pushSinglecast = args.pushSinglecast || undefined;
    this.publishAt = args.publishAt || undefined;
    this.repeatEvery = args.repeatEvery || undefined;
    this.repeatExpiresAt = args.repeatExpiresAt || undefined;
};

var Bodyparts = function (args) {
    args = args || {};
    this.textmessage = args.textmessage || undefined;
    this.htmlmessage = args.htmlmessage || undefined;
};

var SubscriptionOptions = function (args) {
    args = args || {};
    this.subscriberId = args.subscriberId || undefined;
    this.subtopic = args.subtopic || undefined;
    this.selector = args.selector || undefined;
};
