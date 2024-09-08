const BASE_URL = 'http://localhost:3000';

async function loginVerify(event) {
    event.preventDefault(); 

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log(username + " " + password);

    try {
        const response = await fetch(`${BASE_URL}/loginApi/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        let status = await response.json();
        const loginStatus = document.getElementById('loginStatus');

        console.log(status);

        if (status.Login == 'successful') {
            loginStatus.style.color = 'green';
            loginStatus.innerHTML = 'Login Successful';
            window.location.href = './pages/payment.html';
        } else {
            loginStatus.style.color = 'red';
            loginStatus.innerHTML = 'Login Failed';
        }
    } catch (err) {
        console.error(err);
        const loginStatus = document.getElementById('loginStatus');
        loginStatus.style.color = 'red';
        loginStatus.innerHTML = 'An error occurred';
    }
}
