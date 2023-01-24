

const express = require('express')
const app = express()
const multer = require('multer')
const upload = multer({ dest: 'images/' })
const database = require('./database');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");




const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.ACCESS_KEY
const secretAccessKey = process.env.SECRET_ACCESS_KEY

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey
  },
  region: bucketRegion
});



require('dotenv').config()

const fs = require('fs')

app.set('view engine', 'ejs')

app.get("/", async (req, res) => {
    const images = await database.getImages()
    res.render("index", { images })
  })

 app.post('/saveImage', upload.single('image'), async (req, res) => {
    const params = {
      Bucket: bucketName,
      Key: req.file.originalname,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }
    const command = new PutObjectCommand(params)
    const imagePath = req.file.path
    const description = req.body.description
    database.addImage(imagePath, description);
    await s3.send(command)
    res.render('savedImage', {description, imagePath})
})

app.get('/image/:id'), (req,res) => {
    const id = req.body.id
    const image = database.getImage(id);
    res.render('singleImage', {image});
}

app.get('/images/:imageName', (req, res) => {

  
    const imageName = req.params.imageName
    const readStream = fs.createReadStream(`images/${imageName}`)
    readStream.pipe(res)
  })

app.listen(8080, () => console.log("listening on port 8080"))