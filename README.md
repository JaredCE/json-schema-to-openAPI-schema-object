# json-schema-to-openAPI-schema-object

Converts a standard JSON Schema to a compatible Open API v3 Schema Object

A json schema with definitions can be converted to an OpenAPI components object containing the main schema and the definitions:

**simple.schema.json**
```
{
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "JSON API Schema",
    "description": "This is a schema for responses in the JSON API format. For more, see http://jsonapi.org",
    "type": "object",
    "required": [
        "errors"
    ],
    "properties": {
        "errors": {
            "type": "object",
            "properties": {
                "message": {
                    "allOf": [
                        {
                            "$ref": "#/definitions/message"
                        }
                    ]
                }
            }
        }
    },
    "definitions": {
        "message": {
            "type": "string"
        }
    }
}
```

This will return an object:

```
{
  schemas: {
    message: {
      "type": "string"
    }
    main: {
      "title": "JSON API Schema",
      "description": "This is a schema for responses in the JSON API format. For more, see http://jsonapi.org",
      "type": "object",
      "required": [
          "errors"
      ],
      "properties": {
          "errors": {
              "type": "object",
              "properties": {
                  "message": {
                      "allOf": [
                          {
                              "$ref": "#/components/schemas/message"
                          }
                      ]
                  }
              }
          }
      }
    }
  }
}
```

To run:

```
const jsonSchema = require('simple.json.schema')
const Convertor = require('index')

const complexConvertor = new Convertor(complexOneOfSchema)
const components = complexConvertor.convert()
```
