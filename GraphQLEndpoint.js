const {ApolloClient} = require('apollo-client');
const gql = require('graphql-tag');
const {InMemoryCache} = require('apollo-cache-inmemory');
const {HttpLink} = require('apollo-link-http');
const {buildClientSchema, printSchema} = require('graphql/utilities');
const fs = require('fs');
const {introspectionQuery} = require('graphql');
const fetch = require('node-fetch');
const path = require('path');
const {templates} = require(path.join(__dirname, '..', '..', 'gridsome.config.js'));
const easygraphqlSchemaParser = require('easygraphql-parser');

module.exports = class GraphQLEndpoint {
    static defaultOptions() {
        return {
            url: undefined,
            fieldName: undefined,
            typeName: undefined,
            headers: {},
            options: {
                useGetForQueries: false
            }
        };
    }

    constructor(api, {url, fieldName, typeName, headers, options}) {
        this.url = url;
        const collectionsToMake = [];
        for (const template of Object.keys(templates)) {
            const entry = templates[template];
            for (const entryElement of entry) {
                if (entryElement.hasOwnProperty('externalGraphQL')) {
                    collectionsToMake.push(entryElement.externalGraphQL);
                }
            }
        }

        api.loadSource(async (actions) => {
            const res = await fetch(url, {
                method: 'post',
                body: JSON.stringify({query: introspectionQuery}),
            });

            const queries = {};

            const schema = await this.buildGraphqlFile((await res.json()).data);

            const ast = easygraphqlSchemaParser(schema);

            const link = new HttpLink({
                headers,
                useGETForQueries: options.useGetForQueries,
                fetch,
                uri: url
            });
            const client = new ApolloClient({
                cache: new InMemoryCache(),
                link,
            });

            for (const typeName of collectionsToMake) {
                const query = this.startQuery(ast, typeName);
                debugger
                const res = await client.query({
                    query: gql(query),
                });
                const collection = actions.addCollection(typeName);
                for (const item of res.data[typeName]) {
                    collection.addNode(item);
                }
            }
            debugger

        });
    }

    startQuery(ast, typeName) {
        return '{ ' + typeName + ' ' + this.makeQuery(ast, typeName, new Set()) + ' }'
    }

    makeQuery(ast, typeName, visited) {
        let query = '';
        if (!visited.has(typeName) && ast.hasOwnProperty(typeName)) {
            visited.add(typeName);
            query += `{`;

            const type = ast[typeName];
            if (type.hasOwnProperty('fields')) {
                for (const field of type.fields) {
                    if (ast.hasOwnProperty(field.type)) {
                        if (visited.has(field.type)) {
                            continue;
                        }
                        query += ' ' + field.name + ' ' + this.makeQuery(ast, field.type, visited);
                    } else {
                        query += ' ' + field.name;
                    }
                }
            }

            query += ' }';
        } else if (visited.has(typeName)) {
            return '';
        }
        visited.delete(typeName);
        return query;
    }

    async buildGraphqlFile(introspectionFields) {
        const schema = buildClientSchema(introspectionFields);
        const print = printSchema(schema);
        if (process.env.NODE_ENV === 'development') {
            fs.writeFileSync('gridsome-source-graphql-external.gql', print);
        }
        return print;
    }
};
