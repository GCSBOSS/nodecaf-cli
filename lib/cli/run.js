const path = require('path');
const assert = require('assert');

/* istanbul ignore next */
function term(){
    this.stop();
    if(!process.env.NODE_ENV)
        setTimeout(() => process.exit(0), 1000);
}

/* istanbul ignore next */
function die(err){
    if(this.log)
        this.log.err(err, 'fatal error', 'fatal');
    else
        console.error(err);
    process.exit(1);
}

module.exports = {

    summary: 'Executes the Nodecaf app installed in the specified directory',
    options: {
        conf: [ 'c', 'Conf file path (multiple supported)', 'file' ],
        delay: [ 'd', 'Time to await before starting the app', 'milliseconds' ]
    },
    expectedArgs: [ 'APP_PATH' ],

    callback(opts, appPath){
        appPath = path.resolve(process.cwd(), appPath || process.env.APP_PATH);

        try{
            var init = require(appPath);
            assert.equal(typeof init, 'function');
        }
        catch(err){
            console.error('The path does not point to a valid Nodecaf app');
            throw err;
        }

        let app = init();
        let confPath = opts.conf || process.env.APP_CONF;
        let confs = Array.isArray(confPath) ? confPath : [confPath];
        confs.forEach(c => c && app.setup(c));

        // Handle signals.
        process.on('SIGINT', term.bind(app));
        process.on('SIGTERM', term.bind(app));
        process.on('uncaughtException', die.bind(app));
        process.on('unhandledRejection', die.bind(app));

        let delay = opts.delay || process.env.APP_DELAY || 0;
        setTimeout(() => app.start(), delay);
    }
};
