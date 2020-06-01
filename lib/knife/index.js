module.exports = {
  applyRules: require("./apply_rules"),
  parseHtmlAttrs: require("./attr_parse").parseHtmlAttrs,
  attributesIndices: require("./attr_parse").attributesIndices,
  booleanAttrs: require("./boolean_attrs").booleanAttrs,
  isBooleanAttr: require("./boolean_attrs").isBooleanAttr,
  isLabeable: require("./is_labeable"),
  isVoidElement: require("./is_void_element"),
  checkLangTag: require("./lang_tag"),
  generateGetLineCol: require("./relative_line_col"),
  shred: require("./shred"),
  isSelfClosing: require("./tag_utils").isSelfClosing,
  hasNonEmptyAttr: require("./tag_utils").hasNonEmptyAttr,
  attributeValue: require("./tag_utils").attributeValue
};
