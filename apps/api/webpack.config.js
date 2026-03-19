const nodeExternals = require('webpack-node-externals');
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = function (options, webpack) {
    return {
        ...options,
        externals: [
            nodeExternals({
                modulesDir: path.resolve(__dirname, '../../node_modules'),
                allowlist: ['webpack/hot/poll?100', /^@poker\/shared/, /^@prisma\/adapter-pg/],
            }),
        ],
        resolve: {
            ...options.resolve,
            alias: {
                ...options.resolve?.alias,
                '@poker/shared': path.resolve(__dirname, '../../libs/shared/src/index.ts'),
                '@prisma/adapter-pg': path.resolve(__dirname, '../../node_modules/@prisma/adapter-pg'),
            },
            plugins: [
                ...(options.resolve?.plugins || []),
                new TsconfigPathsPlugin({
                    configFile: path.resolve(__dirname, '../../tsconfig.json'),
                }),
            ],
        },
        watchOptions: {
            poll: 1000,
            aggregateTimeout: 300,
        },
    };
};
