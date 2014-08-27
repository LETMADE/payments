var koa = require('koa');
var compress = require('koa-compress');
var hbs = require('koa-hbs');
var locals = require('koa-locals');
var logger = require('koa-logger');
var path = require('path');
var router = require('koa-router');
var serve = require('koa-static');

var app = koa();
var routes = require(path.resolve(__dirname, 'routes'));

if (process.env.NODE_ENV !== 'test') {
  app.use(logger());
}

app.use(router(app));
app.use(serve(path.resolve(__dirname, '../..', 'public')));
app.use(serve(path.resolve(__dirname, '../..', 'node_modules/jquery/dist')));
app.use(serve(path.resolve(__dirname, '../..', 'node_modules/bootstrap/dist/js')));
app.use(serve(path.resolve(__dirname, '../..', 'node_modules/bootstrap/dist/css')));
app.use(compress());
app.use(hbs.middleware({ viewPath: path.resolve(__dirname, 'templates') }));

locals(app, {
  assemblyRoot: 'https://assembly.com',
  title: 'Assembly Payments'
});

app.use(function *() {
  yield this.render('index', this.locals);
});

routes(app);

app.listen(process.env.PORT || 8000);

module.exports = app;
