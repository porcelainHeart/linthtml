/* eslint-env node */

const gulp = require('gulp');
const coveralls = require('gulp-coveralls');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');
const publish = require('gulp-gh-pages');
const jsdoc = require('gulp-jsdoc');
const cp = require('child_process');

const { series, parallel }= gulp;

let paths = {
    src: './lib/**/*.js',
    tests: './test/**/*.js',
    site: './site/**/*'
};

function lint() {
  return gulp.src([
      paths.src,
      paths.tests,
      './gulpfile.js'
    ])
    .pipe(eslint())
    .pipe(eslint.format());
}
lint.description = "Lints javascript files with eslint";
exports.lint = lint;

function tests() {
  return gulp.src(paths.tests, { read:false })
    .pipe(mocha())
}
tests.description = "Run unit tests using mocha+chai";
exports.tests = tests;

// jsdoc generation
function genJSDoc() {
  return gulp.src([paths.src, 'README.md'])
    .pipe(jsdoc.parser({
      plugins: [
        'plugins/escapeHtml',
        'plugins/markdown'
      ],
      markdown: {
        parser: 'gfm',
        githubRepoOwner: 'lintHTML',
        githubRepoName: 'lintHTML'
      }
    }))
    .pipe(jsdoc.generator('./site/api', {
      // template
      path: 'ink-docstrap',
      theme: 'cerulean',
      systemName: 'lintHTML',
      navType: 'vertical',
      linenums: true,
      inverseNav: true,
      outputSourceFiles: true
    }));
};

genJSDoc.description = "Generate code doc using jsdoc";
exports['docs:generate'] = genJSDoc;
exports['docs:publich'] = series(genJSDoc, function () {
  return gulp.src(paths.site)
    .pipe(publish({
        cacheDir: '.tmp'
    }));
});

function coverage() {
  return cp.execFile('npm run coverage');
}

// runs on travis ci (lints, tests, and uploads to coveralls)
exports.travis = series(parallel(lint, coverage), function () {
  return gulp.src('coverage/lcov.info')
      .pipe(coveralls());
});

exports.default = parallel(lint, tests);
