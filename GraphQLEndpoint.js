const path = require('path');
const { graphQlTemplates } = require(path.join(__dirname, '..', '..', 'gridsome.config.js'));
const { existsSync } = require('fs')

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

    constructor(api, { url, fieldName, typeName, headers, slugName = 'slug' }) {
        const collectionsToMake = [];

        api.createManagedPages(async ({ graphql, createPage }) => {
            await Promise.all(
                Object.keys(graphQlTemplates)
                    .map(async (key) => {
                        graphQlTemplates[key].map(async (template) => {
                            const templatePath = template.component;
                            const templateExists = existsSync(templatePath);

                            if (!templateExists) {
                                return false;
                            }

                            const response = await graphql(`
                            query {
                                ${fieldName} {
                                    ${template.fieldName} {
                                        id
                                        ${template.slugName}
                                    }
                                }
                            }
                            `);

                            response.data[fieldName][template.fieldName].forEach(entry => {
                                const path = template.path.replace(':slug', entry[template.slugName]);
                                createPage({
                                    path,
                                    component: templatePath,
                                    context: {
                                        id: entry.id,
                                        slug: entry[template.slugName]
                                    }
                                });
                            });
                        });
                    })
            );
        });
    }
};
