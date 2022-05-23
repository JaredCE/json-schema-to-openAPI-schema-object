'use strict'

const expect = require('chai').expect
const validator = require('oas-validator');

const Convertor = require('../../src/Convertor')

const simpleSchema = require('../schemas/simple-one')
const complexSchema = require('../schemas/complex-one')
const complexAllOfSchema = require('../schemas/complex-allOf')
const complexAnyOfSchema = require('../schemas/complex-anyOf')
const complexAnyOfInlineSchema = require('../schemas/complex-anyOfInline')
const complexItemsSchema = require('../schemas/complex-items')
const complexNotSchema = require('../schemas/complex-not')
const complexNotInlineSchema = require('../schemas/complex-notInline')
const complexOneOfSchema = require('../schemas/complex-oneOf')
const moreComplexOneOfSchema = require('../schemas/morecomplex-oneOf')
const complexPropertySchema = require('../schemas/complex-property')
const complexPropertyDefinitionSchema = require('../schemas/complex-propertyDefinition')

const simpleOpenAPI = require('../openAPI/simple')

describe('Convertor', () => {
    let convertor
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
        convertor = new Convertor(simpleSchema)
    });

    describe('convert a simple schema', () => {
        it('should return a schema without the $schema property', function() {
            const expected = convertor.convert()
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('main')
            expect(expected.schemas.main).to.not.have.property('$schema')
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const components = convertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
        });
    });

    describe('convert a complex schema oneOf', () => {
        it('should return an object containing two schemas', function() {
            const complexConvertor = new Convertor(complexOneOfSchema)
            const expected = complexConvertor.convert()
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('main')
            expect(expected.schemas.main).to.not.have.property('$schema')
            expect(expected.schemas).to.have.property('message')
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(complexOneOfSchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            expect(cloned.components.schemas).to.have.property('message')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(moreComplexOneOfSchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            expect(cloned.components.schemas).to.have.property('message')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });
    });

    describe('convert a complex schema anyOf', () => {
        it('should return an object containing two schemas', function() {
            const complexConvertor = new Convertor(complexAnyOfSchema)
            const expected = complexConvertor.convert()
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('main')
            expect(expected.schemas.main).to.not.have.property('$schema')
            expect(expected.schemas).to.have.property('message')
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(complexAnyOfSchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            expect(cloned.components.schemas).to.have.property('message')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(complexAnyOfInlineSchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            expect(cloned.components.schemas).to.have.property('message')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });
    });

    describe('convert a complex schema allOf', () => {
        it('should return an object containing two schemas', function() {
            const complexConvertor = new Convertor(complexAllOfSchema)
            const expected = complexConvertor.convert()
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('main')
            expect(expected.schemas.main).to.not.have.property('$schema')
            expect(expected.schemas).to.have.property('message')
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(complexAllOfSchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            expect(cloned.components.schemas).to.have.property('message')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });
    });

    describe('convert a complex schema items', () => {
        it('should return an object containing two schemas', function() {
            const complexConvertor = new Convertor(complexItemsSchema)
            const expected = complexConvertor.convert()
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('main')
            expect(expected.schemas.main).to.not.have.property('$schema')
            expect(expected.schemas).to.have.property('error')
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(complexItemsSchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            expect(cloned.components.schemas).to.have.property('error')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });
    });

    describe('convert a complex schema not', () => {
        it('should return an object containing two schemas', function() {
            const complexConvertor = new Convertor(complexNotSchema)
            const expected = complexConvertor.convert()
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('main')
            expect(expected.schemas.main).to.not.have.property('$schema')
            expect(expected.schemas).to.have.property('message')
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(complexNotSchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            expect(cloned.components.schemas).to.have.property('message')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(complexNotInlineSchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            // expect(cloned.components.schemas).to.have.property('message')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });
    });

    describe('convert a complex schema property', () => {
        it('should return an object containing two schemas', function() {
            const complexConvertor = new Convertor(complexPropertySchema)
            const expected = complexConvertor.convert()
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('main')
            expect(expected.schemas.main).to.not.have.property('$schema')
            expect(expected.schemas).to.have.property('message')
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(complexPropertySchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            expect(cloned.components.schemas).to.have.property('message')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });

        it('should return an object containing two schemas for a definition with a reference', function() {
            const complexConvertor = new Convertor(complexPropertyDefinitionSchema)
            const expected = complexConvertor.convert()
            // console.dir(expected, {depth:null})
            expect(expected).to.be.an('object')
            expect(expected).to.have.property('schemas')
            expect(expected.schemas).to.have.property('main')
            expect(expected.schemas.main).to.not.have.property('$schema')
            expect(expected.schemas).to.have.property('error')
            expect(expected.schemas).to.have.property('meta')
        });

        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(complexPropertyDefinitionSchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            expect(cloned.components.schemas).to.have.property('error')
            expect(cloned.components.schemas).to.have.property('meta')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });
    });

    describe('convert a deeply definitioned complex schema', () => {
        it('should return a schema valid for OpenAPI v3.0.0', async function() {
            const complexConvertor = new Convertor(complexSchema)
            const components = complexConvertor.convert()
            const cloned = JSON.parse(JSON.stringify(simpleOpenAPI))
            let valid = await validator.validateInner(cloned, {})
            expect(valid).to.be.true
            Object.assign(cloned, {components})
            expect(cloned).to.have.property('components')
            expect(cloned.components).to.have.property('schemas')
            expect(cloned.components.schemas).to.have.property('main')
            expect(cloned.components.schemas).to.have.property('meta')
            expect(cloned.components.schemas).to.have.property('links')
            expect(cloned.components.schemas).to.have.property('link')
            expect(cloned.components.schemas).to.have.property('error')
            valid = await validator.validateInner(cloned, {})
                .catch(err => {
                    console.log(err)
                })
            expect(valid).to.be.true
        });
    });
});
