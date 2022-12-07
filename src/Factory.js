'use strict'

const Convertor = require('./Convertor')

class SchemaFactory {
    constructor() {}

    static convert(schema, name = 'mainSchema') {
        const convertedSchema = new Convertor(schema)
        return convertedSchema.convert(name)
    }
}

module.exports = SchemaFactory
