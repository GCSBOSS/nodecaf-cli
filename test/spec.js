const assert = require('assert');
const Tempper = require('tempper');

process.env.NODE_ENV = 'testing';

describe('CLI: nodecaf', () => {
    var tmp;

    before(function(){
        process.chdir('./test');
        tmp = new Tempper();
    });

    after(function(){
        tmp.clear();
        process.chdir('..');
    });

    describe('nodecaf init', () => {
        const fs = require('fs');
        const { callback: init } = require('../lib/cli/init');
        const assertPathExists = p => assert(fs.existsSync(p));

        afterEach(function(){
            tmp.refresh();
        });

        it('Should fail when no package.json is found', () => {
            assert.throws( () => init({}), /package.json not found/g);
        });

        it('Should fail when \'lib\' or \'bin\' directories already exist', () => {
            tmp.addFile('res/test-package.json', './package.json');
            tmp.mkdir('bin');
            assert.throws( () => init({ bin: true }), /already exists/g);
            fs.rmdirSync('./bin');
            tmp.mkdir('lib');
            assert.throws( () => init({}), /already exists/g);
        });

        it('Should generate basic structure files', () => {
            tmp.addFile('res/test-package.json', './package.json');
            init({});
            assertPathExists('./lib/main.js');
            assertPathExists('./lib/api.js');
        });

        it('Should generate npm bin file', () => {
            tmp.addFile('res/test-package.json', './package.json');
            init({ bin: true });
            let pkgInfo = require(tmp.dir + '/package.json');
            assert.equal(pkgInfo.bin['my-proj'], 'bin/my-proj.js');
        });

        it('Should target specified directory', () => {
            tmp.mkdir('foo');
            tmp.addFile('res/nmless-package.json', './foo/package.json');
            init({ path: './foo' });
        });

        it('Should use specified project name', () => {
            tmp.addFile('res/test-package.json', './package.json');
            init({ name: 'proj-foo' });
        });

        it('Should generate conf file if specified', () => {
            tmp.addFile('res/nmless-package.json', './package.json');
            init({ conf: './conf.toml' });
            assertPathExists('./conf.toml');
        });

        it('Should generate create conf file dir if it doesn\'t exist', () => {
            tmp.addFile('res/nmless-package.json', './package.json');
            init({ conf: './my/conf.toml' });
            assertPathExists('./my/conf.toml');
        });
    });

    describe('nodecaf run', () => {
        const { callback: run } = require('../lib/cli/run');
        const { get } = require('muhb');
        global.AppServer = require('nodecaf').AppServer;

        afterEach(function(){
            tmp.refresh();
        });

        it('Should fail when path is not correct', () => {
            assert.throws(() => run({}, './app'), /valid nodecaf/);
        });

        it('Should run the given app server', async () => {
            process.env.APP_PATH = './app';
            tmp.addFile('res/app.js', './app.js');
            await run({});
            let { body } = await get('http://localhost:3478/bar');
            assert.strictEqual(body, 'foo');
        });

        it('Should inject multiple conf files', async () => {
            tmp.addFile('res/app.js', './app.js');
            tmp.addFile('res/conf.toml', './conf.toml');
            tmp.addFile('res/test-package.json', './conf.json');
            run({ conf: [ './conf.toml', './conf.json' ] }, './app');
            let { body } = await get('http://localhost:3478/bar');
            await new Promise(done => setTimeout(done, 1200));
            assert.strictEqual(body, 'my-proj');
        });

    });

    describe('nodecaf openapi', () => {
        const { callback: openapi } = require('../lib/cli/openapi');
        const SwaggerParser = require('swagger-parser');

        afterEach(function(){
            tmp.refresh();
        });

        it('Should fail when no package.json is found', () => {
            assert.throws( () => openapi({}), /package.json not found/g);
        });

        it('Should fail when no API file is found', () => {
            tmp.addFile('res/test-package.json', './package.json');
            assert.throws( () => openapi({}), /api.js not found/g );
        });

        it('Should output a well formed JSON API doc to default file', done => {
            tmp.addFile('res/test-package.json', './package.json');
            tmp.addFile('res/api.js', './api.js');
            tmp.addFile('res/conf.toml', './conf.toml');

            openapi({ apiPath: './api.js', confPath: './conf.toml' });

            SwaggerParser.validate('./output.json', done);
        });

        it('Should output a well formed YAML API doc to given file', done => {
            tmp.addFile('res/test-package.json', './package.json');
            tmp.addFile('res/api.js', './api.js');

            openapi({ apiPath: './api.js' }, './outfile.yml');

            SwaggerParser.validate('./outfile.yml', done);
        });

    });

});

describe('API Docs', () => {
    const APIDoc = require('../lib/open-api');
    const { accept } = require('../lib/parse-types');

    it('Should have app name and version by default', function(){
        let doc = new APIDoc();
        let spec = doc.spec();
        assert.strictEqual(typeof spec.info.title, 'string');
        assert.strictEqual(spec.info.version, '0.0.0');
    });

    it('Should replace given fields of the info object', function(){
        let doc = new APIDoc();
        doc.api( ({ info }) => info({ version: 'barbaz', foo: 'bar' }) );
        let spec = doc.spec();
        assert.strictEqual(spec.info.version, 'barbaz');
        assert.strictEqual(spec.info.foo, 'bar');
    });

    it('Should add operation summary and description', function(){
        let doc = new APIDoc();
        doc.api( ({ post }) => {
            post('/foo', function(){}).desc('foo\nbar\nbaz');
            post('/baz', function(){}).desc('foo');
        });
        let spec = doc.spec();
        assert.strictEqual(spec.paths['/foo'].post.summary, 'foo');
        assert.strictEqual(spec.paths['/baz'].post.summary, 'foo');
        assert.strictEqual(spec.paths['/foo'].post.description, 'bar\nbaz');
    });

    it('Should auto-populate spec with path parameters', function(){
        let doc = new APIDoc();
        doc.api( ({ post }) => {
            post('/foo/:bar', function(){});
        });
        let spec = doc.spec();
        assert.strictEqual(spec.paths['/foo/:bar'].parameters[0].name, 'bar');
    });

    it('Should auto-populate operation with permissive requests body', function(){
        let doc = new APIDoc();
        doc.api( ({ post }) => {
            post('/foo', function(){});
            post('/baz', function(){});
        });
        let spec = doc.spec();
        assert.strictEqual(typeof spec.paths['/foo'].post.requestBody, 'object');
        assert('*/*' in spec.paths['/foo'].post.requestBody.content);
    });

    it('Should add request body types based on app accepts', function(){
        let doc = new APIDoc();
        doc.api( function({ post }){
            this.accept(['json', 'text/html']);
            post('/foo', function(){});
        });
        let spec = doc.spec();
        assert(/following types/.test(spec.paths['/foo'].post.requestBody.description));
        assert('application/json' in spec.paths['/foo'].post.requestBody.content);
        assert('text/html' in spec.paths['/foo'].post.requestBody.content);
    });

    it('Should add request body types based on route accepts', function(){
        let doc = new APIDoc();
        doc.api( function({ post }){
            let acc = accept('json');
            post('/foo', acc, function(){});
        });
        let spec = doc.spec();
        assert(/following types/.test(spec.paths['/foo'].post.requestBody.description));
        assert('application/json' in spec.paths['/foo'].post.requestBody.content);
    });

});
