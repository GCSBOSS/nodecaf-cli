const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const c = require('colors/safe');

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
        fs.writeFileSync(path, src);
        log('  ' + c.brightGreen('+ ./' + path));
    }
}

function generateMainFiles(name, input){
    log('\n🔹 Initializing project in ' + c.yellow(path.resolve('.')));
    mkdir('lib');

    generate('main', 'lib/main.js', input);
    generate('api', 'lib/api.js', input);

    if(input.conf && !fs.existsSync('lib/' + input.conf)){
        fs.writeFileSync('lib/' + input.conf, '');
        log('  ' + c.brightGreen('+ ./lib/' + input.conf));
    }

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

module.exports = {

    summary: 'Generates a base Nodecaf project file structure in the current directory',
    expectedArgs: [ '<APP_NAME>' ],
    options: {
        path: [ 'p', 'Project root directory (defaults to app name inside working dir)', 'path' ],
        conf: [ 'c', 'Path to a default config file relative to project root', 'file' ],
        bin: [ false, 'When present will generate a npm binary file to run the app' ]
    },

    callback(input, name){

        if(!name)
            throw new Error('Project name is required: `nodecaf init <name>`');

        let projDir = path.resolve(input.path || './' + name);
        mkdir(projDir);
        process.chdir(projDir);

        generateMainFiles(name, input);
        generateRunFile(name, input);
        generatePackageJSON(name, input);

        log('\n🎉 Successfully initialized project ' + c.yellow(name) + '\n');
    }
};
