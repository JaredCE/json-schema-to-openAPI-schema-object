'use strict'

const Convertor = require('./Convertor')

class SchemaFactory {
    constructor() {}

    static convert(schema) {
        const convertedSchema = new Convertor(schema)
        return convertedSchema.convert()
    }
}

module.exports = SchemaFactory