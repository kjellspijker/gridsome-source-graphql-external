const {introspectSchema} = require('graphql-tools');
const fetch = require('node-fetch');
const {createHttpLink} = require('apollo-link-http');
const path = require('path');
const {templates} = require(path.join(__dirname, '..', '..', 'gridsome.config.js'));

module.exports = class GraphQLEndpoint {
    static defaultOptions() {
        return {
            url: undefined,
            fieldName: undefined,
            typeName: undefined,
            headers: {}
        };
    }

    constructor(api, {url, fieldName, typeName, headers}) {
        const collectionsToMake = {};
        for (const template of Object.keys(templates)) {
            const entry = templates[template];
            for (const entryElement of entry) {
                if (entryElement.hasOwnProperty('externalGraphQL')) {
                    collectionsToMake[entryElement.externalGraphQL] = false;
                }
            }
        }

        api.loadSource(async (actions) => {
            const introspection = await introspectSchema(createHttpLink({uri: url, fetch}));
            const introspectionFields = introspection._queryType._fields;

            for (const introspectionElement of Object.keys(introspectionFields)) {
                let collectionName = introspectionElement;
                let shouldContinue = true;
                for (const template of Object.keys(templates)) {
                    for (const item of templates[template]) {
                        if (item.hasOwnProperty('externalGraphQL') && introspectionElement === item.externalGraphQL) {
                            shouldContinue = false;
                            collectionName = template;
                        }
                    }
                }
                if (shouldContinue) {
                    continue;
                }

                const fields = this.getFieldsOfType(introspectionFields[introspectionElement]);

                let query = '{ ' + introspectionElement + ' { ';
                for (const field of fields) {
                    query += field + ' ';
                }
                query += '} }';

                const {data} = await (await fetch(url, {
                    method: 'post',
                    body: JSON.stringify({query}),
                    headers: {'Content-Type': 'application/json'},
                })).json();

                const collection = actions.addCollection(collectionName);
                const items = data[introspectionElement];

                // TODO figure out if this is actually what I want (or check on types)
                // TODO issue is that queries break when there is no data in the table
                if (items.length === 0) {
                    const node = {};
                    for (const field of fields) {
                        node[field] = 'null';
                    }
                    items.push(node);
                }

                for (const item of items) {
                    collection.addNode(item);
                }
            }
        });
    }

    getFieldsOfType(obj) {
        let types = obj.type;
        while (!types.hasOwnProperty('_fields')) {
            types = types.ofType;
        }
        const output = [];
        for (const type of Object.keys(types._fields)) {
            output.push(types._fields[type].name);
        }
        return output;
    }
};