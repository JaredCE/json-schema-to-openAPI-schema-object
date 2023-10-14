"use strict";

const traverse = require("json-schema-traverse");
const { v4: uuid } = require("uuid");
const cloneDeep = require("lodash.clonedeep");
const packageData = require("../package.json");

class Convertor {
  constructor(schema = {}) {
    this.schema = cloneDeep(schema);

    this.camelCasedProperties = [
      "allOf",
      "oneOf",
      "anyOf",
      "additionalProperties",
      "multipleOf",
      "exclusiveMaximum",
      "exclusiveMinimum",
      "maxLength",
      "minLength",
      "maxItems",
      "minItems",
      "uniqueItems",
      "maxProperties",
      "minProperties",
      "readOnly",
      "writeOnly",
      "externalDocs",
    ];

    this.arrayFields = ["allOf", "oneOf", "anyOf", "enum", "required"];

    this.specialSchemaFields = [
      "type",
      "allOf",
      "oneOf",
      "anyOf",
      "not",
      "items",
      "properties",
      "additionalProperties",
      "description",
      "format",
      "default",
    ];

    let validSchemaFields = [
      "title",
      "multipleOf",
      "maximum",
      "exclusiveMaximum",
      "minimum",
      "exclusiveMinimum",
      "maxLength",
      "minLength",
      "pattern",
      "maxItems",
      "minItems",
      "uniqueItems",
      "maxProperties",
      "minProperties",
      "required",
      "enum",
      "$ref",
    ];

    let openAPISchemaFields = [
      "nullable",
      "discriminator",
      "readOnly",
      "writeOnly",
      "xml",
      "externalDocs",
      "example",
      "deprecated",
    ];

    this.validSchemaFields = validSchemaFields.concat(
      this.specialSchemaFields,
      openAPISchemaFields
    );

    this.components = {};
  }

  convert(name) {
    const traversal = (
      schema,
      jsonPointer,
      rootSchema,
      parentJSONPointer,
      parentKeyword,
      parentSchema,
      property
    ) => {
      this.parseSchema(schema);

      if (this.components.schemas) {
        Object.assign(this.components.schemas, { [name]: rootSchema });
      } else {
        Object.assign(this.components, { schemas: { [name]: rootSchema } });
      }
    };

    this.closeCircularReferences();
    traverse(this.schema, traversal);
    return this.components;
  }

  closeCircularReferences() {
    const report = this.isCyclic(this.schema, true);
    let seenSchemas = new WeakMap();
    let i = 0;
    for (const reportDetail of report) {
      try {
        const dupeName = `cyclic_${i}`;
        if (seenSchemas.has(reportDetail.instance)) {
          const value = {
            $ref: `#/components/schemas/${seenSchemas.get(
              reportDetail.instance
            )}`,
          };

          this.closingTheCircle(this.schema, reportDetail.duplicate, value);
        } else {
          seenSchemas.set(reportDetail.instance, dupeName);
          this.addToComponents(dupeName, reportDetail.instance);
          const value = { $ref: `#/components/schemas/${dupeName}` };
          this.closingTheCircle(this.schema, reportDetail.duplicate, value);
        }
        i++;
      } catch (err) {
        console.error(err);
        throw err;
      }
    }
  }

  closingTheCircle(obj, is, value) {
    if (typeof is == "string")
      return this.closingTheCircle(obj, is.split("."), value);
    else if (is.length == 1 && value !== undefined) return (obj[is[0]] = value);
    else if (is.length == 0) return obj;
    else return this.closingTheCircle(obj[is[0]], is.slice(1), value);
  }

  parseSchema(schema) {
    this.convertConst(schema);
    this.convertArrays(schema);
    this.convertIfThenElse(schema);
    this.convertTypeArrays(schema);
    this.dealWithCamelCase(schema);
    this.ensureArrayFields(schema);
    this.convertDependencies(schema);
    this.removeEmptyRequired(schema);
    this.convertNullProperty(schema);
    this.convertDefaultValues(schema);
    this.pullOrphanedPropertiesIntoOneAnyAllOf(schema);
    this.convertOneOfAnyOfNulls(schema);
    this.removeInvalidFields(schema);
  }

