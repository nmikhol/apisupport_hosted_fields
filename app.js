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
    res.render('checkout', {clientToken: response.clientToken})
    //console.log(response.clientToken)
    })
  })

  app.post('/transaction', (req, res, next) => {
    let paymentNonce = req.body.payment_method_nonce
    let firstName = req.body.firstName
    let lastName = req.body.lastName
    let postalCode = req.body.postalCode
    let amount = req.body.amount
    let email = req.body.email


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
    }, function (error, result) {
        if (result.success) {
          console.log(result.customer.id)
          gateway.transaction.sale({
            amount: amount,
            paymentMethodToken: result.customer.creditCards[0].token,
            options: {
              submitForSettlement: true
              }
            }, function(error, result) {
                if (result.success || result.transaction) {
                  res.render('results', {transactionResponse: result, customerResponse: result});
                  } else {
                      transactionErrors = result.errors.deepErrors();
                      console.log(transactionErrors)
                      //req.flash('error', {msg: formatErrors(transactionErrors)});
                      res.render('results');
                    }
                  });
        } else {
          customerErrors = result.errors.deepErrors();
          console.log(customerErrors)
          //req.flash('error', {msg: formatErrors(customerErrors)});
          res.render('checkout');
        }
        });
    });
