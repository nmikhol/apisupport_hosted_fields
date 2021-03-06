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
  let dateRange = new Date();
  let txnCount = 0
  let searchResults = []
  dateRange.setDate(today.getDate()- 90); //setting Date Range

  gateway.transaction.search(function (search) {//start search request
    search.createdAt().min(dateRange);
  }, function (err, response) {
      response.each(function (err, transaction) {
        searchResults.push(transaction)
        txnCount ++
    })
  })//close transaction.search()

  function checkSearch() {
    setTimeout(function () {
      searchResults.sort(function(a,b){
        if (a.createdAt < b.createdAt) return 1;
        if (a.createdAt > b.createdAt) return -1;
        return 0;
      })
      res.render('search', {searchResults: searchResults, txnCount: txnCount})
    }, 5000);//waiting for the search to complete before querying the array
  }
  checkSearch()
})//close this GET request

app.get('/', (req, res) => {
  if(!req.session.loadCount){ //see how many times user visited the checkout page
    req.session.loadCount = 1
  } else {
    req.session.loadCount += 1
  }
  gateway.clientToken.generate({},(err, response) => {
    res.render('checkout', {
    clientToken: response.clientToken,
    verificationStatus: app.locals.verificationStatus,
    transactionStatus: app.locals.transactionStatus,
    loadCount:  req.session.loadCount
    })
  })
})//close this get for clientToken

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
          }, function(error, result) { //if transaction is successfull, show /results
              if (result.success) {
                res.render('results', {transactionResponse: result, customerResponse: customerResponse});

              } else if(result.success === false) {
                  transactionErrorsArr = result.errors.deepErrors();

                  if(transactionErrorsArr.length <= 0) {//if transaction is declined, redirects back to checkout
                    app.locals.transactionStatus = result.transaction.status
                    req.session.loadCount = 0
                    res.redirect(`/`)
                  } else { //if txn.sale() fails, displays errors
                      transactionErrors = transactionErrorsArr.map((transactionError) =>{
                      console.log(`${transactionError.attribute} ${transactionError.code} ${transactionError.message}`)
                      res.status(500).send(transactionErrorsArr)
                      });
                  }
              }
            });//end of txn handling
      } else if(result.success === false) {
          customerErrorsArr = result.errors.deepErrors();

          if(customerErrorsArr.length <= 0) {//if verification is declined, redirects back to checkout
            app.locals.verificationStatus = result.verification.status
            req.session.loadCount = 0
            res.redirect(`/`)
          } else { //if customer.create() fails, displays errors
              customerErrors = customerErrorsArr.map((customerError) =>{
              console.log(`${customerError.attribute} ${customerError.code} ${customerError.message}`)
              res.status(500).send(customerErrorsArr)
              });
          }
        }
    }); //end customer.create handling
}); //end POST request
