'use strict'

const traverse = require('json-schema-traverse')
const {v4: uuid} = require('uuid')

class Convertor {
    constructor(schema = {}) {
        this.schema = JSON.parse(JSON.stringify(schema))

        this.camelCasedProperties = [
            'allOf',
            'oneOf',
            'anyOf',
            'additionalProperties',
            'multipleOf',
            'exclusiveMaximum',
            'exclusiveMinimum',
            'maxLength',
            'minLength',
            'maxItems',
            'minItems',
            'uniqueItems',
            'maxProperties',
            'minProperties',
            'readOnly',
            'writeOnly',
            'externalDocs',
        ]

        this.specialSchemaFields = [
            'type',
            'allOf',
            'oneOf',
            'anyOf',
            'not',
            'items',
            'properties',
            'additionalProperties',
            'description',
            'format',
            'default',
        ]

        let validSchemaFields = [
            'title',
            'multipleOf',
            'maximum',
            'exclusiveMaximum',
            'minimum',
            'exclusiveMinimum',
            'maxLength',
            'minLength',
            'pattern',
            'maxItems',
            'minItems',
            'uniqueItems',
            'maxProperties',
            'minProperties',
            'required',
            'enum',
            '$ref'
        ]

        let openAPISchemaFields = [
            'nullable',
            'discriminator',
            'readOnly',
            'writeOnly',
            'xml',
            'externalDocs',
            'example',
            'deprecated',
        ]

        this.validSchemaFields = validSchemaFields.concat(this.specialSchemaFields, openAPISchemaFields)

        this.components = {}
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
            this.parseSchema(schema)
            if (this.components.schemas) {
                Object.assign(this.components.schemas, {[name]: rootSchema})
            } else {
                Object.assign(this.components, {schemas: {[name]: rootSchema}})
            }

        }

