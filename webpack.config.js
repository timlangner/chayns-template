const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const webpack = require('webpack');
const { externalName, internalName, subproject } = require('./project.json');

const PATH_BUILD = path.resolve('build');
const PATH_BUILD_QA = `//tappqa/www/tappqa.tobit.com/${internalName}/${
    subproject || ''
}`;

const ssl = {};

try {
    ssl.cert = fs.readFileSync(
        path.join('\\\\fs1.tobit.ag\\ssl', 'tobitag.crt')
    );
    ssl.key = fs.readFileSync(
        path.join('\\\\fs1.tobit.ag\\ssl', 'tobitag.key')
    );
} catch (e) {
    // eslint-disable-next-line no-console
    console.log('\n-------------\nNo SSL Certificate found.\n-------------\n');
}

const devServer = {
    host: '0.0.0.0',
    port: 8080,
    historyApiFallback: true,
    compress: true,
    https: true,
    cert: ssl.cert,
    key: ssl.key,
    disableHostCheck: true,
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods':
            'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers':
            'X-Requested-With, content-type, Authorization',
    },
};

const config = (env) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    const isStaging = env && env.staging;

    let devtool;

    if (isDevelopment) {
        devtool = 'source-map';
    } else if (isStaging) {
        devtool = 'hidden-source-map';
    }

    const miniCssLoader = {
        loader: MiniCssExtractPlugin.loader,
        options: { hmr: isDevelopment },
    };

    return {
        mode: isDevelopment ? 'development' : 'production',
        entry: ['whatwg-fetch', 'react-hot-loader/patch', './src/index'],
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            alias: { 'react-dom': '@hot-loader/react-dom' },
        },
        output: {
            path: isStaging ? PATH_BUILD_QA : PATH_BUILD,
            filename: '[name].[hash].js',
        },
        module: {
            rules: [
                {
                    test: /\.(js|jsx|ts|tsx)$/,
                    exclude: /node_modules/,
                    use: 'babel-loader',
                },
                {
                    test: /\.(png|svg|jpg|gif)$/,
                    use: 'file-loader',
                },
                {
                    test: /\.(css|scss)$/,
                    use: [
                        isDevelopment ? 'style-loader' : miniCssLoader,
                        {
                            loader: 'css-loader',
                            options: { modules: true, importLoaders: 2 },
                        },
                        'postcss-loader',
                        'sass-loader',
                    ],
                    include: /\.module\.(css|scss)$/,
                },
                {
                    test: /\.(css|scss)$/,
                    use: [
                        isDevelopment ? 'style-loader' : miniCssLoader,
                        'css-loader',
                        'postcss-loader',
                        'sass-loader',
                    ],
                    exclude: /\.module\.(css|scss)$/,
                },
            ],
        },
        devServer,
        devtool,
        plugins: [
            new webpack.DefinePlugin({
                __DEV__: isDevelopment,
                __STAGING__: isStaging,
                __PROD__: isProduction,
            }),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'public/index.html'),
                title: `${externalName} | chayns®`,
                scriptLoading: 'defer',
            }),
            !isDevelopment &&
                new MiniCssExtractPlugin({
                    filename: '[name].[hash].css',
                }),
            !isDevelopment && new CleanWebpackPlugin(),
        ].filter(Boolean),
    };
};

module.exports = config;
