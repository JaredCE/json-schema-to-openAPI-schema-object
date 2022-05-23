'use strict'

const expect = require('chai').expect

const Factory = require('../../src/Factory')

const simpleSchema = require('../schemas/simple-one')
const complexAllOfSchema = require('../schemas/complex-allOf')

describe('Factory', () => {
    beforeEach(function() {
        delete require.cache[require.resolve('../schemas/simple-one')];
        delete require.cache[require.resolve('../schemas/complex-allOf')];
        delete require.cache[require.resolve('../schemas/complex-anyOf')];
        delete require.cache[require.resolve('../schemas/complex-anyOfInline')];
        delete require.cache[require.resolve('../schemas/complex-items')];
        delete require.cache[require.resolve('../schemas/complex-not')];
        delete require.cache[require.resolve('../schemas/complex-notInline')];
        delete require.cache[require.resolve('../schemas/complex-oneOf')];
        delete require.cache[require.resolve('../schemas/morecomplex-oneOf')];
        delete require.cache[require.resolve('../schemas/complex-property')];
        delete require.cache[require.resolve('../schemas/complex-propertyDefinition')];
    });

    describe('convert', () => {
        it('should produce a converted schema', function() {
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