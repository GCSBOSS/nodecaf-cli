
module.exports = () => new Nodecaf({
    conf: { port: 3478 },
    api({ get }){
        get('/bar', function({ res, conf }){
            res.set('Content-Type', 'text/plain');
            res.end(conf.name || conf.key || 'foo');
            this.stop();
        });
    }
});
