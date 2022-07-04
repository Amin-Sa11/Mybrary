const express = require('express');
const router = express.Router();
const Author = require('../models/author');
const Book = require('../models/book');
const path = require('path');
const fs = require('fs');
const { json } = require('body-parser');
// const uploadPath = path.join('public', Book.coverImageBasePath);
// const multer  = require('multer');
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
// const upload = multer({ 
//     dest: uploadPath,
//     fileFilter: (req, file, callBack) => {
//         callBack(null, imageMimeTypes.includes(file.mimetype));
//     } 
// });

router.get('/', async (req, res) => {
    let query = Book.find();

    if(req.query.title != null && req.query.title != ''){
        query = query.regex('title', new RegExp(req.query.title, 'i'));
    }
    if(req.query.publishedBefore != null && req.query.publishedBefore != ''){
        query = query.lte('publishDate', req.query.publishedBefore);
    }
    if(req.query.publishedAfter != null && req.query.publishedAfter != ''){
        query = query.gte('publishDate', req.query.publishedAfter);
    }

    try{
        const books = await query.exec();
        res.render('books/index', {books: books, searchOptions: req.query});
    }catch{
        res.redirect('/');
    }
})

router.get('/new', async (req, res) => {
    renderNewPage(res, new Book());
})

router.post('/', async (req, res)=>{
    // const fileName = req.file != null ? req.file.filename : null;
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        // coverImageName: fileName,
        description: req.body.description
    })
    saveCover(book, req.body.cover);

    try{
        const newBook = await book.save();
        res.redirect(`books/${newBook.id}`);
    }catch{
        // if(book.coverImageName != null) {removeBookCover(book.coverImageName)};
        renderNewPage(res, book, true);
    }
})

// function removeBookCover(fileName){
//     fs.unlink(path.join(uploadPath, fileName), (err) => {console.error(err)});
// }

//show book route:
router.get('/:id', async (req, res)=>{
    try{
        const book = await Book.findById(req.params.id).populate('author').exec();
        res.render('books/show', {book: book})
    }catch{
        res.redirect('/');
    }
})

//Edit book route:
router.get('/:id/edit', async(req,res)=>{
    try{
        const book = await Book.findById(req.params.id);
        renderEditPage(res, book)
    }catch{
        res.redirect('/');
    }
})

//Update book route:
router.put('/:id', async (req, res)=>{
    let book;
    try{
        book = await Book.findById(req.params.id);
        book.title = req.body.title;
        book.author = req.body.author;
        book.publishDate = new Date(req.body.publishDate);
        book.pageCount = req.body.pageCount;
        book.description = req.body.description;
        if(req.body.cover != null && req.body.cover!= ''){
            saveCover(book, req.body.cover);
        }
        await book.save();
        res.redirect(`/books/${book.id}`);
    }catch{
        if(book != null){
            renderEditPage(res, book, true);
        }else{
            res.redirect('/');
        }
    }
})


//Delete book router:
router.delete('/books/:id', async (req, res) => {
    let book;
    try{
        book = Book.findById(req.params.id);
        await book.remove();
        res.redirect('/books');
    }catch{
        if(book != null){
            res.render('books/show', {book: book, errorMessage: 'Could not remove the book'});
        }else{
            res.redirect('/');
        }
    }
})

async function renderNewPage(res, book, hasError){
    renderFormPage(res, book, 'new', hasError);
}

async function renderEditPage(res, book, hasError){
    renderFormPage(res, book, 'edit', hasError);
}

async function renderFormPage(res, book, form, hasError = false){
    try{
        const author = await Author.find({});
        const params = {author:author, book: book};
        if(hasError){
            if(form === 'edit'){
                params.errorMessage = 'Error Updating Book';
                }else{
                    params.errorMessage = 'Error Creating Book';
                }
        }
        res.render(`books/${form}`, params);
    }catch{
        res.redirect('/books');
    }
}

function saveCover(book, coverEncoded){
    if(coverEncoded == null) return
    const cover = JSON.parse(coverEncoded);
    if(cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data, 'base64');
        book.coverImageType = cover.type;
    }
}

module.exports = router;