const run = require('nodecaf-run');

module.exports = {

    summary: 'Executes the Nodecaf app installed in the specified directory',
    options: {
        conf: [ 'c', 'Conf file path (multiple supported)', 'file' ],
        reload: [ 'r', 'Whether the app should be reloaded upon config or code changes' ]
    },
    expectedArgs: [ 'APP_PATH' ],

    callback(opts, appPath){

        opts.path = appPath || process.env.APP_PATH;
        opts.conf = opts.conf || process.env.APP_CONF;
        return run(opts);
    }
};
