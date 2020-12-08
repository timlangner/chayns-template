const resolveAbsoluteImport = require('chayns-components/lib/utils/babel/resolveAbsoluteImport');

module.exports = (api) => {
    const isDev = api.env('development');

    return {
        presets: [
            ['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }],
            '@babel/preset-react',
            ['@babel/preset-typescript', { allExtensions: true, isTSX: true }],
        ],
        plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-react-constant-elements',
            !isDev && 'transform-react-remove-prop-types',
            'babel-plugin-styled-components',
            'react-hot-loader/babel',
            [
                'babel-plugin-transform-imports',
                {
                    'chayns-components': {
                        transform: resolveAbsoluteImport,
                        preventFullImport: true,
                    },
                },
            ],
        ].filter(Boolean),
    };
};
