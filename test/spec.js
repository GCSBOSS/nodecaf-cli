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

        it('Should fail when no name is sent', function() {
            assert.throws(() => init(), /init <name>/g);
        });

        it('Should generate basic structure files', function() {
            this.timeout(5000);
            init({}, 'test');
            assertPathExists('./lib/main.js');
            assertPathExists('./lib/api.js');
            assertPathExists('./package.json');
        });

        it('Should generate npm bin file', function() {
            this.timeout(5000);
            tmp.mkdir('test/lib');
            tmp.addFile('res/t-package.json', './test/package.json');
            tmp.addFile('res/app.js', './test/lib/main.js');
            tmp.addFile('res/api.js', './test/lib/api.js');
            tmp.addFile('res/Dockerfile', './test/Dockerfile');
            tmp.addFile('../.eslintrc.yml', './test/.eslintrc.yml');
            init({ bin: true }, 'test');
            let pkgInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
            assert.equal(pkgInfo.bin['test'], 'bin/test.js');
        });

        it('Should target specified directory', function() {
            this.timeout(5000);
            init({ path: './foo' }, 'test');
            assertPathExists('./package.json');
        });

        it('Should generate conf file if specified', function() {
            this.timeout(5000);
            init({ conf: './conf.toml' }, 'test');
            assertPathExists('./lib/conf.toml');
        });

        it('Should only generate main files', function() {
            this.timeout(5000);
            init({ bare: true }, 'test');
            assert(!fs.existsSync('./Dockerfile'));
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
