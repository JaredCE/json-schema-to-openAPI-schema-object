![Node.js CI](https://github.com/JaredCE/json-schema-to-openAPI-schema-object/actions/workflows/node.js.yml/badge.svg)
![version](https://img.shields.io/npm/v/json-schema-for-openapi.svg?style=flat-square)


# json-schema-for-openapi

Converts a standard [JSON Schema](https://json-schema.org/understanding-json-schema/index.html) to a compatible [OpenAPI v3.0.X Schema Object](https://spec.openapis.org/oas/v3.0.3#schema-object).

As of version 0.3.0, it is now advised to run a schema through a de-referencer like: https://apitools.dev/json-schema-ref-parser/ to properly deal with `$ref`.  I have removed my own poor implementation of de-referencing JSON schemas since there are libraries that can do it better than I can.

## Conversions

This attempts to massage the standard JSON Schema to a compatible OpenAPI v3.0.X Schema Object.  There are many properties that are not supported by OpenAPI v3.0.X Schema Object, though have now been supported by [OpenAPI v3.1.X](https://spec.openapis.org/oas/v3.1.0#schema-object).  This library should only be used if working with OpenAPI v3.0.X.

## Installation and Usage:

Install via npm: `npm install json-schema-for-openapi`.

And use as a Factory like:

```js
const ConvertorFactory = require('json-schema-for-openapi')
const jsonSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "JSON API Schema",
    "description": "This is a schema for responses in the JSON API format. For more, see http://jsonapi.org",
    "type": "object",
    "properties": {
        "errors": {
            "type": "object"
        }
    }
}
const convertedSchema = ConvertorFactory.convert(jsonSchema, 'main')
```

which will output:

```json
{
    "schemas": {
        "main": {
            "title": "JSON API Schema",
            "description": "This is a schema for responses in the JSON API format. For more, see http://jsonapi.org",
            "type": "object",
            "properties": {
                "errors": {
                    "type": "object"
                }
            }
        }
    }
}
```
