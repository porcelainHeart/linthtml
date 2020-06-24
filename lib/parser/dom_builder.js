const { DomHandler } = require("htmlparser2");
const { isVoidElement } = require("../knife");

class Handler extends DomHandler {
  constructor(lineOffsets) {
    super({
      withStartIndices: true,
      withEndIndices: true
    });
    this.attributes = [];
    this.lineOffsets = lineOffsets;
    this.wasClosed = true;
  }

  get buffer() {
    // return this.htmlText; // this._parser._tokenizer._buffer is empty in the last call of "onclosetag"
    // return this._parser._tokenizer._buffer;
    return this.htmlText;
  }

  start(htmlText) {
    this.htmlText = htmlText;
  }

  _indexToPosition(index) {
    const line = this.lineOffsets.findIndex((startIndex) => index < startIndex);
    const column = line === -1 ? index - this.lineOffsets[this.lineOffsets.length - 1] : index - this.lineOffsets[line - 1];
    return {
      line: (line === -1 ? this.lineOffsets.length : line),
      column: column + 1
    };
  }

  addNode(node) {
    super.addNode(node);
    node.loc = {
      start: this._indexToPosition(node.startIndex),
      end: this._indexToPosition(node.endIndex + 1)
    };
  }

  onerrorfunction(error) {
    // TODO: actually bubble this up or queue errors
    throw error;
  }

  __createAttributeNode(name, _value) {
    let equal = null;
    let value = null;
    const start = this._parser._attribstartindex;
    let end = this._parser._tokenizer._index;
    if (/\s|\n/.test(this.buffer[end]) === false) {
      end++;
    }

    const namePosition = {
      start: this._indexToPosition(start),
      end: this._indexToPosition(start + name.length)
    };

    const raw = this.buffer.slice(start + name.length, end);
    const match = raw.match(/\s*=\s*/);
    const rawEqValue = match ? match[0] : null;
    if (rawEqValue) {
      equal = {
        chars: rawEqValue,
        loc: {
          start: namePosition.end,
          end: this._indexToPosition(start + name.length + rawEqValue.length)
        }
      };
    }
    if (_value) {
      const rawValue = raw.slice(rawEqValue.length);
      value = {
        chars: _value,
        raw: rawValue,
        loc: {
          start: this._indexToPosition(start + name.length + rawEqValue.length),
          end: this._indexToPosition(end)
        }
      };
    } else {
      end = start + name.length;
    }
    return {
      type: "attribute",
      index: start, // TODO: remove ?
      name: {
        chars: name,
        loc: namePosition
      },
      value,
      equal,
      loc: {
        start: this._indexToPosition(start),
        end: this._indexToPosition(end)
      }
    };
  }

  onattribute(name, value) {
    const attribute = this.__createAttributeNode(name, value);
    this.attributes.push(attribute);
  }

  /* eslint-disable no-underscore-dangle */
  onopentag(name, attribs) {
    super.onopentag(...arguments);

    const node = this._tagStack[this._tagStack.length - 1];

    // remove ?
    if (!this.wasClosed) {
      element.openIndex -= 3;
    }
    this.wasClosed = true;
    element.open = this.htmlText.slice(element.openIndex + 1, this._parser.endIndex);
    element.openLineCol = this._indexToPosition(element.openIndex);
    // remove duplicate data
    // delete element.lineCol;

    element.attributes = this.attributes;
    delete element.attribs;
    this.attributes = [];
  }

  onclosetag() {
    console.log(`buffer4: ${this._parser._tokenizer._buffer}`);
    // <span></p> (node close should be set to p with correct loc)
    const node = this._tagStack[this._tagStack.length - 1];
    if (node && !isVoidElement(node.name)) {
      const raw = this.buffer.slice(this._parser.startIndex, this._parser.endIndex + 1);
      node.close = {
        name: raw.replace(/(<|>|\/)/g, ""),
        raw,
        loc: {
          start: this._indexToPosition(this._parser.startIndex),
          end: this._indexToPosition(this._parser.endIndex + 1)
        }
      };
      node.loc.end = node.close.loc.end;
    }
    node.raw = this.buffer.slice(node.startIndex, this._parser.endIndex + 1);

    // const element = this._tagStack[this._tagStack.length - 1];

    // if (element && !isVoidElement(element.name)) {
    //   // Mercifully, no whitespace is allowed between < and /
    //   this.wasClosed = this.htmlText[this._parser.startIndex + 1] === "/";
    //   element.close = this.wasClosed
    //     ? this.htmlText.slice(this._parser.startIndex + 2, this._parser.endIndex)
    //     : "";
    //   element.closeIndex = this._parser.startIndex;
    //   if (!this.wasClosed && element.closeIndex === element.openIndex) {
    //     element.closeIndex += element.open.length + 1;
    //   }
    //   element.closeLineCol = this._indexToPosition(element.closeIndex);
    // }

    super.onclosetag(...arguments);
  }

  onprocessinginstruction(name, data) {
    // htmlparser2 doesn't normally update the position when processing
    // declarations or processing directives (<!doctype ...> or <?...> elements)
    this._parser._updatePosition(2);
    super.onprocessinginstruction(...arguments);
  }

  // _addDomElement(element) {
  //   if (!this._parser) {
  //     // TODO: rewrite error msg
  //     throw new Error("stop being a bone head >.<");
  //   }
  //   element.index = this._parser.startIndex;
  //   if (!this.wasClosed) {
  //     element.index -= 3;
  //   }
  //   element.lineCol = this._indexToPosition(element.index);
  //   super._addDomElement(...arguments);
  // }
  /* eslint-enable no-underscore-dangle */
}

module.exports = Handler;
