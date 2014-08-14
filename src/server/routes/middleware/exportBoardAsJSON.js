var beautify = require('js-beautify').js_beautify;

module.exports = function exportBoardAsJSON(req, res, next) {
  output = beautify(JSON.stringify(req.board), { indent_size: 2 });
  res.set("Content-Disposition", 'attachment; filename="'+req.board.name+'.json"');
  res.send(output);
};