  removeEmptyRequired(schema) {
    if (schema.required && schema.required.length === 0) delete schema.required;
  }

  removeInvalidFields(schema) {
    for (const key in schema) {
      if (this.validSchemaFields.includes(key) === false) {
        delete schema[key];
      }
    }
  }

  convertNullProperty(schema) {
    if (schema?.type === "null") {
      schema.nullable = true;
      delete schema.type;
    }
  }

  convertTypeArrays(schema) {
    if (Array.isArray(schema.type)) {
      const oneOf = [];
      let defaultValue;
      let types = schema.type;
      let removeeNum = false;
      const nullable = types.includes("null");
      if (nullable === true) {
        types = types.filter((type) => {
          if (type !== "null") return type;
        });
      }

      for (const type of types) {
        const newTypeObj = {};
        if (
          defaultValue !== undefined &&
          type === typeof defaultValue &&
          (typeof defaultValue === type ||
            (defaultValue === false && type === "boolean"))
        ) {
          newTypeObj.default = defaultValue;
        }

        if (nullable === true) {
          newTypeObj.nullable = true;
        }

        newTypeObj.type = type;

        if (schema.enum) {
          removeeNum = true;
          const newEnum = [];
          schema.enum.forEach((enumType) => {
            if (type === typeof enumType) newEnum.push(enumType);
          });
          newTypeObj.enum = newEnum;
        }

        if (Object.keys(schema).includes("default")) {
          defaultValue = schema.default;
          delete schema.default;
          if (
            type === typeof defaultValue ||
            typeof defaultValue === type ||
            (defaultValue === false && type === "boolean")
          )
            newTypeObj.default = defaultValue;
        }

        for (const property of Object.keys(schema)) {
          if (type === "array" && property === "items") {
            newTypeObj.items = schema[property];
            delete schema.items;
          }

          if (type === "object" && property === "properties") {
            newTypeObj.properties = schema[property];
            delete schema.properties;
          }
        }

        oneOf.push(newTypeObj);
      }

      schema.oneOf = oneOf;
      if (removeeNum) delete schema.enum;
      delete schema.type;
    }
  }

  convertDefaultValues(schema) {
    if (schema.type === "object") {
      if (typeof schema.default === "string") {
        const schemaDefault = {};
        // is it a property?
        if (Object.keys(schema.properties).includes(schema.default)) {
          const schemaType = schema.properties[schema.default].type;
          switch (schemaType) {
            case "string":
              Object.assign(schemaDefault, { [schema.default]: "" });
              break;
            case "number":
            case "integer":
              Object.assign(schemaDefault, { [schema.default]: 0 });
              break;
            case "array":
              Object.assign(schemaDefault, { [schema.default]: [] });
              break;
            case "object":
              Object.assign(schemaDefault, { [schema.default]: {} });
              break;
            case "boolean":
              Object.assign(schemaDefault, { [schema.default]: true });
              break;
          }
          schema.default = schemaDefault;
        }
      }
    }

    if (schema.type === "array") {
      if (schema.items === undefined) {
        schema.items = { nullable: true };
      }

      if (schema.default && Array.isArray(schema.default) === false) {
        schema.default = [schema.default];
      }
    }

    if (schema.type === "boolean") {
      if (schema.default === "true" || schema.default === "false") {
        if (schema.default === "true") schema.default = true;
        else schema.default = false;
      }
    }

    if (schema.type === "number" || schema.type === "integer") {
      if (typeof schema.default === "string") {
        schema.default = parseInt(schema.default, 10) || 1;
      }
    }

    if (schema.type === "string") {
      if (Object.keys(schema).indexOf("default") !== -1) {
        schema.default = `${schema.default}`;
      }
    }
  }

  convertArrays(schema) {
    if (Array.isArray(schema.items)) {
      const obj = {};
      Object.assign(obj, schema.items[0]);
      schema.items = obj;
    }
  }

