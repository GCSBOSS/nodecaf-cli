const path = require('path');
const ejs = require('ejs');
const fs = require('fs');

const template = name => fs.readFileSync(
    path.resolve(__dirname, '../codegen', name + '.ejs'),
    'utf-8'
);

// Create LIB folder and main server file.
function generateMainFile(input, projDir){
    let src = ejs.render(template('main'), input, {});
    fs.mkdirSync(projDir + '/lib');
    fs.writeFileSync(projDir + '/lib/main.js', src);

    if(typeof input.conf == 'string'){
        // Create config file.
        if(!fs.existsSync(path.dirname(input.conf)))
            fs.mkdirSync(path.dirname(input.conf), { recursive: true });
        fs.writeFileSync(input.conf, '');
    }
}

// Create API definition file.
function generateAPIFile(projDir){
    let src = ejs.render(template('api'), {}, {});
    fs.writeFileSync(projDir + '/lib/api.js', src);
}

// Create BIN folder and the run binary.
function generateRunFile(data, projDir, projName, pkgInfo){
    if(!data.bin)
        return false;

    if(fs.existsSync(projDir + '/bin'))
        throw new Error('The \'bin\' directory already exists');

    let src = ejs.render(template('run'), data, {});
    fs.mkdirSync(projDir + '/bin/');
    fs.writeFileSync(projDir + '/bin/' + projName + '.js', src);

    pkgInfo.bin = { [projName]: 'bin/' + projName + '.js' };
    console.log('Install your app run binary with:\n    npm link');
}

module.exports = {

    summary: 'Generates a skelleton Nodecaf project file structure in the current directory',
    options: {
        path: [ 'p', 'Project root directory (defaults to working dir)', 'path' ],
        conf: [ 'c', 'Path to a default config file relative to project root', 'file' ],
        name: [ 'n', 'Name/title for the app (defaults to package.json\'s)', 'string' ],
        bin: [ false, 'When present will generate a npm binary file to run the app' ]
    },

    callback(input){

        let projDir = path.resolve(process.cwd(), input.path || '.');
        let pkgJSONPath = path.resolve(projDir, 'package.json');

        // Check for package.json
        if(!fs.existsSync(pkgJSONPath))
            throw new Error('package.json not found in: ' + pkgJSONPath);

        let pkgInfo = require(pkgJSONPath);
        let projName = input.name || pkgInfo.name || 'my-app';

        if(fs.existsSync(projDir + '/lib'))
            throw new Error('The \'lib\' directory already exists');

        generateRunFile(input, projDir, projName, pkgInfo);
        generateMainFile(input, projDir);
        generateAPIFile(projDir);

        fs.writeFileSync(pkgJSONPath, JSON.stringify(pkgInfo));

        if(!('nodecaf' in (pkgInfo.dependencies || [])))
            console.log('Install nodecaf localy with:\n    npm i -P nodecaf');
    }
};
