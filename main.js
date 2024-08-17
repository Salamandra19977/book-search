var currentPage = 1
var itemsPerPage = 10
var savedBooks = []

$("#pages").hide()

loadSavedBooks()

$('#search').on('click', function() {
    loadData(currentPage)
})

$('#nextPageButton').on('click', function() {
    currentPage++
    loadData(currentPage)
})

$('#prevPageButton').on('click', function() {
    if (currentPage > 1) {
        currentPage--
        loadData(currentPage)
    }
})

$(document).on('click', '#save', function() {
    saveBook(parseBook($(this).closest(".book")))
})

$(document).on('click', '#delete', function() {
    bookElement = $(this).closest(".book")
    removeSavedBook(parseBook(bookElement))
    bookElement.remove()
})

$(document).on('click', '#show', function() {
    $(this).parent().find("#additional-information").toggle()
})

function loadSavedBooks() {
    if(localStorage.getItem("books") != null) {
        books = JSON.parse(localStorage.getItem("books"))
        savedBooks = books
        $.each(books, function(index, book) {
            templateAddBook(book, ".saved-books")         
        })
    }
}


function loadData(page) {
    const q = $('#q').val()
    
    if (q !== '') {
        $.ajax({
            url: `https://openlibrary.org/search.json?q=${q}`,
            method: 'GET',
            dataType: 'json',
            data: {
                page: page,
                limit: itemsPerPage
            },
            beforeSend: function() {
                toggleSearchSpinner(true)
            },
            success: function(data) {
                setBooks(data)
                toggleSearchSpinner(false)
            },
            error: function(status, error) {
                alertify.error(`Error: ${status} - ${error}`)
                toggleSearchSpinner(false)
            }
        })
    } else {
        alert("Query is empty")
    }
}

function toggleSearchSpinner(show) {
    if (show) {
        $("#search, .spinner-border").toggle()
    } else {
        $(".spinner-border").hide()
        $("#search").show()
    }
}

function setBooks(data) {
    controlUI(data)
    if (data['docs'].length) {
        for(let i = 0; i < data['docs'].length; i++){
            templateAddBook(data['docs'][i], ".books")
        }        
    }
    else {
        alertify.error("not found")
    }
}

function templateAddBook(book, container) {
    btn = '<button id="save">Save</button>'
    img = `<img src="${getImage(book)}">`
    if (container == ".saved-books") {
        btn = '<button id="delete">Delete</button>'
    }

    $(container).append(`
        <div class="book">`+
            img + 
            `<p id="author_name">Author name: ${formatedField(book['author_name'])}</p>
            <p id="title">Title: ${formatedField(book['title'])}</p>
            <button id="show">Additional information</button>
            <div id="additional-information">
                <p id="isbn">ISBN: ${formatedField(book['isbn'])}</p>
                <p id="publish_year">Publish year: ${formatedField(book['publish_year'])}</p>
                <p id="publisher">Publisher: ${formatedField(book['publisher'])}</p>
                <p id="publish_place">Publish place: ${formatedField(book['publish_place'])}</p>
            </div>`+
            btn +
        `</div>`)
}

function formatedField(field) {
    if (Array.isArray(field)) {
        return field.join(', ')
    } else {
        return field
    }
}

function getImage(book) {
    isbn = book['isbn']
    urlImage = null
    if (Array.isArray(isbn)) {
        return `https://covers.openlibrary.org/b/isbn/${isbn[0]}-L.jpg`
    } else if (typeof isbn === 'string') {
        return `https://covers.openlibrary.org/b/isbn/${isbn.split(', ')[0].trim()}-L.jpg`
    } else {
        return "https://covers.openlibrary.org/b/isbn/9780596518264-L.jpg"
    }
}

// pagination
function controlUI(data) {
    $("#pages").show()
    $('.books').empty()
    if (data['numFound'] > 10) {
        $("#numberPage").text(`${currentPage} - ${Math.floor(data['numFound'] / 10) }`)
    }
    else {
        $("#pages").hide()
    }
}

function saveBook(book) {
    if (getSavedBookIndex(book) !== -1) {
        alertify.error("already saved")
    } else {
        templateAddBook(book, ".saved-books")
        savedBooks.push(book)
        alertify.success('saved')
    }

    localStorage.setItem("books", JSON.stringify(savedBooks))
}

function removeSavedBook(book) {
    if (getSavedBookIndex(book) !== -1) {
        savedBooks.splice(getSavedBookIndex(book), 1)
        localStorage.setItem("books", JSON.stringify(savedBooks))
    }
}
function parseBook(bookElement) {
    book = {
        "isbn": bookElement.find("#isbn").text().split("ISBN: ")[1],
        "author_name": bookElement.find("#author_name").text().split("Author name: ")[1],
        "title": bookElement.find("#title").text().split("Title: ")[1],
        "publish_year": bookElement.find("#publish_year").text().split("Publish year: ")[1],
        "publisher": bookElement.find("#publisher").text().split("Publisher: ")[1],
        "publish_place": bookElement.find("#publish_place").text().split("Publish place: ")[1]
    }

    return book
}

function getSavedBookIndex(book) {
    return savedBooks.findIndex(savedBook => {
        return savedBook.author_name === book.author_name &&
               savedBook.title === book.title &&
               savedBook.publish_year === book.publish_year &&
               savedBook.publisher === book.publisher &&
               savedBook.publish_place === book.publish_place
    })
}