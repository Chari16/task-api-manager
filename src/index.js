const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')
const jwt = require('jsonwebtoken')
const cors = require('cors')
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');

const app = express()
const port = process.env.PORT

app.use(cors())

app.use((req, res, next) => {
    console.log(req.method, req.path)
    next()
})

app.use(express.json())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})

// const myFunction = async() => {
//     const token = jwt.sign({_id : 'abc123'}, 'thisismynewcourse',{ expiresIn: '1 seconds'})
//     console.log(token)
    
//     const data = jwt.verify(token, 'thisismynewcourse')
//     console.log(data)
// }

// myFunction()