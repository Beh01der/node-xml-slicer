class Slicer {
    private location = [];
    private rootPath;
    private withinPath: boolean = false;
    public errors: string[] = null;
    private nodeInfo = {};
    private objectStack = [];
    private result_;
    private slicer;

    constructor(parser, rootPath?: string) {
        this.rootPath = (rootPath || '').split('/').filter(i => { return !!i; });
        if (!this.rootPath.length) {
            this.rootPath = ['*'];
        }

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
                var justWhitespace = /^\s+$/;

                if (nodeInfo.attrs) {
                    if (!nodeInfo.result) {
                        nodeInfo.result = {};
                        if (!justWhitespace.test(nodeInfo.text)) {
                            nodeInfo.result['#'] = nodeInfo.text;
                        }
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

                if (parentNodeInfo.text && !justWhitespace.test(parentNodeInfo.text)) {
                    parentNodeInfo.result['#'] = parentNodeInfo.text.trim();
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
                text = text.replace(/^ +$/, '');
                if (text) {
                    if (!t.nodeInfo.text) {
                        t.nodeInfo.text = text;
                    } else {
                        t.nodeInfo.text += text;
                    }
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
                this.result_[this.objectStack[0].name] = Slicer.itemResult(this.objectStack[0]);
            } else {
                this.result_ = {};
                this.objectStack.forEach(item => {
                    if (this.result_[item.name]) {
                        if (!Array.isArray(this.result_[item.name])) {
                            this.result_[item.name] = [this.result_[item.name]];
                        }

                        this.result_[item.name].push(Slicer.itemResult(item));
                    } else {
                        this.result_[item.name] = Slicer.itemResult(item);
                    }
                });
            }
        }

        return this.result_;
    }

    private static itemResult(item) {
        if (item.result) {
            return item.result;
        } else {
            if (item.attrs) {
                var result = {'#': item.text};
                for (var i in item.attrs) {
                    if (item.attrs.hasOwnProperty(i)) {
                        result[i] = item.attrs[i];
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