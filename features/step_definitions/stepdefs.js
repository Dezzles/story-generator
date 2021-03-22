import { Given, When, Then } from 'cucumber'
import Compiler from '../../src/compiler'
import { expect } from 'chai'
import TestData from './testSet'

Given('I have a story builder', function () {
  this.builder = new Compiler()
})

Given('I have loaded the test data set', function () {
  this.builder.loadDataset(TestData)
})

Given('random returns {int}', function (r) {
  this.random = () => r
})

When('I create with {string}', function (str) {
  this.builder.loadDataset({
    'bddTest': str
  })
  this.result = this.builder.build('bddTest', this.random)
})

Then('I get {string}', function (str) {
  expect(str).to.equal(this.result.text)
})
/*
Given('I have a story builder', function () {
  this.builder = new StoryBuilder()
})

Given('I have loaded the test data set', function () {
  this.builder.addDataset(TestData)
})

Given('random returns {int}', function (r) {
  this.random = () => r
})

When('I create with {string}', function (str) {
  this.result = this.builder.create(str, this.random)
})

Then('I get {string}', function (str) {
  expect(str).to.equal(this.result)
})
/** */