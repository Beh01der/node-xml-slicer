var fs = require('fs');
var expat = require('node-expat');
var Slicer = require('../lib/node-xml-slicer');

var chai = require('chai');

function processXml(xmlFile, rootPath) {
    var xml = xmlFile ? fs.readFileSync('./test/xml/' + xmlFile) : '';
    var parser = expat.createParser();
    var slicer = new Slicer(parser, rootPath);
    parser.write(xml);
    return slicer;
}

describe('Slicer', function(){
    describe('parses simple XML from root element by default', function(){
        it('should return expected js object', function(){
            var expected = {
                root: {
                    item: {
                        'sub-item': {
                            index: '0',
                            name: 'sub-item 1'
                        }
                    }
                }
            };

            chai.expect(processXml('01.xml').result).to.eql(expected);
        });
    });

    describe('parses simple XML from root element by path', function(){
        it('should return expected js object', function(){
            var expected = {
                root: {
                    item: {
                        'sub-item': {
                            index: '0',
                            name: 'sub-item 1'
                        }
                    }
                }
            };

            chai.expect(processXml('01.xml', '/root').result).to.eql(expected);
        });
    });

    describe('parses simple XML from inner element', function(){
        it('should return expected js object', function(){
            var expected = {
                'sub-item': {
                    index: '0',
                    name: 'sub-item 1'
                }
            };

            chai.expect(processXml('01.xml', '/root/item/sub-item').result).to.eql(expected);
        });
    });

    describe('parses simple XML from innermost element', function(){
        it('should return expected js object', function(){
            var expected = {
                name: 'sub-item 1'
            };

            chai.expect(processXml('01.xml', '/root/item/sub-item/name').result).to.eql(expected);
        });
    });

    describe('parses XML with multiple elements from root', function(){
        it('should return expected js object', function(){
            var expected = {
                'root': {
                    'item': {
                        'sub-item': [
                            {
                                'index': '0',
                                'name': 'sub-item 1'
                            },
                            {
                                'alias': [
                                    'sub-item 2 alias 1',
                                    'sub-item 2 alias 2'
                                ],
                                'index': '1',
                                'name': 'sub-item 2'
                            },
                            {
                                'index': '2',
                                'name': 'sub-item 3'
                            }
                        ]
                    }
                }
            };

            chai.expect(processXml('02.xml').result).to.eql(expected);
        });
    });

    describe('parses XML with multiple elements from inner element', function(){
        it('should return expected js object', function(){
            var expected = {
                'sub-item': [
                    {
                        'index': '0',
                        'name': 'sub-item 1'
                    },
                    {
                        'alias': [
                            'sub-item 2 alias 1',
                            'sub-item 2 alias 2'
                        ],
                        'index': '1',
                        'name': 'sub-item 2'
                    },
                    {
                        'index': '2',
                        'name': 'sub-item 3'
                    }
                ]
            };

            chai.expect(processXml('02.xml', '/root/item/sub-item').result).to.eql(expected);
        });
    });

    describe('parses XML with multiple elements from innermost element', function(){
        it('should return expected js object', function(){
            var expected = {
                'name': ['sub-item 1', 'sub-item 2', 'sub-item 3']
            };

            chai.expect(processXml('02.xml', '/root/item/sub-item/name').result).to.eql(expected);
        });
    });

    describe('parses XML with combination of arguments, elements and text', function(){
        it('should return expected js object', function(){
            var expected = {
                'root': {
                    'item': {
                        '#': 'took out for text!',
                        'sub-item': {
                            'id': 'id1',
                            'index': '0',
                            'name': {
                                '#': 'sub-item 1',
                                'type': 'simple'
                            }
                        }
                    }
                }
            };

            chai.expect(processXml('03.xml').result).to.eql(expected);
        });
    });

    describe('parses XML with combination of arguments, elements and text from innermost element', function(){
        it('should return expected js object', function(){
            var expected = {
                'name': {
                    '#': 'sub-item 1',
                    'type': 'simple'
                }
            };

            chai.expect(processXml('03.xml', '/root/item/sub-item/name').result).to.eql(expected);
        });
    });

    describe('empty XML is handled without exceptions', function(){
        it('should return null', function(){
            var slicer = processXml();

            chai.expect(slicer.result).to.be.null;
            chai.expect(slicer.errors).to.be.null;
        });
    });

    describe('invalid XML is handled without exceptions, but errors is not empty', function(){
        it('should return null', function(){
            var slicer = processXml('04.xml');

            chai.expect(slicer.result).to.be.null;
            chai.expect(slicer.errors.length).to.equal(1);
        });
    });

    describe('handles large blocks of CDATA', function(){
        var textFile = fs.readFileSync(__dirname + '/txt/4500.lorem').toString();
        it('should match the text file', function(){
            var slicer = processXml('05.xml', '/root/item');
            chai.expect(slicer.result.item.length).to.equal(textFile.length);
            chai.expect(slicer.result.item).to.equal(textFile);
        });
    });
});