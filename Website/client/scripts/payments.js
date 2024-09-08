const BASE_URL = 'http://localhost:3000';

// Function to make a payment
async function makePayment(event) {
    event.preventDefault(); 

    // Extract payment details from form
    const amount = document.getElementById('amount').value;
    const paymentStatus = document.getElementById('paymentStatus');

    try {
        const response = await fetch(`${BASE_URL}/payAPI/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: amount })
        });

        const result = await response.json();

        if (response.status === 200) {
            paymentStatus.style.color = 'green';
            paymentStatus.innerHTML = 'Payment Successful!';
        } else {
            paymentStatus.style.color = 'red';
            paymentStatus.innerHTML = `Payment Failed: ${result.Payment}`;
        }
    } catch (err) {
        console.error(err);
        paymentStatus.style.color = 'red';
        paymentStatus.innerHTML = 'An error occurred while making the payment';
    }
}

async function getBalance()  {
    const balance = document.getElementById('balance');

    try{
        const response = await fetch(`${BASE_URL}/payAPI/balance`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if(response.ok) {
            const result = await response.json();
            balance.innerHTML = `Balance: ${result.Balance}`;
        } else {
            balance.innerHTML = 'An error occurred while fetching the balance';
        }
    }catch(err) {
        console.error(err);
        balance.innerHTML = 'An error occurred while fetching the balance';
    }
}

getBalance();
document.getElementById('paymentForm').addEventListener('submit', makePayment);


