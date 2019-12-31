const multer = require('multer')
const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const sharp = require('sharp')
const router = new express.Router()

//Signup the user
//req.body --> { "name":"Omkar Kolte", "age": 20, "email": "OmkarK@gmail.com", "password": "OmkarK@123" }
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
        console.log(e)
    }
})

//Login the user
//req.body-- > { "name": "Omkar Kolte", "password": "OmkarK@123"}
// Gives a Token in return
router.post('/users/login', async (req,res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user ,token})
    } catch (e) {
        res.status(400).send()
    }
})

//Logout the user if only he is authorized and loggedin
router.post('/users/logout',auth, async (req, res) => {
    try { 
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    }  catch(e){
        res.status(500).send()
    }
})

//Logout the user from everywhere removing all the tokens
router.post('/users/logoutAll',auth, async (req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send()  
    } catch(e) {
        res.status(500).send()
    }
})

//Show the profile of the user
router.get('/users/me',auth, async (req, res) => {
    res.send(req.user)
})

//Changing credentials of the User only if authorized
router.patch('/users/me',auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

//Deleting the user from the application
router.delete('/users/me',auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})


const upload = multer({
    limits:{
        fileSize:1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined,true)
    }
})

//Adding image to the user Profile
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error,req, res, next) => {
    res.status(400).send({error: error.message})
})

//Deleting image from the user Profile
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//Getting the User profile picture using user ID
router.get('/users/:id/avatar', async (req,res) => {
    try {
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar) {
            throw new Error
        }
        res.set('Content-Type','image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router