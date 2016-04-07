angular.module('plexusControllers', [])

/*global things..*/
const socket = io.connect('http://localhost:3001')
const db = new PouchDB('http://localhost:5984/sdps')
const clientDB = new PouchDB('musicDB')
PouchDB.plugin(require('pouchdb-upsert'))

/*node.js modules*/
const fs = require('fs')
const randomWord = require('random-word-by-length')
const chunkit = require('chunkit')
const play = require('play-audio')
const mkdirp = require('mkdirp')
const folderContents = require('folder-contents')
const mm = require('musicmetadata')
const _ = require('lodash')
var async = require("async")

// electron
const ipcRenderer = require('electron').ipcRenderer