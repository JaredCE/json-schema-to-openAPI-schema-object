"use strict";

const expect = require("chai").expect;
const validator = require("oas-validator");
// for external schema validation tests
const fetch = require("node-fetch");
const $RefParser = require("@apidevtools/json-schema-ref-parser");

const Convertor = require("../../src/Convertor");

// JSON Schemas
// basic
const basic = require("../schemas/basic.json");
// invalid Fields
const invalidFieldOne = require("../schemas/invalidFields/invalidField.json");
// null property type
const nullProperty = require("../schemas/nullProperties/nullProperty.json");
// array types
const arrayType = require("../schemas/arrayTypes/arrayType.json");
const arrayTypeWithNull = require("../schemas/arrayTypes/arrayTypeIncludingNull.json");
const arrayTypeWithArrayTypes = require("../schemas/arrayTypes/arrayTypeWithArray.json");
const arrayTypeWithObjectTypes = require("../schemas/arrayTypes/arrayTypeWithObject.json");
const arrayTypeWithDefaults = require("../schemas/arrayTypes/arrayTypeWithDefault.json");
// defaults
const defaultArray = require("../schemas/defaultValues/defaultArray.json");
const defaultBoolean = require("../schemas/defaultValues/defaultBoolean.json");
const defaultNumbers = require("../schemas/defaultValues/defaultNumbers.json");
const defaultString = require("../schemas/defaultValues/defaultString.json");
// array items
const basicArray = require("../schemas/arrayItems/basicArray.json");
const multiArray = require("../schemas/arrayItems/multipleItemArray.json");
// const values
const basicConst = require("../schemas/const/basicConst.json");
// if/then/else schemas
const ifThenElse = require("../schemas/ifelse/ifthenelse.json");
const ifThen = require("../schemas/ifelse/ifthen.json");
const ifElse = require("../schemas/ifelse/ifelse.json");
const ifSchema = require("../schemas/ifelse/if.json");
const elseSchema = require("../schemas/ifelse/else.json");
const thenSchema = require("../schemas/ifelse/then.json");
const thenElseSchema = require("../schemas/ifelse/thenelse.json");
// dependencies schemas
const dependenciesArray = require("../schemas/dependencies/dependenciesArray.json");
const dependenciesSchema = require("../schemas/dependencies/dependenciesSchema.json");
const dependentRequired = require("../schemas/dependencies/dependentRequired.json");
const dependentSchemas = require("../schemas/dependencies/dependentSchemas.json");
// camelcased keys
const camelCased = require("../schemas/camelCasedKey/camelCasedKey.json");
// array Keys
const arrayKeyOneOf = require("../schemas/arrayKeys/arrayKeyOneOf.json");
// External Schemas That I Cannot Currently Convert
const listOfBannedSchemas = require("../schemas/SchemasThatCannotBeConverted/list.json");
// anyOf/oneOf Nulls
const oneOfNull = require("../schemas/ofNulls/oneOfNull.json");
const anyOfNull = require("../schemas/ofNulls/anyOfNull.json");
// anyOf/oneOf Nulls
const allOfProperties = require("../schemas/propertiesOutsideOf/allOf.json");
const oneOfProperties = require("../schemas/propertiesOutsideOf/oneOf.json");
const anyOfProperties = require("../schemas/propertiesOutsideOf/anyOf.json");
// circular
const circular = require("../schemas/circular/circular.json");

// OpenAPI
const basicOpenAPI = require("../openAPI/basic.json");

