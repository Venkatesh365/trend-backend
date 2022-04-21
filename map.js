const express = require('express')
const cors = require("cors")

const app = express()
app.use(cors())
const worldMap = require('./map.json')

const port = process.env.PORT || 4000



app.get('/worldmap', (req, res) => {
    res.send(worldMap)
})

app.listen(port, () => {
    console.log(`App is listening to port ${port}`)
})