  convertConst(schema) {
    if (schema.const) {
      schema.enum = [schema.const];
      delete schema.const;
    }
  }

  convertIfThenElse(schema) {
    if (schema?.if && (schema?.then || schema?.else)) {
      const ifSchemaRefName = `if-${uuid()}`;

      const traversal = (
        schema,
        jsonPointer,
        rootSchema,
        parentJSONPointer,
        parentKeyword,
        parentSchema,
        property
      ) => {
        this.parseSchema(schema);
      };

      traverse(schema.if, traversal);

      // if (this.components.schemas) {
      //   Object.assign(this.components.schemas, {
      //     [ifSchemaRefName]: schema.if,
      //   });
      // } else {
      //   Object.assign(this.components, {
      //     schemas: { [ifSchemaRefName]: schema.if },
      //   });
      // }
      this.addToComponents(ifSchemaRefName, schema.if);

      if (schema?.then || schema?.else) {
        let oneOf = [];
        if (schema.then) {
          oneOf.push({
            allOf: [
              {
                $ref: `#/components/schemas/${ifSchemaRefName}`,
              },
              schema.then,
            ],
          });
        }

        if (schema.else) {
          oneOf.push({
            allOf: [
              {
                not: {
                  $ref: `#/components/schemas/${ifSchemaRefName}`,
                },
              },
              schema.else,
            ],
          });
        }
        schema.oneOf = oneOf;
      }
    }

    delete schema.if;
    delete schema.then;
    delete schema.else;
  }

  dealWithCamelCase(schema) {
    for (const key of Object.keys(schema)) {
      const camelCasedKey = this.camelCasedProperties.filter(
        (camelCasedKey) => {
          if (key.toLowerCase() === camelCasedKey.toLowerCase()) {
            return camelCasedKey;
          }
        }
      );

      if (camelCasedKey.length && camelCasedKey[0] !== key) {
        schema[camelCasedKey[0]] = schema[key];
        delete schema[key];
      }
    }
  }

  ensureArrayFields(schema) {
    for (const key of Object.keys(schema)) {
      const arrayField = this.arrayFields.filter((field) => {
        if (key.toLowerCase() === field.toLowerCase()) {
          return field;
        }
      });

      if (arrayField.length && Array.isArray(schema[key]) === false) {
        schema[arrayField] = [schema[key]];
      }
    }
  }

  convertDependencies(schema) {
    if (
      schema.dependencies ||
      schema.dependentSchemas ||
      schema.dependentRequired
    ) {
      const allOf = [];
      const anyOf = [];
      if (schema.dependentSchemas)
        schema.dependencies = cloneDeep(schema.dependentSchemas);
      else if (schema.dependentRequired)
        schema.dependencies = cloneDeep(schema.dependentRequired);

      for (const key of Object.keys(schema.dependencies)) {
        if (
          typeof schema.dependencies[key] === "object" &&
          Array.isArray(schema.dependencies[key]) === false
        ) {
          const anyOf = [];
          const notObj = {
            not: {
              required: [key],
            },
          };
          anyOf.push(notObj);

          const newDep = Object.assign({}, schema.dependencies[key]);
          anyOf.push(newDep);
          allOf.push({ anyOf });
        } else {
          const notObj = {
            not: {
              required: [key],
            },
          };
          anyOf.push(notObj);
          const newReq = {
            required: [schema.dependencies[key]],
          };
          anyOf.push(newReq);
        }
      }
      if (allOf.length) schema.allOf = allOf;
      else schema.anyOf = anyOf;
    }
  }

  convertOneOfAnyOfNulls(schema) {
    if (schema.oneOf || schema.anyOf) {
      const isOneOf = Boolean(schema.oneOf);
      const schemaOf = schema.oneOf || schema.anyOf;
      const hasNullType = schemaOf.some((obj) => {
        if (obj.type === "null") return true;
      });

      if (hasNullType) {
        schemaOf.forEach((obj) => {
          if (obj.type !== "null") {
            obj.nullable = true;
          }
        });
        const newOf = schemaOf.filter((obj) => {
          if (obj.type !== "null") return obj;
        });

        if (isOneOf) {
          schema.oneOf = newOf;
        } else {
          schema.anyOf = newOf;
        }
      }
    }
  }

