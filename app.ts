import { Request, Response, Application } from "express";
import express = require("express");
require('dotenv').config()
import dynamo from 'aws-sdk/clients/dynamodb';
import cors from 'cors';

const _tableName = "greendoors";

const x = new dynamo.DocumentClient({
  region: "eu-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});
const app: Application = express();
app.use(express.json())  
app.use(cors())  
const port = 4000;

app.get("/health-check", (req: Request, res: Response) => {
  res.json("Server is working");
});

app.post("/record/add", async (req: Request, res: Response) => {
  const record = req.body;
  record.RecordId = +Math.random().toString().substring(2, 8);
  try {
    await x.put({
      TableName: _tableName,
      Item: record
    }).promise();
    res.status(201).send();
  } catch(e) {
    if (e.code === "ValidationException") {
      res.status(400).send({
        success: false,
        errorType: "ValidationException",
        message: e.message
      }) 
    }
    res.status(500).send({
      success: false,
      errorType: e.code,
      message: e.message
    })
  }
});

app.get("/record/list", async (req: Request, res: Response) => {
  try {
    const result = await x.scan({
      TableName: _tableName
    }).promise();
    res.send({
      items: result.Items,
      error: {
        status: false,
        message: undefined
      }
    })
  } catch(e) {
    res.status(500).send({
      success: false,
      errorType: e.code,
      message: e.message
    })
  }
});

app.put("/record/edit", async (req: Request, res: Response) => {
  const data = req.body;
  try {
    await x.put({
      TableName: _tableName,
      Item: {
        colour: data?.colour,
        make: data?.make,
        code: data?.code,
        name: data?.name,
        RecordId: data.recordId
      }
    }).promise();
    res.status(204).send();
  } catch(e) {
    if (e.code === "ValidationException") {
      res.status(400).send({
        success: false,
        errorType: "ValidationException",
        message: e.message
      }) 
    }
    res.status(500).send({
      success: false,
      errorType: e.code,
      message: e.message
    })
  }
});

app.delete("/record/:id/delete", async (req: Request, res: Response) => {
  try {
    await x.delete({
      TableName: _tableName,
      Key: {
        RecordId: Number(req.params.id)
      }
    }).promise();
    res.status(200).send();
  } catch(e) {
    if (e.code === "ValidationException") {
      res.status(400).send({
        success: false,
        errorType: "ValidationException",
        message: e.message
      }) 
    } else {
      res.status(500).send({
        success: false,
        errorType: e.code,
        message: e.message
      })
    }
  }
});

app.listen(port, () => {
  return console.log(`Server listening at http://localhost:${port}`);
});