        traverse(this.schema, traversal)
        return this.components
    }

    parseSchema(schema) {
        this.convertConst(schema)
        this.convertArrays(schema)
        this.convertIfThenElse(schema)
        this.convertTypeArrays(schema)
        this.dealWithCamelCase(schema)
        this.convertDependencies(schema)
        this.removeEmptyRequired(schema)
        this.convertNullProperty(schema)
        this.convertDefaultValues(schema)
        this.removeInvalidFields(schema)
    }

    removeEmptyRequired(schema) {
        if (schema.required && schema.required.length === 0)
            delete schema.required
    }

    removeInvalidFields(schema) {
        for (const key in schema) {
            if (this.validSchemaFields.includes(key) === false) {
                delete schema[key]
            }
        }
    }

    convertNullProperty(schema) {
        if (schema?.type === 'null') {
            schema.nullable = true
            delete schema.type
        }
    }

    convertTypeArrays(schema) {
        if (Array.isArray(schema.type)) {
            const oneOf = []
            let defaultValue
            let types = schema.type
            let removeeNum = false
            const nullable = types.includes('null')
            if (nullable === true) {
                types = types.filter(type => {
                    if (type !== 'null')
                        return type
                })
            }

            for (const type of types) {
                const newTypeObj = {}
                if (defaultValue !== undefined && type === typeof defaultValue && (typeof defaultValue === type || defaultValue === false && type === 'boolean')) {
                    newTypeObj.default = defaultValue
                }

                if (nullable === true) {
                    newTypeObj.nullable = true
                }

                newTypeObj.type = type

                if (schema.enum) {
                    removeeNum = true
                    const newEnum = []
                     schema.enum.forEach(enumType => {
                        if (type === typeof enumType)
                            newEnum.push(enumType)
                    })
                    newTypeObj.enum = newEnum
                }

                if (Object.keys(schema).includes('default')) {
                    defaultValue = schema.default
                    delete schema.default
                    if (type === typeof defaultValue || (typeof defaultValue === type || defaultValue === false && type === 'boolean'))
                        newTypeObj.default = defaultValue

                }

                for (const property of Object.keys(schema)) {
                    if (type === 'array' && property === 'items') {
                        newTypeObj.items = schema[property]
                        delete schema.items
                    }

                    if (type === 'object' && property === 'properties') {
                        newTypeObj.properties = schema[property]
                        delete schema.properties
                    }
                }


                oneOf.push(newTypeObj)
            }

            schema.oneOf = oneOf
            if (removeeNum)
                delete schema.enum
            delete schema.type
        }
    }

    convertDefaultValues(schema) {
        if (schema.type === 'object') {
            if (typeof schema.default === 'string') {
                const schemaDefault = {}
                // is it a property?
                if (Object.keys(schema.properties).includes(schema.default)) {
                    const schemaType = schema.properties[schema.default].type
                    switch (schemaType) {
                        case 'string':
                            Object.assign(schemaDefault, {[schema.default]: ''})
                            break;
                        case 'number':
                        case 'integer':
                            Object.assign(schemaDefault, {[schema.default]: 0})
                            break;
                        case 'array':
                            Object.assign(schemaDefault, {[schema.default]: []})
                            break;
                        case 'object':
                            Object.assign(schemaDefault, {[schema.default]: {}})
                            break;
                        case 'boolean':
                            Object.assign(schemaDefault, {[schema.default]: true})
                            break;
                    }
                    schema.default = schemaDefault
                }
            }
        }

        if (schema.type === 'array') {
            if (schema.items === undefined) {
                schema.items = {nullable: true}
            }

            if (schema.default && Array.isArray(schema.default) === false) {
                schema.default = [schema.default]
            }
        }

        if (schema.type === 'boolean') {
            if (schema.default === 'true' || schema.default === 'false') {
                if (schema.default === 'true')
                    schema.default = true
                else
                    schema.default = false
            }
        }

        if (schema.type === 'number' || schema.type === 'integer') {
            if (typeof schema.default === 'string') {
                schema.default = parseInt(schema.default, 10) || 1
            }
        }

        if (schema.type === 'string') {
            if (Object.keys(schema).indexOf('default') !== -1) {
                schema.default = `${schema.default}`
            }
        }
    }

    convertArrays(schema) {
        if (Array.isArray(schema.items)) {
            const obj = {}
            Object.assign(obj, schema.items[0])
            schema.items = obj
        }
    }

    convertConst(schema) {
        if (schema.const) {
            schema.enum = [schema.const]
            delete schema.const
        }
    }

    convertIfThenElse(schema) {
        if (schema?.if && (schema?.then || schema?.else)) {
            const ifSchemaRefName = `if-${uuid()}`

            const traversal = (
                schema,
                jsonPointer,
                rootSchema,
                parentJSONPointer,
                parentKeyword,
                parentSchema,
                property
            ) => {
                this.parseSchema(schema)
            }

            traverse(schema.if, traversal)

            if (this.components.schemas) {
                Object.assign(this.components.schemas, {[ifSchemaRefName]: schema.if})
            } else {
                Object.assign(this.components, {schemas: {[ifSchemaRefName]: schema.if}})
            }

            if (schema?.then && schema?.else) {
                let oneOf = []
                if (schema.then) {
                    oneOf.push({
                        allOf: [
                            {
                                $ref: `#/components/schemas/${ifSchemaRefName}`,
                            },
                            schema.then
                        ]
                    })
                }

                if (schema.else) {
                    oneOf.push({
                        allOf: [
                            {
                                not: {
                                    $ref: `#/components/schemas/${ifSchemaRefName}`
                                },
                            },
                            schema.else
                        ]
                    })
                }
                schema.oneOf = oneOf
            }
        }

        delete schema.if
        delete schema.then
        delete schema.else
    }

    dealWithCamelCase(schema) {
        for (const key of Object.keys(schema)) {
            const camelCasedKey = this.camelCasedProperties.filter(camelCasedKey => {
                if (key.toLowerCase() === camelCasedKey.toLowerCase()) {
                    return camelCasedKey
                }
            })

            if (camelCasedKey.length && camelCasedKey[0] !== key) {
                schema[camelCasedKey[0]] = schema[key]
                delete schema[key]
            }
        }
    }

    convertDependencies(schema) {
        if (schema.dependencies || schema.dependentSchemas || schema.dependentRequired) {
            const allOf = []
            const anyOf = []
            if (schema.dependentSchemas)
                schema.dependencies = JSON.parse(JSON.stringify(schema.dependentSchemas))
            else if (schema.dependentRequired)
                schema.dependencies = JSON.parse(JSON.stringify(schema.dependentRequired))

            for (const key of Object.keys(schema.dependencies)) {
                if (typeof schema.dependencies[key] === 'object' && Array.isArray(schema.dependencies[key]) === false) {
                    const anyOf = []
                    const notObj = {
                        not: {
                            required: [key]
                        }
                    }
                    anyOf.push(notObj)

                    const newDep = Object.assign({}, schema.dependencies[key])
                    anyOf.push(newDep)
                    allOf.push({anyOf})
                } else {
                    const notObj = {
                        not: {
                            required: [key]
                        }
                    }
                    anyOf.push(notObj)
                    const newReq = {
                        required: [schema.dependencies[key]]
                    }
                    anyOf.push(newReq)
                }
            }
            if (allOf.length)
                schema.allOf = allOf
            else
                schema.anyOf = anyOf
        }
    }
}

module.exports = Convertor
