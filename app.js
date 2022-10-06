var createError = require('http-errors');
const mongoose = require("mongoose");
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const dotenv = require('dotenv').config()


var indexRouter = require('./routes/users/index');
var loginRouter = require('./routes/users/userlogin');
var homeRouter = require('./routes/users/home');
var signupRouter = require('./routes/users/signup')
var adminRouter = require('./routes/admin/admin')
var app = express();
const hbs = require('express-handlebars');
const { response } = require('express');


// view engine setup

mongoose.connect(process.env.SERVER).then(() => {
  console.log("your system is hacked");
})
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine(
  {
    extname:'hbs',defaultLayout:__dirname+'/views/layouts/layout',
    partialsDir:__dirname+'/views/partials/',
    helpers:{
      format:function(date){
        newdate=date.toUTCString()
         return newdate.slice(5,16)
      }
    }
  })
)

// hbs.registerHelper('ifCond', function(v1, v2, options) {
//   if(v1 === v2) {
//     return options.fn(this);
//   }
//   return options.inverse(this);
// });



// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  resave: true,
  saveUninitialized: false,
  secret: 'Key',
  cookie: {maxAge: 600000}
}))

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/home', homeRouter);
app.use('/signup', signupRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
