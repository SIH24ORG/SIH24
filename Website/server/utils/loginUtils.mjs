import dotenv from 'dotenv';

dotenv.config();

const USERNAME = process.env.USER;
const PASSWORD = process.env.PASSWORD;


export function verifyLogin(username, password) {
  if(username === USERNAME && password === PASSWORD){
    console.log('Login successful');
    return true;
  }else{
    console.log('Login failed');
    return false;
  }
}
