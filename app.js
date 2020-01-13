const express = require('express')
const braintree = require("braintree")
const path = require('path')
const exphbs = require('express-handlebars')
const gateway = require('./btCredentials.js')
const session = require('express-session')

const PORT = process.env.PORT || 3000
const app = express()

app.set('views', path.join(__dirname, 'views'))
app.engine('.hbs', exphbs({extname: '.hbs'}))
app.set('view engine', '.hbs')
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({secret: 'secret-key', resave: false, saveUninitialized: false}));

app.listen(PORT, () => console.log(`App is up and running listening on port ${PORT}`))

app.get('/search', (req, res) =>{
  let today = new Date();
  let yesterday = new Date();
  let txnCount = 0
  let searchResults = []
  yesterday.setDate(today.getDate() - 1);

  gateway.transaction.search(function (search) {
    search.createdAt().min(yesterday);

  }, function (err, response) {
    response.each(function (err, transaction) {
    searchResults.push(transaction)
    txnCount ++
    //console.log(`searching`)
    })
  })

  function checkSearch() {
      setTimeout(function () {
        console.log(searchResults)
        res.render('search', {searchResults: searchResults, txnCount: txnCount})
      }, 5000);
  }

checkSearch()

})//close this get request


app.get('/', (req, res) => {
  if(!req.session.loadCount){
    req.session.loadCount = 1
  } else {
    req.session.loadCount += 1
  }
  gateway.clientToken.generate({},(err, response) => {
    res.render('checkout', {clientToken: response.clientToken, verificationStatus: app.locals.verificationStatus, transactionStatus: app.locals.transactionStatus, loadCount:  req.session.loadCount })
  })
})

app.post('/transaction', (req, res, next) => {
  let paymentNonce = req.body.payment_method_nonce
  let firstName = req.body.firstName
  let lastName = req.body.lastName
  let postalCode = req.body.postalCode
  let amount = req.body.amount
  let email = req.body.email

  //###CREATE CUSTMOMER###
  let newCustomer = gateway.customer.create({
    firstName: firstName,
    lastName: lastName,
    email: email,
    paymentMethodNonce:paymentNonce,
    creditCard: {
      billingAddress: {
        postalCode: postalCode
      },
      options: {
        verifyCard: true
      }
    }
  }, function (error, result) { //If customer was created sucussfully, transaction is created
      if (result.success) {
        let customerResponse = result

        //###CREATE TRANSACTION ####
        gateway.transaction.sale({
          amount: amount,
          paymentMethodToken: result.customer.creditCards[0].token,
          options: {
            submitForSettlement: true
            }
          }, function(error, result) { //if transaction is successfull, show results
              if (result.success) {
                res.render('results', {transactionResponse: result, customerResponse: customerResponse});

              } else if (result.success === false && (result.errors = {})) {//if transaction is declined, redirects back to /checkout
                  req.session.loadCount = 0
                  app.locals.transactionStatus = result.transaction.status
                  res.redirect('/')
              } else { //if transaction.sale fails, log errors
                  transactionErrorsArr = result.errors.deepErrors();
                  transactionErrors = transactionErrorsArr.map((transactionError) =>{
                  console.log(`${transactionError.attribute} ${transactionError.code} ${transactionError.message}`)
                  });
                  res.redirect('/')
              }
          });
        } else if(result.success === false && (result.errors = {})) { //if verification is declined, redirects back to checkout
            app.locals.verificationStatus = result.verification.status
            req.session.loadCount = 0
            res.redirect(`/`)
        } else { //if customer.create() fails, displays errors
            customerErrorsArr = result.errors.deepErrors();
            customerErrors = customerErrorsArr.map((customerError) =>{
            console.log(`${customerError.attribute} ${customerError.code} ${customerError.message}`)
            });
            res.redirect('/')
          }
    });
  });
