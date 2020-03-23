const GraphQLSource = require('@gridsome/source-graphql');
const GraphQLEndpoint = require('./GraphQLEndpoint');

module.exports = (api, options) => {
    if (!options.url) {
        throw new Error('Missing url option.');
    }

    if (!options.fieldName) {
        throw new Error('Missing fieldName option.');
    }

    if (!options.typeName) {
        options.typeName = options.fieldName;
    }

    new GraphQLSource(api, options);
    new GraphQLEndpoint(api, options);
};