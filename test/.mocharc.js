'use strict'

module.exports = {
    recursive: true,
    reporter: 'spec',
    spec: 'test/**/*.spec.js',
    watch: true,
    'watch-files': ['src/**/*.js', 'test/**/*.spec.js'],
}
