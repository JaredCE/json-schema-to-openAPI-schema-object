'use strict'

const expect = require('chai').expect

const Factory = require('../../index')

const basic = require('../schemas/basic.json')

describe('index', () => {
    describe('convert', () => {
        it('should produce a converted schema', function() {
            const name = 'basic'
            let expected = Factory.convert(basic, 'basic')
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('basic')
            expect(expected.schemas.basic).to.not.have.property('$schema')
        });
    });
});
