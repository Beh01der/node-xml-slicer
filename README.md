# node-xml-slicer

Simple xml to js transformer for node-expat - fastest XML parser for Node.js
It's designed to be able to process large XML files with maximum speed and minimum RAM usage. 

## Install
Install locally
```
npm install node-xml-slicer
```

## Quick start
Following simple snippet parses given XML string using `node-expat` parser and transforms it using 2 separate Slicers.
You can combine as many Slicers as you want, extracting different parts of XML in one go. 
```javascript

var expat = require('node-expat');
var Slicer = require('node-xml-slicer');

var parser = expat.createParser();

var rootSlicer = new Slicer(parser);
var itemSlicer = new Slicer(parser, '/root/items/item');

parser.write('<root><items><item id="1">value 1</item><item>value 2</item></items></root>');

console.log('%j', rootSlicer.result);
console.log();
console.log('%j', itemSlicer.result);
```

Output of this code would be:
```json
{
    "root": {
        "items": {
            "item": [
                {
                    "#": "value 1",
                    "id":"1"
                },
                "value 2"
            ]
        }
    }
}

{
    "item": [
        {
            "#": "value 1",
            "id":"1"
        },
        "value 2"
    ]
}
```


## API
* **new Slicer(parser, [rootPath])** - creates new Slicer object for given `node-expat` parser with optional `rootPath`.
* **slicer.result** - returns resulting JavaScript object
* **slicer.errors** - returns array of parsing errors or `null` if no errors occurred

## License 
**ISC License (ISC)**

Copyright (c) 2015, Andrey Chausenko <andrey.chausenko@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
