const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env) => {
    return {
        mode: 'production',
        entry: {
            client: path.resolve(__dirname, 'index.js')
        },
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: '[name].[contenthash].js',
            clean: true
        },
        plugins:[
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'public', 'index.html'),
            })
        ],
        devServer: {
            port: env.port,
            open: true
        }
    }
};