
module.exports = function init(){
    let app = new AppServer({ port: 3478 });

    app.api(function({ get }){
        get('/bar', function({ res, conf }){
            res.set('Content-Type', 'text/plain');
            res.end(conf.name || conf.key || 'foo');
            this.stop();
        });
    });

    return app;
}
