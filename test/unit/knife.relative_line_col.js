const { expect } = require("chai");
const { generateGetLineCol } = require("../../lib/knife");

describe("knife.relative_line_col", function() {
  it("should throw when called with an index behind the last", function() {
    const posFunc = generateGetLineCol("the html", [0, 0]);

    expect(posFunc.bind(this, -10)).to.throw();
  });
});