describe("Convertor", () => {
  let convertor;

  beforeEach(function () {
    convertor = new Convertor(basic);
  });

  describe("Class", () => {
    it("should be a class", function () {
      expect(Convertor).to.be.a("function");
    });

    it("should have a convert function", function () {
      expect(convertor).to.have.property("convert");
    });

    it("should have a property of this.schema when instantiated", function () {
      expect(Convertor).to.not.have.a.property("schema");
      expect(convertor).to.have.a.property("schema");
    });

    it("should have property this.schema equal to the argument instantiated with", function () {
      let schema = {
        a: 123,
      };

      const convertor2 = new Convertor(schema);
      expect(convertor2.schema).to.be.deep.equal(schema);
    });

    it("should have a property of this.specialSchemaFields", function () {
      expect(Convertor).to.not.have.a.property("specialSchemaFields");
      expect(convertor).to.have.a.property("specialSchemaFields");
      expect(convertor.specialSchemaFields).to.be.an("Array");
      expect(convertor.specialSchemaFields.length).to.be.equal(11);
    });

    it("should have a property of this.validSchemaFields", function () {
      expect(Convertor).to.not.have.a.property("validSchemaFields");
      expect(convertor).to.have.a.property("validSchemaFields");
      expect(convertor.validSchemaFields).to.be.an("Array");
      expect(convertor.validSchemaFields.length).to.be.equal(36);
    });

    it("should have a property of this.components", function () {
      expect(Convertor).to.not.have.a.property("components");
      expect(convertor).to.have.a.property("components");
      expect(convertor.components).to.be.an("Object");
    });
  });

  describe("convert", () => {
    it("should return this.components as an object", function () {
      const result = convertor.convert("basic");
      expect(result).to.deep.equal(convertor.components);
      expect(result).to.be.an("Object");
    });

    describe("invalid Keys", () => {
      it("should remove keys that do not feature in the validFields array", async function () {
        const result = convertor.convert("basic");
        expect(result.schemas.basic).to.not.have.property("$schema");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should remove deeply nested keys that do not feature in the validFields array", async function () {
        expect(invalidFieldOne.properties.errors).to.have.property("$schema");
        const newConvertor = new Convertor(invalidFieldOne);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic).to.not.have.property("$schema");
        expect(result.schemas.basic.properties.errors).to.not.have.property(
          "$schema"
        );

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe("properties as null", () => {
      it("should convert properties as null to nullable", async function () {
        const newConvertor = new Convertor(nullProperty);
        const result = newConvertor.convert("basic");
        expect(
          result.schemas.basic.properties.nullProperty
        ).to.not.have.property("type");
        expect(result.schemas.basic.properties.nullProperty).to.have.property(
          "nullable"
        );
        expect(
          result.schemas.basic.properties.nullProperty.nullable
        ).to.be.equal(true);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe("arrays of types", () => {
      it("should convert properties that have an array of types to a oneOf", async function () {
        const newConvertor = new Convertor(arrayType);
        const result = newConvertor.convert("basic");
        expect(
          result.schemas.basic.properties.arrayTypeProperty
        ).to.not.have.property("type");
        expect(
          result.schemas.basic.properties.arrayTypeProperty
        ).to.have.property("oneOf");
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf
        ).to.be.an("array");
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf.length
        ).to.be.equal(2);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert properties that have an array of types to a oneOf with null fields", async function () {
        const newConvertor = new Convertor(arrayTypeWithNull);
        const result = newConvertor.convert("basic");
        expect(
          result.schemas.basic.properties.arrayTypeProperty
        ).to.not.have.property("type");
        expect(
          result.schemas.basic.properties.arrayTypeProperty
        ).to.have.property("oneOf");
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf
        ).to.be.an("array");
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf.length
        ).to.be.equal(1);
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf[0].type
        ).to.be.equal("string");
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf[0].nullable
        ).to.be.equal(true);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert properties that have an array of types to a oneOf with array types", async function () {
        const newConvertor = new Convertor(arrayTypeWithArrayTypes);
        const result = newConvertor.convert("basic");
        expect(
          result.schemas.basic.properties.arrayTypeProperty
        ).to.not.have.property("type");
        expect(
          result.schemas.basic.properties.arrayTypeProperty
        ).to.have.property("oneOf");
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf
        ).to.be.an("array");
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf.length
        ).to.be.equal(2);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert properties that have an array of types to a oneOf with object types", async function () {
        const newConvertor = new Convertor(arrayTypeWithObjectTypes);
        const result = newConvertor.convert("basic");
        expect(
          result.schemas.basic.properties.arrayTypeProperty
        ).to.not.have.property("type");
        expect(
          result.schemas.basic.properties.arrayTypeProperty
        ).to.have.property("oneOf");
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf
        ).to.be.an("array");
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf.length
        ).to.be.equal(2);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert properties that have an array of types to a oneOf with defaults", async function () {
        const newConvertor = new Convertor(arrayTypeWithDefaults);
        const result = newConvertor.convert("basic");
        expect(
          result.schemas.basic.properties.arrayTypeProperty
        ).to.not.have.property("type");
        expect(
          result.schemas.basic.properties.arrayTypeProperty
        ).to.have.property("oneOf");
        expect(
          result.schemas.basic.properties.arrayTypeProperty.oneOf.length
        ).to.be.equal(2);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe("default values", () => {
      it("should convert default Array values correctly", async function () {
        const newConvertor = new Convertor(defaultArray);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.errors).to.have.property(
          "default"
        );
        expect(result.schemas.basic.properties.errors.default).to.be.an(
          "array"
        );
        expect(
          result.schemas.basic.properties.errors.default.length
        ).to.be.equal(1);
        expect(result.schemas.basic.properties.errors.default[0]).to.be.equal(
          1
        );
        expect(result.schemas.basic.properties.other).to.have.property("items");
        expect(result.schemas.basic.properties.other.items).to.be.deep.equal({
          nullable: true,
        });

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert default Boolean values correctly", async function () {
        const newConvertor = new Convertor(defaultBoolean);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.errors).to.have.property(
          "default"
        );
        expect(result.schemas.basic.properties.errors.default).to.be.equal(
          true
        );
        expect(result.schemas.basic.properties.other).to.have.property(
          "default"
        );
        expect(result.schemas.basic.properties.other.default).to.be.equal(
          false
        );

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert default Number and Integer values correctly", async function () {
        const newConvertor = new Convertor(defaultNumbers);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.errors).to.have.property(
          "default"
        );
        expect(result.schemas.basic.properties.errors.default).to.be.equal(1);
        expect(result.schemas.basic.properties.other).to.have.property(
          "default"
        );
        expect(result.schemas.basic.properties.other.default).to.be.equal(2);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert default String values correctly", async function () {
        const newConvertor = new Convertor(defaultString);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.errors).to.have.property(
          "default"
        );
        expect(result.schemas.basic.properties.errors.default).to.be.equal("1");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe("arrays to objects", () => {
      it("should convert array items to an object", async function () {
        const newConvertor = new Convertor(basicArray);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.names).to.have.property("type");
        expect(result.schemas.basic.properties.names.type).to.be.equal("array");
        expect(result.schemas.basic.properties.names.items).to.be.an("object");
        expect(result.schemas.basic.properties.names.items).to.not.be.an(
          "array"
        );

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should only use the first item in the array and discard the others", async function () {
        const newConvertor = new Convertor(multiArray);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.names).to.have.property("type");
        expect(result.schemas.basic.properties.names.type).to.be.equal("array");
        expect(result.schemas.basic.properties.names.items).to.be.an("object");
        expect(result.schemas.basic.properties.names.items).to.not.be.an(
          "array"
        );
        expect(result.schemas.basic.properties.names.items.type).to.equal(
          "object"
        );

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe("const values", () => {
      it("should convert const values to enum", async function () {
        const newConvertor = new Convertor(basicConst);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.name).to.not.have.property(
          "const"
        );
        expect(result.schemas.basic.properties.name).to.have.property("enum");
        expect(result.schemas.basic.properties.name.enum.length).to.be.equal(1);
        expect(result.schemas.basic.properties.name.enum[0]).to.be.equal(
          "blah"
        );

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe("if then else schemas", () => {
      it("should convert an if then else schema", async function () {
        const newConvertor = new Convertor(ifThenElse);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties).to.have.property(
          "street_address"
        );
        expect(result.schemas.basic.properties).to.have.property("country");
        expect(result.schemas.basic).to.have.property("oneOf");
        expect(result.schemas.basic.oneOf).to.be.an("array");
        expect(result.schemas.basic.oneOf.length).to.be.equal(2);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert an if then schema", async function () {
        const newConvertor = new Convertor(ifThen);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties).to.have.property(
          "street_address"
        );
        expect(result.schemas.basic.properties).to.have.property("country");
        expect(result.schemas.basic).to.have.property("oneOf");
        expect(result.schemas.basic.oneOf).to.be.an("array");
        expect(result.schemas.basic.oneOf.length).to.be.equal(1);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert an if else schema", async function () {
        const newConvertor = new Convertor(ifElse);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties).to.have.property(
          "street_address"
        );
        expect(result.schemas.basic.properties).to.have.property("country");
        expect(result.schemas.basic).to.have.property("oneOf");
        expect(result.schemas.basic.oneOf).to.be.an("array");
        expect(result.schemas.basic.oneOf.length).to.be.equal(1);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should remove an then else keyword without an if", async function () {
        const newConvertor = new Convertor(thenElseSchema);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties).to.have.property(
          "street_address"
        );
        expect(result.schemas.basic.properties).to.have.property("country");
        expect(result.schemas.basic).to.not.have.property("oneOf");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should remove an if keyword without a then or an else", async function () {
        const newConvertor = new Convertor(ifSchema);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties).to.have.property(
          "street_address"
        );
        expect(result.schemas.basic.properties).to.have.property("country");
        expect(result.schemas.basic).to.not.have.property("oneOf");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should remove an else keyword without an if", async function () {
        const newConvertor = new Convertor(elseSchema);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties).to.have.property(
          "street_address"
        );
        expect(result.schemas.basic.properties).to.have.property("country");
        expect(result.schemas.basic).to.not.have.property("oneOf");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should remove a then keyword without an if", async function () {
        const newConvertor = new Convertor(thenSchema);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties).to.have.property(
          "street_address"
        );
        expect(result.schemas.basic.properties).to.have.property("country");
        expect(result.schemas.basic).to.not.have.property("oneOf");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe("dependencies schemas", () => {
      it("should convert a dependencies as Array schema", async function () {
        const newConvertor = new Convertor(dependenciesArray);
        const result = newConvertor.convert("basic");

        expect(result.schemas.basic.properties).to.have.property(
          "billing_address"
        );
        expect(result.schemas.basic.properties).to.have.property("credit_card");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert a dependencies as Schema schema", async function () {
        const newConvertor = new Convertor(dependenciesSchema);
        const result = newConvertor.convert("basic");

        expect(result.schemas.basic.properties).to.have.property("name");
        expect(result.schemas.basic.properties).to.have.property("credit_card");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert a dependentRequired", async function () {
        const newConvertor = new Convertor(dependentRequired);
        const result = newConvertor.convert("basic");

        expect(result.schemas.basic.properties).to.have.property("name");
        expect(result.schemas.basic.properties).to.have.property("credit_card");
        expect(result.schemas.basic.properties).to.have.property(
          "billing_address"
        );

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert a dependentSchemas", async function () {
        const newConvertor = new Convertor(dependentSchemas);
        const result = newConvertor.convert("basic");

        expect(result.schemas.basic.properties).to.have.property("name");
        expect(result.schemas.basic.properties).to.have.property("credit_card");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe("camelCased Keys", () => {
      it("should convert camelCasedKey correctly", async function () {
        const newConvertor = new Convertor(camelCased);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.name).to.not.have.property(
          "oneof"
        );
        expect(result.schemas.basic.properties.name).to.have.property("oneOf");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe("array keys", () => {
      it("should make sure expected array keys are actually arrays", async function () {
        const newConvertor = new Convertor(arrayKeyOneOf);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.name).to.have.property("oneOf");
        expect(result.schemas.basic.properties.name.oneOf).to.be.an("array");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe("anyOf and oneOf with an object of type null", () => {
      it("should convert an anyOf with a type of null", async function () {
        const newConvertor = new Convertor(anyOfNull);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.payment).to.have.property(
          "anyOf"
        );
        expect(result.schemas.basic.properties.payment.anyOf).to.be.an("array");
        expect(
          result.schemas.basic.properties.payment.anyOf.length
        ).to.be.equal(1);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it("should convert a oneOf with a type of null", async function () {
        const newConvertor = new Convertor(oneOfNull);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.payment).to.have.property(
          "oneOf"
        );
        expect(result.schemas.basic.properties.payment.oneOf).to.be.an("array");
        expect(
          result.schemas.basic.properties.payment.oneOf.length
        ).to.be.equal(1);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe(`properties that exist outside of a oneOf|anyOf|allOf`, function () {
      it(`should put the property outside of an oneOf into the oneOf`, async function () {
        const newConvertor = new Convertor(oneOfProperties);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.payment).to.have.property(
          "oneOf"
        );
        expect(result.schemas.basic.properties.payment.oneOf).to.be.an("array");
        expect(
          result.schemas.basic.properties.payment.oneOf.length
        ).to.be.equal(1);
        expect(result.schemas.basic.properties.payment).to.not.have.property(
          "default"
        );
        expect(
          result.schemas.basic.properties.payment.oneOf[0]
        ).to.have.property("default");
        expect(
          result.schemas.basic.properties.payment.oneOf[0].default
        ).to.be.equal("one");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it(`should put the property outside of an anyOf into the anyOf`, async function () {
        const newConvertor = new Convertor(anyOfProperties);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.payment).to.have.property(
          "anyOf"
        );
        expect(result.schemas.basic.properties.payment.anyOf).to.be.an("array");
        expect(
          result.schemas.basic.properties.payment.anyOf.length
        ).to.be.equal(2);
        expect(result.schemas.basic.properties.payment).to.not.have.property(
          "default"
        );
        expect(
          result.schemas.basic.properties.payment.anyOf[0]
        ).to.have.property("default");
        expect(
          result.schemas.basic.properties.payment.anyOf[0].default
        ).to.be.equal("one");
        expect(
          result.schemas.basic.properties.payment.anyOf[1]
        ).to.have.property("default");
        expect(
          result.schemas.basic.properties.payment.anyOf[1].default
        ).to.be.equal(1);

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });

      it(`should put the property outside of an allOf into the allOf`, async function () {
        const newConvertor = new Convertor(allOfProperties);
        const result = newConvertor.convert("basic");
        expect(result.schemas.basic.properties.payment).to.have.property(
          "allOf"
        );
        expect(result.schemas.basic.properties.payment.allOf).to.be.an("array");
        expect(
          result.schemas.basic.properties.payment.allOf.length
        ).to.be.equal(1);
        expect(result.schemas.basic.properties.payment).to.not.have.property(
          "default"
        );
        expect(
          result.schemas.basic.properties.payment.allOf[0]
        ).to.have.property("default");
        expect(
          result.schemas.basic.properties.payment.allOf[0].default
        ).to.be.equal("one");

        const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
        Object.assign(cloned, { components: result });
        expect(cloned).to.have.property("components");
        expect(cloned.components).to.have.property("schemas");
        expect(cloned.components.schemas).to.have.property("basic");
        let valid = await validator.validateInner(cloned, {});
        expect(valid).to.be.true;
      });
    });

    describe(`circular schemas`, function () {
      it(`should convert a circular schema`, async function () {
        const bundled = await $RefParser.bundle(circular);
        const dereferenced = await $RefParser.dereference(bundled);

        const newConvertor = new Convertor(dereferenced);
        const result = newConvertor.convert("basic");
        console.log(result);
      });
    });

    xdescribe("use a repo with lots of schemas to find failing ones", () => {
      it("should convert all schemas successfully", async function () {
        this.timeout(1000000);
        // these are mostly now failing because of things like missing types (which i need to decide how to deal with),
        // circular references that (?) that can't be handled by a JSON.parse(JSON.stringify(schema))
        // and a few where I am not correctly dereferencing them just yet (the azure ones reference each other)
        const bannedSchemas = listOfBannedSchemas;

        const url = `https://api.github.com/repos/SchemaStore/schemastore/contents/src/schemas/json`;
        const list = await fetch(url).then((res) => res.json());
        const rawURLs = list.map((item) => {
          return item.download_url;
        });

        for (const rawUrl of rawURLs) {
          console.log(rawUrl);
          if (bannedSchemas.includes(rawUrl) === false) {
            const data = await fetch(rawUrl)
              .then((res) => res.json())
              .catch((err) => {
                console.log(err);
                throw err;
              });
            const newSchema = await $RefParser.dereference(data, {});
            const convertor = new Convertor(newSchema);
            const result = convertor.convert("basic");
            // console.log(JSON.stringify(result))
            const cloned = JSON.parse(JSON.stringify(basicOpenAPI));
            // console.log(JSON.stringify(cloned))
            // let valid = await validator.validateInner(cloned, {})
            // expect(valid).to.be.true
            Object.assign(cloned, { components: result });
            let valid = await validator
              .validateInner(cloned, {})
              .catch((err) => {
                console.log(err);
                // console.log(JSON.stringify(data))
                // console.log(JSON.stringify(newSchema))
                // console.log(JSON.stringify(result))
                // console.log(JSON.stringify(cloned))
                throw err;
              });

            expect(valid).to.be.true;
          }
        }
      });
    });
  });
});
