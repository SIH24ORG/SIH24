document.getElementById('data-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const inputData = document.getElementById('data-input').value;

    fetch('http://localhost:5000/submit-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: inputData }),
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('response').textContent = data.message;
    })
    .catch(error => console.error('Error:', error));
});
