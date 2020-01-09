const express = require('express')
const braintree = require("braintree")
const path = require('path')
const exphbs = require('express-handlebars')


const PORT = process.env.PORT || 3000
const app = express()

app.set('views', path.join(__dirname, 'views'))
app.engine('.hbs', exphbs({extname: '.hbs'}))
app.set('view engine', '.hbs')
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.listen(PORT, () => console.log(`App is up and running listening on port ${PORT}`))

app.get('/', function (req, res) {
   res.send('Hello World!')
 })
