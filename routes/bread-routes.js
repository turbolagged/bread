const dblog = require('debug')('mongo')
const express = require('express')
const router = express.Router()
const User = require('../models/user')
const spacetime = require('spacetime')
const jwt = require('jsonwebtoken')

// Getting all
router.get('/', authenticateToken, async (req, res) => {
    // console.log(req.authenticatedUser)

    let day = spacetime.now('Asia/Dhaka')

    console.log(`date: `, spacetime('2019-11-12T18:00:00.000Z', 'Asia/Dhaka').format('nice'));
    try {
        const user = await User.findById(req.authenticatedUser.id)
        res.status(200).json(user)
    } catch (err) {
        res
            .status(500)
            .json({
                message: err.message
            })
    }
})

// Getting One
router.get('/:id', authenticateToken, async (req, res) => {

    try {
        let result = await User.findOne({
            _id: req.authenticatedUser.id
        }, {
            expenses: {
                $elemMatch: {
                    _id: req.params.id
                }
            }
        })

        if (result.expenses) res.json(result.expenses[0]).status(200)

    } catch (err) {
        res.status(500).send(err)
    }

})


// by month
// Getting One
router.get('/month/:id', authenticateToken, async (req, res) => {

    try {
        let d = await User.find({
            _id: '5dc30c8e276f3b245c3ebcdc',

        }, {
            "expenses": {
                $elemMatch: {
                    "date": {
                        $gte: "2018-01-01"
                    }
                }
            }
        })

        res.send(d)
    } catch (err) {
        res.send(err)
    }

})


// Create One
router.post('/', authenticateToken, async (req, res) => {
    console.clear()
    dblog(req.body.expenses)
    // const expense = new User({
    //     date: Date.now(),
    //     expenses: req.body.expenses,
    //     notes: req.body.notes
    // })
    let day
    if( !req.body.date ) {
         day = spacetime.now('Asia/Dhaka').format('iso-utc')
    }

    try {
        const newExpense = await User.updateOne({
            "_id": req.authenticatedUser.id
        }, {
            "$push": {
                "expenses": {
                    date: day,
                    purpose: req.body.purpose,
                    amount: req.body.amount
                }
            }
        })
        res.status(201).json(newExpense)
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }
})

// Updating One
router.patch('/:id', authenticateToken, async (req, res) => {
    console.clear()
    dblog(req.body)

    // if (req.body.date) {
    //     res.expense.date = req.body.date
    // }
    // if (req.body.purpose) {
    //     res.expense.purpose = req.body.purpose
    // }
    // if (req.body.amount) {
    //     res.expense.amount = req.body.amount
    // }

    try {
        let updatedExpense = await User.updateOne({
            "expenses._id": req.params.id,
        }, {
            "$set": {
                "expenses.$.date": new Date(req.body.date),
                "expenses.$.purpose": req.body.purpose,
                "expenses.$.amount": req.body.amount
            }

        })
        if (updatedExpense) {
            res.json(updatedExpense).status(200)
        }


    } catch (err) {
        res.status(400).json({
            message: err.message
        })
    }
})

// Deleting One
router.delete('/user/:id', authenticateToken, async (req, res) => {

    try {
        let data = await User.expenses.findOneAndDelete({
            "_id": req.params.id
        })
        if (data) {
            res.send({
                message: 'User Deleted'
            })
        }
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

router.delete('/:id', authenticateToken, async (req, res) => {

    try {
        let data = await User.update({
            "_id": req.authenticatedUser.id
        }, {
            $pull: {
                "expenses": {
                    "_id": req.params.id
                }
            }
        }, {
            multi: false
        })
        if (data) {
            res.send({
                message: 'expense Deleted'
            })
        }
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

// Get single user middleware
async function getUser(req, res, next) {
    let expense
    try {
        expense = await User.findById(req.params.id)
        console.clear()
        if (expense == null) {
            return res.status(404).json({
                message: 'No matched data found'
            })
        }
    } catch (err) {
        return res.status(500).json({
            message: err.message
        })
    }

    res.expense = expense
    next()
}

function authenticateToken(req, res, next) {

    const authHeader = req.headers['authorization']

    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, user) => {
        if (err) return res.sendStatus(403)

        req.authenticatedUser = user
        next()
    })
}

module.exports = router