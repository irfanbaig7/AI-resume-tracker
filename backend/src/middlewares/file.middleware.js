
const multer = require("multer")

 
const uploade = multer({
    storage : multer.memoryStorage(),
    limits : {
        fileSize : 6 * 1024 * 1024, // file size should be 3 mb
    }

})

module.exports = uploade
