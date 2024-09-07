import fs from 'fs';
 
export function pay(amount) {
  try{
    const file = fs.readFileSync('./db/files/paymentStore.json');
    const data = JSON.parse(file);
  
    data.balance = (data.balance >= amount)? data.balance - amount : amount;
  
    fs.writeFileSync('./db/files/paymentStore.json', JSON.stringify(data));
  
    console.log('Payment successful');
  }catch(err){
    console.log('Payment failed: '+err.message);
    return;
  }
}

export function getBalance() {
  try{
    const file = fs.readFileSync('./db/files/paymentStore.json');
    const data = JSON.parse(file);
  
    console.log('Balance:', data.balance);

    return data.balance;
  }catch(err){
    console.log('Error:', err.message);
    return;
  }
}
