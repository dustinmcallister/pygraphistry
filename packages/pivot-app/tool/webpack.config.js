var path = require('path');
var webpack = require('webpack');
var vizAppPackage = require('../package.json');
var AssetsPlugin = require('assets-webpack-plugin');
var WebpackDashboard = require('webpack-dashboard/plugin');
var NPMInstallPlugin = require('npm-install-webpack-plugin');
var WebpackVisualizer = require('webpack-visualizer-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var WebpackNodeExternals = require('webpack-node-externals');
var StringReplacePlugin = require('string-replace-webpack-plugin');
var child_process = require('child_process');

var argv = process.argv.slice(2);
while (argv.length < 2) {
    argv.push(0);
}

module.exports = [
    clientConfig,
    serverConfig
];

function getCommitId() {
    const commitId = process.env.COMMIT_ID;
    if (commitId) {
        return commitId;
    } else {
        return child_process.execSync('git rev-parse --short HEAD').toString().trim();
    }
}

function getRevName() {
    const revName = process.env.REV_NAME;
    if (revName) {
        return revName;
    } else {
        return child_process.execSync('git name-rev --name-only HEAD').toString().trim();
    }
}

const buildNumber = process.env.BUILD_NUMBER;
const buildDate = Date.now();

const versionDefines = {
    __RELEASE__: undefined,
    __GITCOMMIT__: `"${getCommitId()}"`,
    __GITBRANCH__: `"${getRevName()}"`,
    __BUILDDATE__: `${buildDate}`,
    __BUILDNUMBER__: buildNumber ? `"${buildNumber}"` : undefined,
}

function commonConfig(
    isDevBuild = process.env.NODE_ENV === 'development',
    isFancyBuild = argv[1] === '--fancy'
) {
    return {
        amd: false,
        quiet: isDevBuild,
        progress: !isDevBuild,
        // Create Sourcemaps for the bundle
        devtool: 'source-map',
        postcss: postcss,
        resolve: {
            unsafeCache: true,
        },
        module: {
            loaders: loaders(isDevBuild, isFancyBuild),
            noParse: [
                /reaxtor-falcor-syntax-pathmap\/lib\/parser\.js$/
            ]
        },
        plugins: plugins(isDevBuild, isFancyBuild),
        stats: {
            // Nice colored output
            colors: true
        }
    };
}

function clientConfig(
    isDevBuild = process.env.NODE_ENV === 'development',
    isFancyBuild = argv[1] === '--fancy'
) {
    var config = commonConfig(isDevBuild, isFancyBuild);
    config.node = { fs: 'empty', global: false };
    config.target = 'web';
    config.entry = {
        client: [
          './src/client/entry.js'
          // 'font-awesome-webpack!./src/shared/font-awesome.config.js',
        ].concat(true || !isDevBuild ? [] : [
            'webpack-hot-middleware/client' +
            '?path=http://localhost:8090/__webpack_hmr' +
            '&overlay=false' + '&reload=true' + '&noInfo=true' + '&quiet=true'
        ])
    };
    config.output = {
        path: path.resolve('./build/public'),
        publicPath: '/',
        filename: 'clientBundle.js'
    };
    config.module.loaders.push({
        test: /\.css$/,
        loader: isDevBuild ? 'style!css!postcss' : ExtractTextPlugin.extract({
            loader: 'css!postcss'
        })
    });
    config.module.loaders.push({
        test: /\.less$/,
        loader: isDevBuild ?
            'style!css?module&-minimize&localIdentName=[local]_[hash:6]!postcss!less' :
            ExtractTextPlugin.extract({
                loader: 'css?module&minimize&localIdentName=[local]_[hash:6]!postcss!less'
            })
    });
    config.plugins.push(new AssetsPlugin({ path: path.resolve('./build') }));
    config.plugins.push(new webpack.DefinePlugin(
        Object.assign(
            {},
            {
                global: 'window',
                DEBUG: isDevBuild,
                __DEV__: isDevBuild,
                __CLIENT__: true,
                __SERVER__: false,
                'process.env.NODE_ENV': '"production"',
            },
            versionDefines
        )
    ));
    return config;
}

function serverConfig(
    isDevBuild = process.env.NODE_ENV === 'development',
    isFancyBuild = argv[1] === '--fancy'
) {
    var config = commonConfig(isDevBuild, isFancyBuild);
    config.node = {
        console: true,
        __filename: true,
        __dirname: true
    };
    config.target = 'node';
    config.entry = {
        server: [
            './src/server/entry.js'
        ].concat(!isDevBuild ? [] : [
            __dirname + '/hmr/signal.js?hmr'
        ])
    };
    config.output = {
        path: path.resolve('./build/server'),
        filename: 'serverBundle.js',
        libraryTarget: 'commonjs2'
    };
    config.externals = [
        // native modules will be excluded, e.g require('react/server')
        WebpackNodeExternals(),
        // these assets produced by assets-webpack-plugin
        /^.+assets\.json$/i,
    ];
    config.module.loaders.push({
        test: /\.less$/,
        loader: 'css/locals' +
        // loader: require.resolve('css-loader/locals') +
            '?module&localIdentName=[local]_[hash:6]!postcss!less'
    });
    config.plugins.push(new webpack.BannerPlugin({
        raw: true,
        entryOnly: true,
        banner: `require('source-map-support').install();`
    }));
    config.plugins.push(new webpack.DefinePlugin(
        Object.assign(
            {},
            {
                global: 'window',
                DEBUG: isDevBuild,
                __DEV__: isDevBuild,
                __CLIENT__: false,
                __SERVER__: true,
                'process.env.NODE_ENV': '"production"',
            },
            versionDefines
        )
    ));
    return config;
}

function loaders(isDevBuild) {
    return [
        babel(),
        { test: /\.json$/, loader: 'json' },
        { test: /\.glsl$/, loader: 'webpack-glsl' },
        { test: /\.proto$/, loader: 'proto-loader' },
        { test: /\.pegjs$/, loader: 'pegjs-loader?cache=true&optimize=size' },
        { test: /\.(hbs|handlebars)$/, loader: 'handlebars-loader' },
        { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "url?&name=[name]_[hash:6].[ext]" },
        { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?&name=[name]_[hash:6].[ext]&limit=10000&mimetype=image/svg+xml" },
        { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?&name=[name]_[hash:6].[ext]&limit=10000&mimetype=application/font-woff" },
        { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url?&name=[name]_[hash:6].[ext]&limit=10000&mimetype=application/font-woff" },
        { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?&name=[name]_[hash:6].[ext]&limit=10000&mimetype=application/octet-stream" },
        // match everything except [
        //   hb, js, jsx, json, css, scss, less,
        //   html, glsl, pegjs, proto, handlebars
        // ] You can add more.
        { test: /\.(?!(hb|jsx?|json|s?css|less|html?|glsl|woff|woff2|ttf|eot|svg|pegjs|proto|handlebars)$)([^.]+$)/, loader: 'url?limit=10000&name=[name]_[hash:6].[ext]' },
        { test: /PEGUtil.js$/,
            include: /node_modules\/pegjs-util/,
            loader: StringReplacePlugin.replace({ // from the 'string-replace-webpack-plugin'
                replacements: [{
                    pattern: /typeof define\.amd !== (\"|\')undefined(\"|\')/ig,
                    replacement: function(/*match, p1, offset, string*/) {
                        return false;
                    }
                }]
            })
        }
    ];
    function babel() {
        return {
            test: /\.(js|es6|mjs|jsx)$/,
            exclude: /(node_modules(?!\/rxjs))/,
            loader: 'babel-loader',
            query: {
                babelrc: false,
                cacheDirectory: true, // cache into OS temp folder by default
                passPerPreset: true,
                presets: [
                    { plugins: [ 'transform-runtime' ] },
                    {
                        passPerPreset: false,
                        presets: [['es2015', { modules: false }], 'react', 'stage-0']
                    },
                    'es2015'
                ]
            }
        };
    }
}

function plugins(isDevBuild, isFancyBuild) {

    var plugins = [
        new StringReplacePlugin(),
        // new webpack.NamedModulesPlugin(),
        // Avoid publishing files when compilation fails
        new webpack.NoErrorsPlugin(),
        new webpack.ProvidePlugin({ React: 'react' }),
        new webpack.LoaderOptionsPlugin({
            debug: isDevBuild,
            minimize: !isDevBuild
        }),
        // use this for universal server client rendering
        new ExtractTextPlugin({ allChunks: true, filename: 'styles.css' }),
    ];

    if (isDevBuild) {
        // plugins.push(new NPMInstallPlugin());
        // plugins.push(new WebpackVisualizer());
        plugins.push(new webpack.HotModuleReplacementPlugin());
        if (isFancyBuild) {
            plugins.push(new WebpackDashboard());
        } else {
            // Report progress for non-fancy dev builds
            plugins.push(new webpack.ProgressPlugin());
        }
    } else {
        // Report progress for prod builds
        plugins.push(new webpack.ProgressPlugin())
        plugins.push(new webpack.optimize.OccurrenceOrderPlugin(true));
        // Deduping is currently broken :(
        // plugins.push(new webpack.optimize.DedupePlugin());
        plugins.push(new webpack.optimize.AggressiveMergingPlugin());
        plugins.push(new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false },
            mangle: false,
            comments: false,
            sourceMap: false,
            'screw-ie8': true,
        }));
    }

    return plugins;
}

function postcss(webpack) {
    return [
        require('postcss-font-awesome'),
        require('autoprefixer')
    ];
}

