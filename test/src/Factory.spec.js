'use strict'

const expect = require('chai').expect

const Factory = require('../../src/Factory')

const simpleSchema = require('../schemas/simple-one')
const complexAllOfSchema = require('../schemas/complex-allOf')

describe('Factory', () => {
    beforeEach(function() {
        delete require.cache[require.resolve('../schemas/simple-one')];
        delete require.cache[require.resolve('../schemas/complex-allOf')];
    });

    describe('convert', () => {
        it('should produce a converted schema as a factory', function() {
            let expected = Factory.convert(simpleSchema)
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('main')
            expect(expected.schemas.main).to.not.have.property('$schema')

            expected = Factory.convert(complexAllOfSchema)
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('main')
            expect(expected.schemas.main).to.not.have.property('$schema')
            expect(expected.schemas).to.have.property('message')
        });
    });
});