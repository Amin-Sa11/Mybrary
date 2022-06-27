const express = require('express');
const router = express.Router();
const Author = require('../models/author');
const Book = require('../models/book')

// All Authors Route
router.get('/', async (req, res) => {
    let searchOptions = {};
    let searchInput = req.query.name;
    if(searchInput != null && searchInput != ''){
        searchOptions.name = new RegExp(searchInput, 'i');
    }
    try{
        const authors = await Author.find(searchOptions);
        res.render('authors/index', {authors: authors, searchOptions: searchInput});
    }catch{
        res.redirect('/');
    }
})

// New Author Route
router.get('/new', (req, res) => {
    res.render('authors/new', {author: new Author()})
})

// Create Author route
router.post('/', async (req, res) => {
    const author = new Author({
        name : req.body.name
    })
    try{
        const newAuthor = await author.save();
        // res.redirect(`authors/${newAuthor.id}`);
        res.redirect(`authors`);
    } catch{
        res.render('authors/new', {
            author: author,
            errorMessage : 'Error Creating Author'
        })
    }

    // author.save((err, newAuthor) => {
    //     if(err){
    //         res.render('authors/new', {
    //             author: author,
    //             errorMessage : 'Error Creating Author'
    //         })
    //     }else{
    //         // res.redirect(`authors/${newAuthor.id}`)
    //         res.redirect(`authors`)
    //     }
    // })
})

module.exports = router;