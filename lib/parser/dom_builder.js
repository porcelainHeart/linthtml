const { DomHandler } = require("htmlparser2");
const { isVoidElement, generateGetLineCol, attributesIndices } = require("../knife");

class DomBuilder extends DomHandler {
  constructor() {
    super({
      withStartIndices: true,
      withEndIndices: true
    });

    this.attributes = {};
    this.attribArr = [];
    this.dupes = [];
  }

  start(htmlText) {
    this.htmlText = htmlText;
    this.lineColFunc = generateGetLineCol(htmlText);
    // When a tag has no close, startIndex is too large by 3 for the
    // next calls to onopentag and _addDomElement. Keep track of this.
    this.wasClosed = true;
  }

  onerror(error) {
    // TODO: actually bubble this up or queue errors
    throw error;
  }

  onattribute(rawName, value) {
    const name = rawName.toLowerCase();
    if (!this.attributes[name]) {
      this.attributes[name] = {
        rawName: rawName,
        value: value
      };
      this.attribArr.push(name);
    } else {
      this.dupes.push(name);
    }
  }

  /* eslint-disable no-underscore-dangle */
  onopentag(name, attributes) {
    super.onopentag(name, attributes);
    const element = this._tagStack[this._tagStack.length - 1];
    element.openIndex = this._parser.startIndex;
    if (!this.wasClosed) {
      element.openIndex -= 3;
    }
    this.wasClosed = true;
    element.open = this.htmlText.slice(element.openIndex + 1, this._parser.endIndex);
    element.openLineCol = this.lineColFunc(element.openIndex);

    element.attribs = this.attributes;
    if (this.attribArr.length > 0) {
      attributesIndices(element.attribs, element.open, element.openIndex, element.name);
      this.attribArr
        .sort((a, b) => element.attribs[a].nameIndex - element.attribs[b].nameIndex)
        .forEach((attrib) => {
          const a = element.attribs[attrib];
          a.nameLineCol = this.lineColFunc(a.nameIndex);
          a.valueLineCol = this.lineColFunc(a.valueIndex);
        });
    }

    this.attribArr = [];
    this.attributes = {};

    element.dupes = this.dupes;
    this.dupes = [];
  }

  onclosetag() {
    const element = this._tagStack[this._tagStack.length - 1];

    if (element && !isVoidElement(element.name)) {
      // Mercifully, no whitespace is allowed between < and /
      this.wasClosed = this.htmlText[this._parser.startIndex + 1] === "/";
      element.close = this.wasClosed
        ? this.htmlText.slice(this._parser.startIndex + 2, this._parser.endIndex)
        : "";
      element.closeIndex = this._parser.startIndex;
      if (!this.wasClosed && element.closeIndex === element.openIndex) {
        element.closeIndex += element.open.length + 1;
      }
      element.closeLineCol = this.lineColFunc(element.closeIndex);
    }

    super.onclosetag(...arguments);
  }

  onprocessinginstruction(name, data) {
    // htmlparser2 doesn't normally update the position when processing
    // declarations or processing directives (<!doctype ...> or <?...> elements)
    this._parser._updatePosition(2);
    super.onprocessinginstruction(name, data);
  }

  _addDomElement(element) {
    element.index = this._parser.startIndex;
    if (!this.wasClosed) {
      element.index -= 3;
    }
    element.lineCol = this.lineColFunc(element.index);
    super._addDomElement(element);
  }
  /* eslint-enable no-underscore-dangle */
}

module.exports = DomBuilder;
