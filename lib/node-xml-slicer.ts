interface Options {
    textAttrName?: string;
    attrNameMutator?: (input: string) => string;
    propNameMutator?: (input: string) => string;
    valueMutator?: (input: any) => any;
}

class Slicer {
    private location = [];
    private rootPath;
    private withinPath: boolean = false;
    public errors: string[] = null;
    private nodeInfo = {};
    private objectStack = [];
    private result_;
    private slicer;
    private options: Options;

    constructor(parser, rootPath?: string, options?: Options) {
        this.rootPath = (rootPath || '').split('/').filter(i => { return !!i; });
        if (!this.rootPath.length) {
            this.rootPath = ['*'];
        }

        this.options = {
            textAttrName: '#',
            attrNameMutator: (input) => { return input; },
            propNameMutator: (input) => { return input; },
            valueMutator: (input) => { return input }
        };
        this.options = Object.assign(this.options, options || {});

        parser.slicer = this;
        this.slicer = this;
        parser.on('startElement', (name, attrs) => {
            var t = this.slicer;

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

        parser.on('endElement', name => {
            var t = this.slicer;

            t.checkExitPath();
            t.location.pop();

            if (t.withinPath) {
                var nodeInfo = t.objectStack.pop();

                if (nodeInfo.attrs) {
                    if (!nodeInfo.result) {
                        nodeInfo.result = {};
                        nodeInfo.result[this.options.textAttrName] = nodeInfo.text;
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
                    parentNodeInfo.result[this.options.textAttrName] = parentNodeInfo.text;
                }

                if (parentNodeInfo.result[nodeInfo.name]) {
                    // make array

                    if (!Array.isArray(parentNodeInfo.result[nodeInfo.name])) {
                        parentNodeInfo.result[nodeInfo.name] = [parentNodeInfo.result[nodeInfo.name]];
                    }

                    if (nodeInfo.result) {
                        parentNodeInfo.result[nodeInfo.name].push(nodeInfo.result);
                    } else {
                        parentNodeInfo.result[nodeInfo.name].push(nodeInfo.text || null);
                    }
                } else {
                    if (nodeInfo.result) {
                        parentNodeInfo.result[nodeInfo.name] = nodeInfo.result;
                    } else {
                        parentNodeInfo.result[nodeInfo.name] = nodeInfo.text || null;
                    }
                }
            }
        });

        parser.on('text', text => {
            var t = this.slicer;
            if (t.withinPath) {
                text = text.replace(/^\s+|\s+$/, '');
                if (text) {
                    t.nodeInfo.text = text;
                }
            }
        });

        parser.on('error', error => {
            if (!this.slicer.errors) {
                this.slicer.errors = [];
            }
            this.slicer.errors.push('Error parsing XML: ' + error);
            this.withinPath = false;
        });
    }

    get result() {
        if (this.result_ === undefined) {
            if (this.errors || this.objectStack.length === 0) {
                this.result_ = null;
            } else if (this.objectStack.length === 1) {
                this.result_ = {};
                this.result_[this.objectStack[0].name] = this.itemResult(this.objectStack[0]);
            } else {
                this.result_ = {};
                this.objectStack.forEach(item => {
                    if (this.result_[item.name]) {
                        if (!Array.isArray(this.result_[item.name])) {
                            this.result_[item.name] = [this.result_[item.name]];
                        }

                        this.result_[item.name].push(this.itemResult(item));
                    } else {
                        this.result_[item.name] = this.itemResult(item);
                    }
                });
            }
        }

        return this.result_;
    }

    private itemResult(item) {
        if (item.result) {
            return item.result;
        } else {
            if (item.attrs) {
                var result = {};
                result[this.options.textAttrName] = item.text;
                for (var i in item.attrs) {
                    if (item.attrs.hasOwnProperty(i)) {
                        result[this.options.attrNameMutator(i)] = item.attrs[i];
                    }
                }
                return result;
            } else {
                return item.text;
            }
        }
    }

    private checkEnterPath() {
        if (this.withinPath || this.location.length !== this.rootPath.length) {
            return;
        }

        this.withinPath = !this.errors &&
            this.rootPath.every((u, i) => { return u === this.location[i] || u === '*'; });
    }

    private checkExitPath() {
        if (this.withinPath && this.location.length === this.rootPath.length) {
            this.withinPath = false;
        }
    }
}

export = Slicer;