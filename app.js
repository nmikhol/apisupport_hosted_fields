const express = require('express')
const braintree = require("braintree")
const path = require('path')
const exphbs = require('express-handlebars')
const gateway = require('./btCredentials.js')

const PORT = process.env.PORT || 3000
const app = express()

app.set('views', path.join(__dirname, 'views'))
app.engine('.hbs', exphbs({extname: '.hbs'}))
app.set('view engine', '.hbs')
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.listen(PORT, () => console.log(`App is up and running listening on port ${PORT}`))

/*app.get('/', (req, res) => {
    res.render('configure')
  })*/

app.get('/', (req, res) => {
  gateway.clientToken.generate({},(err, response) => {
    res.render('checkout', {clientToken: response.clientToken, verificationStatus: app.locals.verificationStatus, transactionStatus: app.locals.transactionStatus})
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
                console.log(`declined case" ${result.transaction.status}`)
                app.locals.transactionStatus = result.transaction.status
                res.redirect('/')

              } else { //if transaction.sale fails, log errors
                  transactionErrors = result.errors.deepErrors();
                  console.log(`transactionErrors: ${transactionErrors}`)
                  res.redirect('/')
                }
              });
        } else if(result.success === false && (result.errors = {})) { //if veririfation is declined, redirects back to checkout
          app.locals.verificationStatus = result.verification.status
          res.redirect(`/`)
          console.log(result.verification.status)

        } else { //if customer.create() fails, displays errors
          customerErrors = result.errors.deepErrors();
          console.log(`customerErrors: ${customerErrors}`)
          res.redirect('/')
        }
      });
    });
