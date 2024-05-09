import express from "express";
import multer from "multer";
import excelToJson from "convert-excel-to-json";
import fs from "fs-extra";
import cors from "cors";

import { PdfReader } from "pdfreader";

const app = express();
app.use(cors());

const pdfReader = new PdfReader();

const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 3002;

app.post("/read", upload.single("new"), async (req, res) => {
  console.log(req, "requested file");
  try {
    if (req.file?.filename === null || req.file?.filename === "undefined") {
      res.status(400).json("No file");
    } else {
      const filepath = "uploads/" + req.file.filename;
      const fileExtension = req.file.mimetype;

      if (
        fileExtension ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        // Parse Excel file
        const excelData = excelToJson({
          sourceFile: filepath,
          header: {
            rows: 1,
          },
          columnToKey: {
            "*": "{{columnHeader}}",
          },
        });
        fs.remove(filepath);
        res.status(200).json(excelData);
      } else if (fileExtension === "application/pdf") {
        // let pdftext = "";
        // pdfReader.parseFileItems(filepath, (err, item) => {
        //   if (err) console.error("error", err);
        //   else if (!item) console.warn("end of file");
        //   else if (item.text) {
        //     pdftext += item.text + "";
        //   }
        // });
        const pdfText = await parsePDF(filepath);
        console.log("pdf text -->", pdfText);
        fs.remove(filepath);
        res.status(200).json({ text: pdfText });
      }
    }
  } catch (err) {
    res.status(500);
  }
});

function parsePDF(filepath) {
  return new Promise((resolve, reject) => {
    const pdfReader = new PdfReader();
    let pdfText = "";

    pdfReader.parseFileItems(filepath, (err, item) => {
      if (err) reject(err);
      else if (!item) {
        resolve(pdfText);
      } else if (item.text) {
        pdfText += item.text + "";
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
