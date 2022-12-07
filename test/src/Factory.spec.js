'use strict'

const expect = require('chai').expect

const Factory = require('../../src/Factory')

const basic = require('../schemas/basic.json')

describe('Factory', () => {
    describe('convert', () => {
        it('should produce a converted schema as a factory', function() {
            let expected = Factory.convert(basic, 'basic')
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('basic')
            expect(expected.schemas.basic).to.not.have.property('$schema')
        });
    });
});
