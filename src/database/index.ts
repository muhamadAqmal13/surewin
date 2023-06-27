import mongoose from 'mongoose';
import { Config } from '../config';

const config = new Config()
const uri = config.uriMongoDb;

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to database');
  })
  .catch((error) => {
    console.error('Error connecting to database:', error);
  });