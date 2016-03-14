var plexusControllers = angular.module('plexusControllers', [])

/*global things..*/
var socket = io.connect('http://localhost:3001')
var db = new PouchDB('http://localhost:5984/sdps')

/*node.js modules*/
var fs = require('fs')
var randomWord = require('random-word-by-length')
var chunkit = require('chunkit')
var play = require('play-audio')
var mkdirp = require('mkdirp')
var folderContents = require('folder-contents')