  pullOrphanedPropertiesIntoOneAnyAllOf(schema) {
    const properties = ["default"];

    const addItem = (intersection, schemaOf) => {
      for (const property of intersection) {
        for (const item of schemaOf) {
          item[property] = schema[property];
        }
      }
    };

    if (schema.allOf || schema.anyOf || schema.oneOf) {
      const intersection = Object.keys(schema).filter((property) =>
        properties.includes(property)
      );

      if (intersection.length) {
        if (schema.allOf) {
          addItem(intersection, schema.allOf);
        } else if (schema.oneOf) {
          addItem(intersection, schema.oneOf);
        } else {
          addItem(intersection, schema.anyOf);
        }
      }

      for (const property of intersection) {
        delete schema[property];
      }
    }
  }

  isCyclic(x, bReturnReport) {
    let a_sKeys = [],
      a_oStack = [],
      wm_oSeenObjects = new WeakMap(), //# see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
      oReturnVal = {
        found: false,
        report: [],
      };
    //# Setup the recursive logic to locate any circular references while kicking off the initial call
    (function doIsCyclic(oTarget, sKey) {
      let a_sTargetKeys, sCurrentKey, i;

      //# If we've seen this oTarget before, flip our .found to true
      if (wm_oSeenObjects.has(oTarget)) {
        oReturnVal.found = true;

        //# If we are to bReturnReport, add the entries into our .report
        if (bReturnReport) {
          oReturnVal.report.push({
            instance: oTarget,
            source: a_sKeys.slice(0, a_oStack.indexOf(oTarget) + 1).join("."),
            duplicate: a_sKeys.join(".") + "." + sKey,
          });
        }
      }
      //# Else if oTarget is an instanceof Object, determine the a_sTargetKeys and .set our oTarget into the wm_oSeenObjects
      else if (oTarget instanceof Object) {
        a_sTargetKeys = Object.keys(oTarget);
        wm_oSeenObjects.set(oTarget /*, undefined*/);

        //# If we are to bReturnReport, .push the  current level's/call's items onto our stacks
        if (bReturnReport) {
          if (sKey) {
            a_sKeys.push(sKey);
          }
          a_oStack.push(oTarget);
        }

        //# Traverse the a_sTargetKeys, pulling each into sCurrentKey as we go
        //#     NOTE: If you want all properties, even non-enumerables, see Object.getOwnPropertyNames() so there is no need to call .hasOwnProperty (per: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys)
        for (i = 0; i < a_sTargetKeys.length; i++) {
          sCurrentKey = a_sTargetKeys[i];

          //# If we've already .found a circular reference and we're not bReturnReport, fall from the loop
          if (oReturnVal.found && !bReturnReport) {
            break;
          }
          //# Else if the sCurrentKey is an instanceof Object, recurse to test
          else if (oTarget[sCurrentKey] instanceof Object) {
            doIsCyclic(oTarget[sCurrentKey], sCurrentKey);
          }
        }

        //# .delete our oTarget into the wm_oSeenObjects
        wm_oSeenObjects.delete(oTarget);

        //# If we are to bReturnReport, .pop the current level's/call's items off our stacks
        if (bReturnReport) {
          if (sKey) {
            a_sKeys.pop();
          }
          a_oStack.pop();
        }
      }
    })(x, ""); //# doIsCyclic

    return bReturnReport ? oReturnVal.report : oReturnVal.found;
  }

  addToComponents(schemaRefName, schema) {
    if (this.components.schemas) {
      Object.assign(this.components.schemas, {
        [schemaRefName]: schema,
      });
    } else {
      Object.assign(this.components, {
        schemas: { [schemaRefName]: schema },
      });
    }
  }
}

module.exports = Convertor;
