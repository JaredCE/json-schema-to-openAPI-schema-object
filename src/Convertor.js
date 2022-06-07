'use strict'

const traverse = require('json-schema-traverse')
const {v4: uuid} = require('uuid')

class Convertor {
    constructor(schema) {
        this.schema = JSON.parse(JSON.stringify(schema))

        // this.specialProperties = ['allOf', 'oneOf', 'anyOf', 'not', 'items', 'properties', 'additionalProperties']
        this.specialProperties = ['allOf', 'anyOf', 'items', 'oneOf', 'not', 'properties']
        this.ofProperties = ['allOf', 'anyOf', 'oneOf']
        this.referencedSchemas = {}
        this.bannedKeyWords = ['$schema', '$comment', '$id', 'version', 'examples']

        this.components = {
            schemas: {}
        }
    }

    convert() {
        const traversal = (
            schema,
            jsonPointer,
            rootSchema,
            parentJSONPointer,
            parentKeyword,
            parentSchema,
            property
        ) => {
            const inJSONLink = new RegExp('#[\/a-zA-Z0-9]+', 'g')
            const refExtraction = (properties) => {
                const path = properties['$ref'].split('/')
                const pathEnd = path[path.length-1]
                const newPath = `#/components/schemas/${pathEnd}`
                if (Object.keys(this.referencedSchemas).includes(newPath) === false) {
                    Object.assign(this.referencedSchemas, {[newPath]: properties['$ref']})
                    path.shift()
                    const objPath = path.join('.')
                    const newField = objPath.split('.').reduce((p,c)=>p&&p[c], rootSchema)
                    Object.assign(this.components.schemas, {[pathEnd]: newField})
                    properties['$ref'] = newPath
                } else {
                    properties['$ref'] = newPath
                }
            }

            const bannedWordsRemoval = () => {
                if (Object.keys(schema).some(item => this.bannedKeyWords.includes(item))) {
                    for (const bannedWord of this.bannedKeyWords) {
                        delete schema[bannedWord]
                    }
                }
            }

            bannedWordsRemoval()
            
            const convertNull = () => {
                if (schema.type === 'null') {
                    schema.nullable = true
                    delete schema.type
                }
            }

            convertNull()

            if (this.specialProperties.indexOf(parentKeyword) !== -1) {
                if (this.ofProperties.indexOf(parentKeyword) !== -1) {
                    for (const properties of parentSchema[parentKeyword]) {
                        if (properties['$ref'] && inJSONLink.test(properties['$ref'])) {
                            refExtraction(properties)
                        } else {
                            bannedWordsRemoval()
                        }
                    }
                } else {
                    if (
                        schema['$ref'] &&
                        inJSONLink.test(schema['$ref'])
                    ) {
                        refExtraction(schema)
                    } else {
                        bannedWordsRemoval()
                    }
                }
            }
        }

        traverse(this.schema, traversal)

        for (const [key, value] of Object.entries(this.referencedSchemas)) {
            const path = value.split('/').slice(1)
            const pathKey = path.pop()
            delete path.reduce((previous, current) => previous[current], this.schema)[pathKey]
        }

        this.removeEmpty(this.schema)

        // force remove definitions
        if (this.schema.definitions)
            delete this.schema.definitions

        if (Object.keys(this.components).includes('main') === false) {
            Object.assign(this.components.schemas, {'main': this.schema})
        } else {
            Object.assign(this.components.schemas, {[`main-${uuid()}`]: this.schema})
        }

        return this.components
    }

    removeEmpty(schema) {
        Object.keys(schema).forEach(key => {
            if (schema[key] 
                && typeof schema[key] === 'object'
                && this.removeEmpty(schema[key]) === null) {
                delete schema[key]
            }
        })

        if (Object.keys(schema).length === 0) {
            return null
        }
    }
}

module.exports = Convertor
