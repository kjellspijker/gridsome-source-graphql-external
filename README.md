# Gridsome-source-graphql-external

A gridsome plugin to use external GraphQL endpoints with the templating functionality of Gridsome.

To use this plugin, add the following to your `gridsome.config.js`: 
```javascript
module.exports = {
    plugins: [
        {
            use: 'gridsome-source-graphql-external',
            options: {
                url: 'https://blauwwit-cms.dev.test/graphql',
                fieldName: 'puppies',
                typeName: 'puppyTypes',
                headers: {
                    Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
                },
                slugName: 'slug'
            }
        }
    ],
    graphQlTemplates: {
        Article: [
            {
                path: '/news/:slug',
                component: './src/templates/NewsArticle.vue',
                fieldName: 'articles'
            }
        ]
    }
}
```

## GraphQLTemplates

To make a difference between the regular templates that Gridsome uses, and the ones that should be loaded with this plugin, add the `graphQlTemplates` object to your `gridsome.config.js`.

The syntax of these items has been set to be similar to the regular Gridsome templates, but the following fields **must** be specified:

_**NOTE:** keep in mind that the keys (in the example above `Article`) are added for the clarification of the developers. They currently serve no purpose, but they must exist to keep the structure of the object valid._

### path

- Type: `string` _required_

The path that the template will use to build the URL.

### component

- Type: `string` _required_

The component that the template will use.

### fieldName

- Type: `string` _required_

The name of the field that is used in your graphqlQuery to get the data neccessary.

For example, if you would normally run the following query to get your data:
```graphql
query {
    dogs {
        name
    }
}
``` 
The value of `fieldName` would, in this case, be `dogs`.

## Options

The options of this plugin refer back to the options of the [@gridsome/source-graphql](https://gridsome.org/@gridsome/source-graphql) plugin.

#### url

- Type: `string` _required_

The URL of a GraphQL API endpoint to request your schema from.

#### fieldName

- Type: `string` _required_

The name that should be used to namespace your remote schema when it's merged in, so that it doesn't conflict with any local data.

For instance, if you put "puppies" your remote schema's data will be available by querying like so:

```
query {
  puppies {
    helloWorld
  }
}
```

#### typeName

- Type: `string`
- Defaults: `fieldName`

The prefix to be used for your imported schema's field types.

#### headers

- Type: `object`

An object of headers to be passed along with your request to the API endpoint. This will generally be used to authenticate your request.

**Note**: For safety, you should pass any sensitive tokens/passwords as environmental variables. To learn more, see the [Gridsome Docs on Environmental Variables](https://gridsome.org/docs/environment-variables/).
