var Slicer = (function () {
    function Slicer(parser, rootPath, options) {
        var _this = this;
        this.location = [];
        this.withinPath = false;
        this.errors = null;
        this.nodeInfo = {};
        this.objectStack = [];
        this.rootPath = (rootPath || '').split('/').filter(function (i) {
            return !!i;
        });
        if (!this.rootPath.length) {
            this.rootPath = ['*'];
        }
        this.options = {
            textAttrName: '#',
            attrNameMutator: function (input) {
                return input;
            },
            propNameMutator: function (input) {
                return input;
            },
            valueMutator: function (input) {
                return input;
            }
        };
        this.options = Object.assign(this.options, options || {});
        parser.slicer = this;
        this.slicer = this;
        parser.on('startElement', function (name, attrs) {
            var t = _this.slicer;
            t.location.push(name);
            t.checkEnterPath();
            if (t.withinPath) {
                t.nodeInfo = { name: name };
                var hasAttrs = false;
                for (var i in attrs) {
                    if (attrs.hasOwnProperty(i)) {
                        hasAttrs = true;
                        break;
                    }
                }
                if (hasAttrs) {
                    t.nodeInfo.attrs = attrs;
                }
                t.objectStack.push(t.nodeInfo);
            }
        });
        parser.on('endElement', function (name) {
            var t = _this.slicer;
            t.checkExitPath();
            t.location.pop();
            if (t.withinPath) {
                var nodeInfo = t.objectStack.pop();
                if (nodeInfo.attrs) {
                    if (!nodeInfo.result) {
                        nodeInfo.result = {};
                        nodeInfo.result[_this.options.textAttrName] = nodeInfo.text;
                    }
                    for (var i in nodeInfo.attrs) {
                        if (nodeInfo.attrs.hasOwnProperty(i)) {
                            nodeInfo.result[i] = nodeInfo.attrs[i];
                        }
                    }
                }
                var parentNodeInfo = t.objectStack[t.objectStack.length - 1];
                if (!parentNodeInfo.result) {
                    parentNodeInfo.result = {};
                }
                if (parentNodeInfo.text) {
                    parentNodeInfo.result[_this.options.textAttrName] = parentNodeInfo.text;
                }
                if (parentNodeInfo.result[nodeInfo.name]) {
                    // make array
                    if (!Array.isArray(parentNodeInfo.result[nodeInfo.name])) {
                        parentNodeInfo.result[nodeInfo.name] = [parentNodeInfo.result[nodeInfo.name]];
                    }
                    if (nodeInfo.result) {
                        parentNodeInfo.result[nodeInfo.name].push(nodeInfo.result);
                    }
                    else {
                        parentNodeInfo.result[nodeInfo.name].push(nodeInfo.text || null);
                    }
                }
                else {
                    if (nodeInfo.result) {
                        parentNodeInfo.result[nodeInfo.name] = nodeInfo.result;
                    }
                    else {
                        parentNodeInfo.result[nodeInfo.name] = nodeInfo.text || null;
                    }
                }
            }
        });
        parser.on('text', function (text) {
            var t = _this.slicer;
            if (t.withinPath) {
                text = text.replace(/^\s+|\s+$/, '');
                if (text) {
                    t.nodeInfo.text = text;
                }
            }
        });
        parser.on('error', function (error) {
            if (!_this.slicer.errors) {
                _this.slicer.errors = [];
            }
            _this.slicer.errors.push('Error parsing XML: ' + error);
            _this.withinPath = false;
        });
    }
    Object.defineProperty(Slicer.prototype, "result", {
        get: function () {
            var _this = this;
            if (this.result_ === undefined) {
                if (this.errors || this.objectStack.length === 0) {
                    this.result_ = null;
                }
                else if (this.objectStack.length === 1) {
                    this.result_ = {};
                    this.result_[this.objectStack[0].name] = this.itemResult(this.objectStack[0]);
                }
                else {
                    this.result_ = {};
                    this.objectStack.forEach(function (item) {
                        if (_this.result_[item.name]) {
                            if (!Array.isArray(_this.result_[item.name])) {
                                _this.result_[item.name] = [_this.result_[item.name]];
                            }
                            _this.result_[item.name].push(_this.itemResult(item));
                        }
                        else {
                            _this.result_[item.name] = _this.itemResult(item);
                        }
                    });
                }
            }
            return this.result_;
        },
        enumerable: true,
        configurable: true
    });
    Slicer.prototype.itemResult = function (item) {
        if (item.result) {
            return item.result;
        }
        else {
            if (item.attrs) {
                var result = {};
                result[this.options.textAttrName] = item.text;
                for (var i in item.attrs) {
                    if (item.attrs.hasOwnProperty(i)) {
                        result[this.options.attrNameMutator(i)] = item.attrs[i];
                    }
                }
                return result;
            }
            else {
                return item.text;
            }
        }
    };
    Slicer.prototype.checkEnterPath = function () {
        var _this = this;
        if (this.withinPath || this.location.length !== this.rootPath.length) {
            return;
        }
        this.withinPath = !this.errors && this.rootPath.every(function (u, i) {
            return u === _this.location[i] || u === '*';
        });
    };
    Slicer.prototype.checkExitPath = function () {
        if (this.withinPath && this.location.length === this.rootPath.length) {
            this.withinPath = false;
        }
    };
    return Slicer;
})();
module.exports = Slicer;
//# sourceMappingURL=node-xml-slicer.js.map