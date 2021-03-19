const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const c = require('colors/safe');
const proc = require('child_process');

const template = name => fs.readFileSync(
    path.resolve(__dirname, '../codegen', name + '.ejs'),
    'utf-8'
);

/* istanbul ignore next */
function log(text){
    if(process.env.NODE_ENV == 'testing')
        return;

    console.log(text);
}

function mkdir(path){
    try{
        fs.mkdirSync(path, { recursive: true });
    }
    catch(e){}
}

function generate(templateName, path, input){
    if(!fs.existsSync(path)){
        let src = ejs.render(template(templateName), input, {});
        src = src.replace(/[\n\r]/g, '\r\n');
        fs.writeFileSync(path, src);
        log('  ' + c.brightGreen('+ ./' + path));
    }
}

/* istanbul ignore next */
let pipeConf = process.env.NODE_ENV == 'testing' ? ['ignore', 'ignore', 'ignore'] : [0, 1, 2];

function generateMainFiles(name, input){
    log('\n🔹 Initializing project in ' + c.yellow(path.resolve('.')));
    mkdir('lib');

    generate('main', 'lib/main.js', input);
    generate('api', 'lib/api.js', input);
}

function generateMiscFiles(name, input){
    if(input.bare)
        return false;

    log('\n🔹 Generating miscellaneous files');

    generate('docker', 'Dockerfile', input);
    generate('eslint', '.eslintrc.yml', input);
}

function generatePackageJSON(name, input){
    log('\n📦 Initializing NPM package');

    let pkgJSONPath = 'package.json';
    let pkgInfo = { name, version: '0.0.0', main: 'lib/main.js' };
    let pkgEx = fs.existsSync(pkgJSONPath);
    let curPkg = pkgEx ? JSON.parse(fs.readFileSync(pkgJSONPath, 'utf-8')) : {};
    pkgInfo = { ...pkgInfo, ...curPkg };

    if(input.bin){
        pkgInfo.bin = pkgInfo.bin || {};
        pkgInfo.bin[name] = pkgInfo.bin[name] || 'bin/' + name + '.js'
    }

    fs.writeFileSync(pkgJSONPath, JSON.stringify(pkgInfo, null, 2));
    log('  ' + c[pkgEx ? 'cyan' : 'brightGreen']('+ ./package.json'));

    if(!pkgInfo.dependencies || !pkgInfo.dependencies.nodecaf)
        setupDependencies(name, input);
}

function setupDependencies(name, input){
    log('\n🔹 Installing dependencies');
    let deps = [ 'nodecaf' ];
    input.conf && deps.push(input.conf);
    input.mongo && deps.push('nodecaf-mongo');
    input.redis && deps.push('nodecaf-redis');
    proc.execSync('npm i -P ' + deps.join(' '), { stdio: pipeConf });
}

// Create BIN folder and the run binary.
function generateRunFile(name, input){

    let fp = 'bin/' + name + '.js'

    if(!input.bin || fs.existsSync(fp))
        return false;

    log('\n⚙️ Generating run script (bin)');

    let src = ejs.render(template('run'), input, {});
    mkdir('bin/');
    fs.writeFileSync(fp, src);

    log('  ' + c.brightGreen('+ ./' + fp));
}

function generateGitRepo(name, input){
    if(input.bare)
        return false;

    log('\n🔹 Initializing git repository');
    try{
        proc.execSync('git init', { stdio: pipeConf });

        /* istanbul ignore next */
        if(!fs.existsSync('.gitignore')){
            fs.writeFileSync('.gitignore', '/node_modules/\r\n');
            log('  ' + c.brightGreen('+ ./.gitignore'));
        }

        /* istanbul ignore next */
        if(!fs.existsSync('.gitattributes')){
            fs.writeFileSync('.gitattributes', '*.js text eol=crlf\r\n');
            log('  ' + c.brightGreen('+ ./.gitattributes'));
        }
    }
    catch(e){

        /* istanbul ignore next */
        log('❌ ' + c.red('Failed to exec git init command'));
    }
}

module.exports = {

    summary: 'Generates a base Nodecaf project file structure in the current directory',
    expectedArgs: [ '<APP_NAME>' ],
    options: {
        conf: [ 'c', 'Type of config file to be used in the project', 'format' ],
        bin: [ false, 'When present will generate a npm binary file to run the app' ],
        bare: [ false, 'When present will generate only js files' ],
        path: [ 'p', 'Project root directory (defaults to app name inside working dir)', 'path' ],
        mongo: [ false, 'When present will install and generate code for mongo integration' ],
        redis: [ false, 'When present will install and generate code for redis integration' ]
    },

    callback(input, name){

        if(!name)
            throw new Error('Project name is required: `nodecaf init <name>`');

        if(input.conf && !(input.conf in { toml: 1, yaml: 1 }))
            throw new Error('\'--conf\' must be one of the following: toml, yaml');

        let projDir = path.resolve(input.path || './' + name);
        mkdir(projDir);
        process.chdir(projDir);

        generateMainFiles(name, input);
        generateMiscFiles(name, input);
        generateRunFile(name, input);
        generateGitRepo(name, input);
        generatePackageJSON(name, input);

        log('\n🎉 Successfully initialized project ' + c.yellow(name) + '\n');
    }
};
